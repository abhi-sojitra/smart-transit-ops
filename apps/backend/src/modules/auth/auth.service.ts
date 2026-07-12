import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { createHash, randomUUID, timingSafeEqual } from 'crypto';
import {
  RoleCode,
  UserAccountStatus,
  type AuthTokens,
  type JwtPayload,
  type RefreshTokenPayload,
} from '@transitops/shared-types';
import { UserRepository } from '../../repositories/user.repository';
import { RoleDocument } from '../../schemas/role.schema';
import { UserDocument } from '../../schemas/user.schema';

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UserRepository,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async login(email: string, password: string): Promise<AuthTokens> {
    const user = await this.users.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (user.status !== UserAccountStatus.ACTIVE) {
      throw new ForbiddenException('User account is inactive');
    }

    const passwordValid = await bcrypt.compare(password, user.passwordHash);
    if (!passwordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    await this.users.recordLoginSuccess(String(user._id));
    return this.issueTokens(user);
  }

  /**
   * Rotates refresh tokens on every successful refresh.
   * If a previously rotated token is presented again, revoke the session.
   */
  async refresh(refreshToken: string): Promise<AuthTokens> {
    let payload: RefreshTokenPayload;
    try {
      payload = await this.jwt.verifyAsync<RefreshTokenPayload>(refreshToken, {
        secret: this.getRefreshSecret(),
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const user = await this.users.findById(payload.sub);
    if (!user || user.status !== UserAccountStatus.ACTIVE) {
      throw new UnauthorizedException('User not found or inactive');
    }

    if (!user.refreshTokenHash) {
      throw new UnauthorizedException('Refresh token has been revoked');
    }

    const matches = this.refreshTokenMatches(refreshToken, user.refreshTokenHash);
    if (!matches) {
      // Possible stolen-token reuse after rotation — invalidate session
      await this.users.clearRefreshToken(String(user._id));
      throw new UnauthorizedException('Refresh token reuse detected. Please sign in again.');
    }

    return this.issueTokens(user);
  }

  async logout(userId: string): Promise<{ loggedOut: boolean }> {
    if (!userId || userId === 'unknown') {
      return { loggedOut: false };
    }
    await this.users.clearRefreshToken(userId);
    return { loggedOut: true };
  }

  getAccessSecret() {
    return this.config.getOrThrow<string>('JWT_SECRET');
  }

  getRefreshSecret() {
    return this.config.getOrThrow<string>('JWT_REFRESH_SECRET');
  }

  private async issueTokens(user: UserDocument): Promise<AuthTokens> {
    const roles = this.extractRoleCodes(user);
    const accessPayload: JwtPayload = {
      sub: String(user._id),
      email: user.email,
      roles,
    };

    const accessExpiresIn = this.config.get<string>('JWT_EXPIRES_IN', '15m');
    const refreshExpiresIn = this.config.get<string>('JWT_REFRESH_EXPIRES_IN', '7d');

    const accessToken = await this.jwt.signAsync(accessPayload, {
      secret: this.getAccessSecret(),
      expiresIn: accessExpiresIn as `${number}${'s' | 'm' | 'h' | 'd'}`,
    });

    const refreshPayload: RefreshTokenPayload = {
      sub: String(user._id),
      tokenId: randomUUID(),
    };

    const refreshToken = await this.jwt.signAsync(refreshPayload, {
      secret: this.getRefreshSecret(),
      expiresIn: refreshExpiresIn as `${number}${'s' | 'm' | 'h' | 'd'}`,
    });

    // SHA-256 (not bcrypt): JWT refresh tokens exceed bcrypt's 72-byte input limit,
    // so bcrypt would ignore the unique suffix and make rotation reuse-detection fail.
    await this.users.update(String(user._id), {
      refreshTokenHash: this.hashRefreshToken(refreshToken),
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: this.parseExpirySeconds(accessExpiresIn),
    };
  }

  private hashRefreshToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private refreshTokenMatches(token: string, storedHash: string): boolean {
    const incoming = Buffer.from(this.hashRefreshToken(token), 'utf8');
    const stored = Buffer.from(storedHash, 'utf8');
    if (incoming.length !== stored.length) return false;
    return timingSafeEqual(incoming, stored);
  }

  private extractRoleCodes(user: UserDocument): RoleCode[] {
    const roles = user.roles as unknown as Array<RoleDocument | string>;
    return roles
      .map((role) => {
        if (typeof role === 'string') return role as RoleCode;
        if (role && typeof role === 'object' && 'code' in role) {
          return role.code;
        }
        return null;
      })
      .filter((code): code is RoleCode => Boolean(code));
  }

  private parseExpirySeconds(value: string): number {
    const match = /^(\d+)([smhd])$/i.exec(value.trim());
    if (!match) return 900;
    const amount = Number(match[1]);
    const unit = match[2].toLowerCase();
    const multipliers: Record<string, number> = {
      s: 1,
      m: 60,
      h: 3600,
      d: 86400,
    };
    return amount * (multipliers[unit] ?? 60);
  }
}
