import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Device } from '../../entities/device.entity';
import { EmailService } from '../auth/email.service';

@Injectable()
export class DevicesService {
  constructor(
    @InjectRepository(Device)
    private deviceRepository: Repository<Device>,
    private emailService: EmailService,
  ) {}

  async findUserDevices(userId: string): Promise<Device[]> {
    return this.deviceRepository.find({
      where: { user_id: userId },
      order: { last_active: 'DESC' },
    });
  }

  async findDeviceById(deviceId: string): Promise<Device | null> {
    return this.deviceRepository.findOne({
      where: { device_id: deviceId },
    });
  }

  async updateDeviceSettings(
    userId: string,
    deviceId: string,
    settings: {
      device_name?: string;
      sync_enabled?: boolean;
      auto_sync?: boolean;
      sync_interval?: number;
    },
  ): Promise<Device> {
    const device = await this.deviceRepository.findOne({
      where: { device_id: deviceId, user_id: userId },
    });

    if (!device) {
      throw new NotFoundException('Device not found');
    }

    // Update device settings
    Object.assign(device, settings);
    return this.deviceRepository.save(device);
  }

  async deleteDevice(userId: string, deviceId: string): Promise<void> {
    const device = await this.deviceRepository.findOne({
      where: { device_id: deviceId, user_id: userId },
    });

    if (!device) {
      throw new NotFoundException('Device not found');
    }

    // Send email notification
    await this.emailService.sendDeviceRemovedEmail(userId, device.device_name);

    // Delete the device
    await this.deviceRepository.remove(device);
  }
}
