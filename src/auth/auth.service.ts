import { ForbiddenException, Injectable } from '@nestjs/common';
import { LoginAuthDto, RegisterAuthDto } from './dto';
import { PrismaService } from 'src/prisma/prisma.service';
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

      return this.signToken(user.userId, user.email);
    } catch (err) {
      if (err instanceof PrismaClientKnownRequestError) {
        if (err.code === 'P2002') {
          return new ForbiddenException('Duplicate value');
        }
      }
      throw err;
    }
  }
  async login(dto: LoginAuthDto) {
    const userExist = await this.prisma.user.findUnique({
      where: {
        email: dto.email,
      },
    });

    if (!userExist) throw new ForbiddenException('Invalid credential');

    const passwordMatch = await argon2.verify(userExist.password, dto.password);

    if (!passwordMatch) throw new ForbiddenException('Password not correct');

    return this.signToken(userExist.userId, userExist.email);
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
}
