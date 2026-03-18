import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SchedulingService } from './scheduling.service.js';
import { UuidValidationPipe } from '../common/pipes/uuid-validation.pipe.js';
import { ApiResponse } from '../common/dto/api-response.dto.js';

@ApiTags('Appointment')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('api')
export class SchedulingController {
  constructor(private readonly schedulingService: SchedulingService) {}

  @Get('appointment')
  @ApiOperation({ summary: 'List all appointments' })
  async findAll(
    @Query('start') start?: string,
    @Query('end') end?: string,
    @Query('providerId') providerId?: string,
  ) {
    if (start && end) {
      const appts = await this.schedulingService.findByDateRange(
        new Date(start),
        new Date(end),
        providerId ? Number(providerId) : undefined,
      );
      return ApiResponse.ok(appts);
    }
    return ApiResponse.ok([]);
  }

  @Get('patient/:pid/appointment')
  @ApiOperation({ summary: 'List patient appointments' })
  async findByPatient(@Param('pid', ParseIntPipe) pid: number) {
    return ApiResponse.ok(await this.schedulingService.findByPatient(pid));
  }

  @Post('patient/:pid/appointment')
  @ApiOperation({ summary: 'Book appointment' })
  async create(
    @Param('pid', ParseIntPipe) pid: number,
    @Body() body: any,
  ) {
    const appt = await this.schedulingService.create({
      ...body,
      patientId: pid,
      startTime: new Date(body.startTime),
      endTime: new Date(body.endTime),
    });
    return ApiResponse.ok(appt);
  }

  @Delete('patient/:pid/appointment/:uuid')
  @ApiOperation({ summary: 'Cancel appointment' })
  async cancel(
    @Param('pid', ParseIntPipe) _pid: number,
    @Param('uuid', UuidValidationPipe) uuid: string,
  ) {
    return ApiResponse.ok(await this.schedulingService.cancel(uuid));
  }
}
