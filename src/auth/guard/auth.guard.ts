import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from '../auth.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly authService: AuthService,
    private config: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException(
        'Authorization header missing or malformed',
      );
    }

    const token = authHeader.split(' ')[1];

    try {
      const payload = this.jwt.verify(token, {
        secret: this.config.get('SECRET'),
      });
      request.user = await this.authService.validateUser(payload);
      return true;
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
