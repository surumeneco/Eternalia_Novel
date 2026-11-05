import {
  CanActivate, ExecutionContext, Injectable, UnauthorizedException,
} from '@nestjs/common';
import { DiscordAuthService } from './discord-auth.service';

@Injectable()
export class AuthorGuard implements CanActivate {
  constructor(private readonly auth: DiscordAuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{
      method: string;
      headers: { cookie?: string; origin?: string; 'content-type'?: string };
    }>();
    if (!await this.auth.isAuthor(request.headers)) {
      throw new UnauthorizedException('作者認証が必要です。');
    }
    if (!['GET','HEAD','OPTIONS'].includes(request.method)) {
      this.auth.assertWriteOrigin(request.headers);
    }
    return true;
  }
}
