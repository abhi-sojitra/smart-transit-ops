import { Injectable, NotImplementedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UserRepository } from '../../repositories/user.repository';

/**
 * Auth scaffolding only — login / refresh / logout will be implemented later.
 */
@Injectable()
export class AuthService {
  constructor(
    private readonly _users: UserRepository,
    private readonly _jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async login(_email: string, _password: string) {
    throw new NotImplementedException('Authentication login is not implemented yet');
  }

  async refresh(_refreshToken: string) {
    throw new NotImplementedException('Refresh token flow is not implemented yet');
  }

  async logout(_userId: string) {
    throw new NotImplementedException('Logout is not implemented yet');
  }

  /** Placeholder helper for future JWT issuance */
  getAccessSecret() {
    return this.config.getOrThrow<string>('JWT_SECRET');
  }

  getRefreshSecret() {
    return this.config.getOrThrow<string>('JWT_REFRESH_SECRET');
  }

  /** Reserved for future token signing */
  getJwtService() {
    return this._jwt;
  }

  getUserRepository() {
    return this._users;
  }
}
