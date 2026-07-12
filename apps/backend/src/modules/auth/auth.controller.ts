import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { JwtPayload } from '@transitops/shared-types';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from '../../common/guards/auth.guards';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthTokensResponseDto, LoginDto, RefreshDto } from './dto/auth.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ status: 200, description: 'Tokens issued', type: AuthTokensResponseDto })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto.email, dto.password);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Refresh access token',
    description:
      'Exchanges a valid refresh token for a new access + refresh token pair (rotation).',
  })
  @ApiBody({ type: RefreshDto })
  @ApiResponse({ status: 200, description: 'Tokens refreshed', type: AuthTokensResponseDto })
  @ApiResponse({ status: 401, description: 'Invalid, expired, or reused refresh token' })
  refresh(@Body() dto: RefreshDto) {
    return this.authService.refresh(dto.refreshToken);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Logout and revoke refresh token' })
  @ApiResponse({ status: 200, description: 'Logged out' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  logout(@CurrentUser() user?: JwtPayload) {
    return this.authService.logout(user?.sub ?? 'unknown');
  }
}
