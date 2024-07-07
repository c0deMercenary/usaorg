import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/guard';
import { UserService } from './user.service';

@UseGuards(AuthGuard)
@Controller('api/users')
export class UserController {
  constructor(private userService: UserService) {}
  @Get(':id')
  async getUserRecord(@Param('id') id: string) {
    return this.userService.getUserRecord(id);
  }
}
