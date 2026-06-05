import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { User } from '@generated/prisma/client';
import { PrismaService } from '@infrastructure/database/prisma.service';
import { verifyPassword } from '@common/utils/password';
import { generateRefreshToken, generateTokenFamily, hashToken } from '@common/utils/token.util';
import type { JwtPayload } from './jwt.strategy';
import { LoginDto } from './dto/login.dto';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  user: { id: string; email: string; name: string; role: User['role'] };
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async login(dto: LoginDto): Promise<AuthTokens> {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user || !(await verifyPassword(dto.password, user.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return this.issueTokens(user, generateTokenFamily());
  }

  /**
   * Rotate the refresh token. Implements reuse detection: a token is revoked the
   * moment it is rotated (revokedAt set) but kept on record. If an already-revoked
   * token is presented again, that signals theft — the entire family is wiped so
   * the attacker and victim are both logged out.
   */
  async refresh(rawToken: string | undefined): Promise<AuthTokens> {
    if (!rawToken) throw new UnauthorizedException('Missing refresh token');

    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash: hashToken(rawToken) },
      include: { user: true },
    });
    if (!stored) throw new UnauthorizedException('Invalid refresh token');

    if (stored.revokedAt) {
      this.logger.warn(
        `Refresh token reuse detected for user ${stored.userId}; revoking token family`,
      );
      await this.prisma.refreshToken.deleteMany({ where: { familyId: stored.familyId } });
      throw new UnauthorizedException('Refresh token reuse detected');
    }

    if (stored.expiresAt < new Date()) {
      await this.prisma.refreshToken.delete({ where: { id: stored.id } });
      throw new UnauthorizedException('Expired refresh token');
    }

    // Mark the presented token revoked, then issue a new one in the same family.
    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });
    return this.issueTokens(stored.user, stored.familyId);
  }

  /** Revoke the whole family the token belongs to. Idempotent — never throws. */
  async logout(rawToken: string | undefined): Promise<void> {
    if (!rawToken) return;
    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash: hashToken(rawToken) },
      select: { familyId: true },
    });
    if (stored) {
      await this.prisma.refreshToken.deleteMany({ where: { familyId: stored.familyId } });
    }
  }

  /** Days the refresh token (and its cookie) stays valid. */
  get refreshTtlDays(): number {
    return this.config.get<number>('app.jwt.refreshExpiresInDays') ?? 7;
  }

  private async issueTokens(user: User, familyId: string): Promise<AuthTokens> {
    const payload: JwtPayload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = await this.jwt.signAsync(payload);

    const refreshToken = generateRefreshToken();
    const expiresAt = new Date(Date.now() + this.refreshTtlDays * 24 * 60 * 60 * 1000);
    await this.prisma.refreshToken.create({
      data: { userId: user.id, familyId, tokenHash: hashToken(refreshToken), expiresAt },
    });

    return {
      accessToken,
      refreshToken,
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    };
  }
}
