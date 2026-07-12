export enum RoleCode {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  FLEET_MANAGER = 'FLEET_MANAGER',
  DISPATCHER = 'DISPATCHER',
  SAFETY_OFFICER = 'SAFETY_OFFICER',
  FINANCIAL_ANALYST = 'FINANCIAL_ANALYST',
  OPERATOR = 'OPERATOR',
  VIEWER = 'VIEWER',
}

export interface JwtPayload {
  sub: string;
  email: string;
  roles: RoleCode[];
  iat?: number;
  exp?: number;
}

export interface RefreshTokenPayload {
  sub: string;
  tokenId: string;
  iat?: number;
  exp?: number;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}
