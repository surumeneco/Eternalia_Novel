import {
  Controller, Get, Post, Req, Res, UnauthorizedException,
} from '@nestjs/common';
import { DiscordAuthService } from './discord-auth.service';

type HttpRequest = {
  headers: { cookie?: string; origin?: string; 'content-type'?: string };
  query: Record<string, unknown>;
};
type HttpResponse = {
  setHeader(name: string, value: string | string[]): void;
  redirect(url: string): void;
};

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: DiscordAuthService) {}

  @Get('me')
  async me(@Req() request: HttpRequest) {
    return {
      configured: this.auth.configured,
      authenticated: await this.auth.isAuthor(request.headers),
    };
  }

  @Get('discord')
  async login(@Res() response: HttpResponse) {
    const { redirect, setCookie } = await this.auth.start();
    response.setHeader('Set-Cookie', setCookie);
    response.redirect(redirect);
  }

  @Get('discord/callback')
  async callback(@Req() request: HttpRequest, @Res() response: HttpResponse) {
    // OAuth state cookie must match the returned state. Consumed on first use.
    const { setCookie } = await this.auth.complete(request.headers, request.query);
    response.setHeader('Set-Cookie', [this.auth.clearOAuthCookie(), setCookie]);
    response.redirect((process.env.APP_ORIGIN || '') + '/studio');
  }

  @Post('logout')
  async logout(@Req() request: HttpRequest, @Res({ passthrough: true }) response: HttpResponse) {
    if (!await this.auth.isAuthor(request.headers)) throw new UnauthorizedException();
    this.auth.assertWriteOrigin(request.headers);
    await this.auth.logout(request.headers);
    response.setHeader('Set-Cookie', this.auth.clearSessionCookie());
    return { ok: true };
  }
}
