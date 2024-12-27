import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Get,
  Query,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SyncService } from './sync.service';
import { ContentType } from '../../entities/sync-data.entity';

@Controller('sync')
@UseGuards(JwtAuthGuard)
export class SyncController {
  constructor(private syncService: SyncService) {}

  @Post()
  async createSync(
    @Request() req,
    @Body()
    data: {
      content: string;
      content_type: ContentType;
      metadata?: Record<string, any>;
      parent_sync_id?: string;
    },
  ) {
    return this.syncService.createSync(
      req.user.userId,
      req.user.deviceId,
      data,
    );
  }

  @Get('recent')
  async getRecentSyncs(
    @Request() req,
    @Query('contentType') contentType?: ContentType,
    @Query('since') since?: Date,
    @Query('limit') limit?: number,
  ) {
    return this.syncService.getRecentSyncs(
      req.user.userId,
      req.user.deviceId,
      contentType,
      since,
      limit,
    );
  }
}
