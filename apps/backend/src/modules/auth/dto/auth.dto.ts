import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'admin@transitops.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'Admin@12345', minLength: 8 })
  @IsString()
  @MinLength(8)
  password!: string;
}

export class RefreshDto {
  @ApiProperty({ description: 'Refresh token issued at login' })
  @IsString()
  @MinLength(20)
  refreshToken!: string;
}

export class AuthTokensResponseDto {
  @ApiProperty()
  accessToken!: string;

  @ApiProperty()
  refreshToken!: string;

  @ApiProperty({ description: 'Access token lifetime in seconds', example: 900 })
  expiresIn!: number;
}
