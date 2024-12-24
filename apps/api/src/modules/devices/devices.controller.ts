import {
  Controller,
  Get,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DevicesService } from './devices.service';

@Controller('devices')
@UseGuards(JwtAuthGuard)
export class DevicesController {
  constructor(private devicesService: DevicesService) {}

  @Get()
  async getUserDevices(@Request() req) {
    return this.devicesService.findUserDevices(req.user.sub);
  }

  @Put(':deviceId/settings')
  async updateDeviceSettings(
    @Request() req,
    @Param('deviceId') deviceId: string,
    @Body()
    settings: {
      device_name?: string;
      sync_enabled?: boolean;
      auto_sync?: boolean;
      sync_interval?: number;
    },
  ) {
    return this.devicesService.updateDeviceSettings(
      req.user.sub,
      deviceId,
      settings,
    );
  }

  @Delete(':deviceId')
  async deleteDevice(@Request() req, @Param('deviceId') deviceId: string) {
    await this.devicesService.deleteDevice(req.user.sub, deviceId);
    return { message: 'Device deleted successfully' };
  }
}
