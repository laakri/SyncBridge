import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('system')
@Controller('system')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SystemController {
  constructor(
    @InjectDataSource()
    private dataSource: DataSource,
  ) {}

  @Get('db/tables')
  @ApiOperation({ summary: 'Get database tables information' })
  async getDatabaseTables() {
    const tables = await this.dataSource.query(`
      SELECT 
        table_name,
        (SELECT count(*) FROM "' || table_name || '") as row_count
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    return tables;
  }

  @Get('db/schema')
  @ApiOperation({ summary: 'Get database schema' })
  async getDatabaseSchema() {
    const schema = await this.dataSource.query(`
      SELECT 
        t.table_name,
        array_agg(
          json_build_object(
            'column_name', c.column_name,
            'data_type', c.data_type,
            'is_nullable', c.is_nullable
          )
        ) as columns
      FROM information_schema.tables t
      JOIN information_schema.columns c 
        ON t.table_name = c.table_name
      WHERE t.table_schema = 'public'
      GROUP BY t.table_name
    `);
    return schema;
  }
}
