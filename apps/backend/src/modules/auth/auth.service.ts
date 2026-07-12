import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
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

    return this.issueTokens(user);
  }

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

    const matches = await bcrypt.compare(refreshToken, user.refreshTokenHash);
    if (!matches) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    return this.issueTokens(user);
  }

  async logout(userId: string): Promise<{ loggedOut: boolean }> {
    await this.users.update(userId, { refreshTokenHash: undefined });
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

    const refreshTokenHash = await bcrypt.hash(refreshToken, 12);
    await this.users.update(String(user._id), { refreshTokenHash });

    return {
      accessToken,
      refreshToken,
      expiresIn: this.parseExpirySeconds(accessExpiresIn),
    };
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
