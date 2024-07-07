import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../auth/guard';
import { OrganizationService } from './organization.service';
import { OrganizationDto, UserDto } from './dto';

@UseGuards(AuthGuard)
@Controller('api/organizations')
export class OrganizationController {
  constructor(private organizationService: OrganizationService) {}

  @Get('')
  async getUserOrganizations(@Request() req: any) {
    return this.organizationService.getUserOrganizations(req.user);
  }

  @Get(':id')
  async getOrganization(@Param('id') id: string, @Request() req: any) {
    return this.organizationService.getOrganization(id, req.user);
  }

  @Post()
  async createOrganization(@Body() dto: OrganizationDto, @Request() req: any) {
    return this.organizationService.createOrganization(dto, req.user);
  }

  @Post(':orgId/users')
  async addUserToOrganization(
    @Param('orgId') id: string,
    @Body() dto: UserDto,
  ) {
    return this.organizationService.addUserToOrganization(id, dto);
  }
}
