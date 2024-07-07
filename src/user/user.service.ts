import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}
  async getUserRecord(id: string) {
    try {
      const user = await this.prisma.user.findUnique({
        where: {
          userId: id,
        },
      });

      delete user.password;

      return {
        status: 'success',
        message: 'Welcome to your organization',
        data: user,
      };
    } catch (err) {
      throw err;
    }
  }
}
