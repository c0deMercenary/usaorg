import {
  ForbiddenException,
  HttpCode,
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { LoginAuthDto, RegisterAuthDto } from './dto';
import { PrismaService } from '../prisma/prisma.service';
import * as argon2 from 'argon2';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}
  async signup(dto: RegisterAuthDto) {
    const hashPassword = await argon2.hash(dto.password);
    try {
      const user = await this.prisma.user.create({
        data: {
          firstName: dto.firstname,
          lastName: dto.lastname,
          email: dto.email,
          password: hashPassword,
          phone: dto?.phone,
        },
      });

      const organization = await this.prisma.organization.create({
        data: {
          name: dto.firstname + "'s " + 'organization',
          description: '',
        },
      });

      await this.prisma.userOrganization.create({
        data: {
          user_id: user.userId,
          org_id: organization.orgId,
        },
      });

      const access_token = await this.signToken(user.userId, user.email);

      return {
        status: 'success',
        message: 'Registration successful',
        data: {
          accessToken: access_token?.access_token,
          user: {
            userId: user.userId,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            phone: user.phone,
          },
        },
      };
    } catch (err) {
      if (err instanceof PrismaClientKnownRequestError) {
        if (err.code === 'P2002') {
          throw new HttpException(
            {
              message: 'Duplicate email',
              status: HttpStatus.UNPROCESSABLE_ENTITY,
            },
            HttpStatus.UNPROCESSABLE_ENTITY,
          );
        }
      }
      throw new HttpException(
        {
          status: 'Bad request',
          message: 'Registration unsuccessful',
          statusCode: HttpStatus.BAD_REQUEST,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }
  @HttpCode(HttpStatus.OK)
  async login(dto: LoginAuthDto) {
    try {
      const userExist = await this.prisma.user.findUnique({
        where: {
          email: dto.email,
        },
      });

      if (!userExist) throw new ForbiddenException('Invalid credential');

      const passwordMatch = await argon2.verify(
        userExist.password,
        dto.password,
      );

      if (!passwordMatch) throw new ForbiddenException('Password not correct');

      const access_token = await this.signToken(
        userExist.userId,
        userExist.email,
      );
      return {
        status: 'success',
        message: 'Login successful',
        data: {
          accessToken: access_token?.access_token,
          user: {
            userId: userExist.userId,
            firstName: userExist.firstName,
            lastName: userExist.lastName,
            email: userExist.email,
            phone: userExist.phone,
          },
        },
      };
    } catch (err) {
      throw new HttpException(
        {
          status: 'Bad request',
          message: 'Authentication failed',
          statusCode: HttpStatus.UNAUTHORIZED,
        },
        HttpStatus.UNAUTHORIZED,
      );
    }
  }

  async signToken(
    userId: string,
    email: string,
  ): Promise<{ access_token: string }> {
    const payload = {
      sub: userId,
      email,
    };

    const secret = this.config.get('SECRET');
    const token = await this.jwt.signAsync(payload, {
      expiresIn: '1hr',
      secret,
    });

    return {
      access_token: token,
    };
  }

  async validateUser(payload: { email: string; sub: string }) {
    const user = await this.prisma.user.findUnique({
      where: { userId: payload.sub },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    delete user.password;
    return user;
  }
}
