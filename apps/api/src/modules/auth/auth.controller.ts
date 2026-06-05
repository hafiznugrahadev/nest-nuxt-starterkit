import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Throttle } from '@nestjs/throttler';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { Public } from '@common/decorators/public.decorator';
import { CurrentUser, type AuthUser } from '@common/decorators/current-user.decorator';
import { AuthService, type AuthTokens } from './auth.service';
import { LoginDto } from './dto/login.dto';

/** httpOnly cookie holding the opaque refresh token — never readable from JS. */
const REFRESH_COOKIE = 'refresh_token';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  private readonly cookiePath: string;

  constructor(
    private readonly authService: AuthService,
    private readonly config: ConfigService,
  ) {
    const prefix = this.config.get<string>('app.apiPrefix') ?? 'api';
    this.cookiePath = `/${prefix}/auth`;
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login, obtain an access token and a refresh cookie' })
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const tokens = await this.authService.login(dto);
    return this.respondWithTokens(tokens, res);
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Exchange the refresh cookie for a new access token' })
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const raw = req.cookies?.[REFRESH_COOKIE] as string | undefined;
    const tokens = await this.authService.refresh(raw);
    return this.respondWithTokens(tokens, res);
  }

  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Revoke the refresh token and clear the cookie' })
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const raw = req.cookies?.[REFRESH_COOKIE] as string | undefined;
    await this.authService.logout(raw);
    res.clearCookie(REFRESH_COOKIE, { path: this.cookiePath });
    return { success: true };
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get the currently authenticated user' })
  me(@CurrentUser() user: AuthUser) {
    return user;
  }

  /** Set the refresh cookie and return the access token + user in the body. */
  private respondWithTokens(tokens: AuthTokens, res: Response) {
    const secure = this.config.get<boolean>('app.cookie.secure') ?? false;
    res.cookie(REFRESH_COOKIE, tokens.refreshToken, {
      httpOnly: true,
      secure,
      sameSite: secure ? 'none' : 'lax',
      path: this.cookiePath,
      maxAge: this.authService.refreshTtlDays * 24 * 60 * 60 * 1000,
    });
    return { accessToken: tokens.accessToken, user: tokens.user };
  }
}
