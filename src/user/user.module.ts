import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { AuthService } from '../auth/auth.service';
import { AuthGuard } from '../auth/guard';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';

@Module({
  controllers: [UserController],
  providers: [UserService, AuthService, AuthGuard, PrismaService, JwtService],
})
export class UserModule {}
