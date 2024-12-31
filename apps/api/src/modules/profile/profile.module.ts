import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProfileController } from './profile.controller';
import { ProfileService } from './profile.service';
import { User } from '../../entities/user.entity';
import { AuthModule } from '../auth/auth.module';
import { SecurityEventService } from '../auth/security/security-event.service';
import { SecurityEvent } from '../../entities/security-event.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, SecurityEvent]), AuthModule],
  controllers: [ProfileController],
  providers: [ProfileService, SecurityEventService],
  exports: [ProfileService],
})
export class ProfileModule {}
