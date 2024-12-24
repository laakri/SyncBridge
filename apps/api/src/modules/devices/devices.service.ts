import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Device } from '../../entities/device.entity';

@Injectable()
export class DevicesService {
  constructor(
    @InjectRepository(Device)
    private deviceRepository: Repository<Device>,
  ) {}

  async findUserDevices(userId: string): Promise<Device[]> {
    return this.deviceRepository.find({
      where: {
        user_id: userId,
        is_active: true,
      },
      order: {
        last_active: 'DESC',
      },
    });
  }

  async findDeviceById(deviceId: string): Promise<Device | null> {
    return this.deviceRepository.findOne({
      where: { device_id: deviceId },
    });
  }
}
