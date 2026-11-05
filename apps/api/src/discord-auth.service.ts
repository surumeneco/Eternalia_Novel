/**
 * Server-side Discord Authorization Code + PKCE for ONE allowlisted author.
 * Cookies carry random opaque tokens; only SHA256 digests are stored.
 * No access/refresh token is retained beyond the immediate identity lookup.
 */
import {
  BadGatewayException, ForbiddenException, Injectable, OnModuleDestroy,
  ServiceUnavailableException, UnauthorizedException,
} from '@nestjs/common';
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { Pool } from 'pg';

type RequestHeaders = { cookie?: string; origin?: string; 'content-type'?: string };
type TokenResponse = { access_token?: string };
type UserResponse = { id?: string };
const sessionCookie = 'eternalia_author';
const stateCookie = 'eternalia_oauth_state';
const oneWeek = 7 * 24 * 60 * 60;

function digest(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}
function cookieValue(raw: string | undefined, name: string): string | null {
  const part = (raw || '').split(';').map(v => v.trim()).find(v => v.startsWith(name + '='));
  const value = part?.slice(name.length + 1) ?? null;
  return value && /^[0-9a-f]{48,128}$/.test(value) ? value : null;
}
function matchSecret(left: string, right: string): boolean {
  const a = Buffer.from(left), b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

@Injectable()
export class DiscordAuthService implements OnModuleDestroy {
  private readonly pool = process.env.DATABASE_URL ? new Pool({
    connectionString: process.env.DATABASE_URL, max: 3,
  }) : null;
  private readonly clientId = process.env.DISCORD_CLIENT_ID || '';
  private readonly clientSecret = process.env.DISCORD_CLIENT_SECRET || '';
  private readonly authorId = process.env.DISCORD_AUTHOR_USER_ID || '';
  private readonly origin = process.env.APP_ORIGIN || '';

  get configured(): boolean {
    return !!(this.pool && this.clientId && this.clientSecret &&
      /^\d{15,25}$/.test(this.authorId) && /^https?:\/\/[^/]+$/.test(this.origin));
  }
  private requirePool(): Pool {
    if (!this.configured || !this.pool) throw new ServiceUnavailableException('Discord認証が設定されていません。');
    return this.pool;
  }
  private get redirectUri(): string {
    return this.origin + '/api/auth/discord/callback';
  }
  private cookie(name: string, token: string, maxAge: number, path: string): string {
    const secure = this.origin.startsWith('https://') ? '; Secure' : '';
    return `${name}=${token}; Path=${path}; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure}`;
  }
  clearOAuthCookie(): string {
    return this.cookie(stateCookie, '', 0, '/api/auth/discord/callback');
  }
  clearSessionCookie(): string {
    return this.cookie(sessionCookie, '', 0, '/');
  }
  async start(): Promise<{ redirect: string; setCookie: string }> {
    const pool = this.requirePool();
    // Expired one-time OAuth states and author sessions are never reusable.
    await pool.query('DELETE FROM oauth_states WHERE expires_at < NOW()');
    await pool.query('DELETE FROM author_sessions WHERE expires_at < NOW()');
    const state = randomBytes(32).toString('hex');
    const verifier = randomBytes(32).toString('base64url');
    const challenge = createHash('sha256').update(verifier).digest('base64url');
    await pool.query(
      "INSERT INTO oauth_states(state_digest,code_verifier,expires_at) VALUES ($1,$2,NOW() + INTERVAL '10 minutes')",
      [digest(state), verifier],
    );
    const url = new URL('https://discord.com/oauth2/authorize');
    url.search = new URLSearchParams({
      response_type: 'code', client_id: this.clientId, redirect_uri: this.redirectUri,
      scope: 'identify', state, code_challenge: challenge, code_challenge_method: 'S256',
    }).toString();
    return { redirect: url.toString(), setCookie: this.cookie(stateCookie,state,600,'/api/auth/discord/callback') };
  }

  async complete(headers: RequestHeaders, query: Record<string, unknown>): Promise<{ setCookie: string }> {
    const pool = this.requirePool();
    const provided = typeof query.state === 'string' ? query.state : '';
    const stored = cookieValue(headers.cookie,stateCookie);
    const code = typeof query.code === 'string' ? query.code : '';
    if (!stored || !/^[0-9a-f]{64}$/.test(provided) || !matchSecret(stored,provided)
      || !code || code.length > 2048 || (query.iss !== undefined && query.iss !== 'https://discord.com')) {
      throw new UnauthorizedException('OAuth認可応答が不正です。');
    }
    const result = await pool.query<{ code_verifier: string }>(
      'DELETE FROM oauth_states WHERE state_digest=$1 AND expires_at > NOW() RETURNING code_verifier',
      [digest(provided)],
    );
    if (result.rows.length !== 1) throw new UnauthorizedException('OAuth認可状態が失効しました。');
    let access: string;
    try {
      const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: 'Basic ' + Buffer.from(this.clientId + ':' + this.clientSecret).toString('base64'),
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code', code, redirect_uri: this.redirectUri,
          code_verifier: result.rows[0].code_verifier,
        }),
        signal: AbortSignal.timeout(10000),
      });
      if (!tokenResponse.ok) throw new Error('Token exchange failed');
      const token = await tokenResponse.json() as TokenResponse;
      if (!token.access_token) throw new Error('Missing token');
      access = token.access_token;
    } catch {
      throw new BadGatewayException('Discord認証応答を取得できませんでした。');
    }
    let userId: string | undefined;
    try {
      const userResponse = await fetch('https://discord.com/api/users/@me', {
        headers: { Authorization: 'Bearer ' + access },
        signal: AbortSignal.timeout(10000),
      });
      if (!userResponse.ok) throw new Error('Identity lookup failed');
      userId = (await userResponse.json() as UserResponse).id;
    } catch {
      throw new BadGatewayException('Discordユーザー情報を取得できませんでした。');
    }
    if (userId !== this.authorId) throw new ForbiddenException('作者として許可されていません。');
    const sessionToken = randomBytes(32).toString('hex');
    await pool.query(
      "INSERT INTO author_sessions(session_digest,discord_user_id,expires_at) VALUES ($1,$2,NOW() + INTERVAL '7 days')",
      [digest(sessionToken), userId],
    );
    return { setCookie: this.cookie(sessionCookie,sessionToken,oneWeek,'/') };
  }

  async isAuthor(headers: RequestHeaders): Promise<boolean> {
    if (!this.configured || !this.pool) return false;
    const raw = cookieValue(headers.cookie, sessionCookie);
    if (!raw || raw.length !== 64) return false;
    const result = await this.pool.query(
      'SELECT 1 FROM author_sessions WHERE session_digest=$1 AND discord_user_id=$2 AND expires_at > NOW() LIMIT 1',
      [digest(raw), this.authorId],
    );
    return (result.rowCount ?? 0) > 0;
  }
  assertWriteOrigin(headers: RequestHeaders): void {
    if (!this.configured || headers.origin !== this.origin ||
      !headers['content-type']?.toLowerCase().startsWith('application/json')) {
      throw new ForbiddenException('許可されていない変更要求です。');
    }
  }
  async logout(headers: RequestHeaders): Promise<void> {
    const raw = cookieValue(headers.cookie,sessionCookie);
    if (raw && this.pool) {
      await this.pool.query('DELETE FROM author_sessions WHERE session_digest=$1', [digest(raw)]);
    }
  }
  async onModuleDestroy(): Promise<void> { await this.pool?.end(); }
}
