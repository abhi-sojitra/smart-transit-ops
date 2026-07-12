import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { RoleCode, UserAccountStatus, type AuthTokens, type JwtPayload } from '@transitops/shared-types';
import { UserRepository } from '../../repositories/user.repository';

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UserRepository,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async login(email: string, password: string): Promise<AuthTokens & { user: Record<string, unknown> }> {
    const user = await this.users.findByEmail(email);
    if (!user || user.status !== UserAccountStatus.ACTIVE) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const roles = (user.roles ?? [])
      .map((role) => {
        if (role && typeof role === 'object' && 'code' in role) {
          return (role as { code: RoleCode }).code;
        }
        return null;
      })
      .filter((code): code is RoleCode => Boolean(code));

    const tokens = await this.issueTokens(String(user._id), user.email, roles);
    await this.users.update(String(user._id), {
      refreshTokenHash: await bcrypt.hash(tokens.refreshToken, 10),
    });

    return {
      ...tokens,
      user: {
        id: String(user._id),
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        roles,
      },
    };
  }

  async refresh(refreshToken: string): Promise<AuthTokens> {
    try {
      const payload = await this.jwt.verifyAsync<{ sub: string; tokenId?: string }>(refreshToken, {
        secret: this.getRefreshSecret(),
      });
      const user = await this.users.findById(payload.sub);
      if (!user?.refreshTokenHash) {
        throw new UnauthorizedException('Invalid refresh token');
      }
      const matches = await bcrypt.compare(refreshToken, user.refreshTokenHash);
      if (!matches) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const roles = (user.roles ?? [])
        .map((role) => {
          if (role && typeof role === 'object' && 'code' in role) {
            return (role as { code: RoleCode }).code;
          }
          return null;
        })
        .filter((code): code is RoleCode => Boolean(code));

      const tokens = await this.issueTokens(String(user._id), user.email, roles);
      await this.users.update(String(user._id), {
        refreshTokenHash: await bcrypt.hash(tokens.refreshToken, 10),
      });
      return tokens;
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(userId: string) {
    const user = await this.users.findById(userId);
    if (!user) throw new NotFoundException('User not found');
    await this.users.update(userId, { refreshTokenHash: undefined });
    return { success: true };
  }

  getAccessSecret() {
    return this.config.getOrThrow<string>('JWT_SECRET');
  }

  getRefreshSecret() {
    return this.config.getOrThrow<string>('JWT_REFRESH_SECRET');
  }

  private async issueTokens(sub: string, email: string, roles: RoleCode[]): Promise<AuthTokens> {
    const accessExpires = this.config.get<string>('JWT_EXPIRES_IN', '15m');
    const refreshExpires = this.config.get<string>('JWT_REFRESH_EXPIRES_IN', '7d');

    const payload: JwtPayload = { sub, email, roles };
    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(payload, {
        secret: this.getAccessSecret(),
        expiresIn: accessExpires as `${number}${'s' | 'm' | 'h' | 'd'}`,
      }),
      this.jwt.signAsync(
        { sub, tokenId: `${Date.now()}` },
        {
          secret: this.getRefreshSecret(),
          expiresIn: refreshExpires as `${number}${'s' | 'm' | 'h' | 'd'}`,
        },
      ),
    ]);

    return {
      accessToken,
      refreshToken,
      expiresIn: 15 * 60,
    };
  }
}
