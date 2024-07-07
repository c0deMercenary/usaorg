import { Module } from '@nestjs/common';
import { OrganizationService } from './organization.service';
import { OrganizationController } from './organization.controller';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from '../auth/auth.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  providers: [OrganizationService, JwtService, AuthService, PrismaService],
  controllers: [OrganizationController],
})
export class OrganizationModule {}
