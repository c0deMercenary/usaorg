import {
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { OrganizationDto, UserDto } from './dto';

@Injectable()
export class OrganizationService {
  constructor(private prisma: PrismaService) {}
  async getUserOrganizations(user: User) {
    const userWithOrganizations = await this.prisma.user.findUnique({
      where: {
        userId: user.userId,
      },
      include: {
        userOrganizations: {
          include: {
            Organization: true,
          },
        },
      },
    });

    if (!userWithOrganizations) {
      throw new NotFoundException(`User with ID ${user.userId} not found`);
    }

    return {
      status: 'success',
      message: 'List of user organization',
      data: {
        organizations: userWithOrganizations.userOrganizations.map(
          (uo) => uo.Organization,
        ),
      },
    };
  }

  async getOrganization(id: string, user: User) {
    try {
      const organizationExist = await this.prisma.organization.findUnique({
        where: {
          orgId: id,
        },
      });

      if (!organizationExist)
        throw new NotFoundException('organization does not exist');

      const userOrganization = await this.prisma.userOrganization.findFirst({
        where: {
          org_id: organizationExist.orgId,
          user_id: user.userId,
        },
      });

      if (!userOrganization) {
        throw new HttpException(
          {
            message: 'You do not belong to this organization',
            status: HttpStatus.FORBIDDEN,
          },
          HttpStatus.FORBIDDEN,
        );
      }

      return {
        status: 'success',
        message: 'found organization',
        data: organizationExist,
      };
    } catch (err) {
      throw err;
    }
  }

  async createOrganization(dto: OrganizationDto, user: User) {
    try {
      const newOrganization = await this.prisma.organization.create({
        data: {
          name: dto.name,
          description: dto.description,
        },
      });

      if (newOrganization) {
        await this.prisma.userOrganization.create({
          data: {
            user_id: user.userId,
            org_id: newOrganization.orgId,
          },
        });
      }

      return {
        status: 'success',
        message: 'Organization successfully created',
        data: newOrganization,
      };
    } catch (err) {
      throw new HttpException(
        {
          status: 'Bad Request',
          message: 'Client error',
          statusCode: HttpStatus.BAD_REQUEST,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async addUserToOrganization(id: string, dto: UserDto) {
    try {
      const userExist = await this.prisma.user.findUnique({
        where: {
          userId: dto.userId,
        },
      });

      if (!userExist) {
        throw new NotFoundException('User does not exist');
      }

      const organizationExist = await this.prisma.organization.findUnique({
        where: {
          orgId: id,
        },
      });

      if (!organizationExist) {
        throw new NotFoundException('Organization does not exist');
      }

      await this.prisma.userOrganization.create({
        data: {
          user_id: dto.userId,
          org_id: organizationExist.orgId,
        },
      });

      return {
        status: 'success',
        message: 'User added to organization',
      };
    } catch (err) {
      throw err;
    }
  }
}
