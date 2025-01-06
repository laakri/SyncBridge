import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { ProfileService } from './profile.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { User } from '../../entities/user.entity';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Controller('profile')
@UseGuards(JwtAuthGuard)
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get()
  async getUserProfile(@GetUser() user: User) {
    return this.profileService.getUserProfile(user.user_id);
  }

  @Get('stats')
  async getProfileStats(@GetUser() user: User) {
    return this.profileService.getProfileStats(user.user_id);
  }

  @Get('security')
  async getSecurityOverview(@GetUser() user: User) {
    return this.profileService.getSecurityOverview(user.user_id);
  }

  @Patch()
  async updateProfile(
    @GetUser() user: User,
    @Body() updateDto: UpdateProfileDto,
  ) {
    return this.profileService.updateProfile(user.user_id, updateDto);
  }
}
