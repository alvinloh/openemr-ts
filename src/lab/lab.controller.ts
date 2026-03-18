import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { LabService } from './lab.service.js';
import { UuidValidationPipe } from '../common/pipes/uuid-validation.pipe.js';
import { ApiResponse } from '../common/dto/api-response.dto.js';

@ApiTags('Lab / Procedures')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('api/procedure')
export class LabController {
  constructor(private readonly labService: LabService) {}

  @Get()
  @ApiOperation({ summary: 'List lab orders' })
  async findAll(
    @Query('patientId') patientId?: string,
    @Query('status') status?: string,
  ) {
    const orders = await this.labService.findOrders({
      patientId: patientId ? Number(patientId) : undefined,
      status,
    });
    return ApiResponse.ok(orders);
  }

  @Post()
  @ApiOperation({ summary: 'Create lab order' })
  async create(@Body() body: any) {
    const { codes, ...orderData } = body;
    const order = await this.labService.createOrder(orderData, codes);
    return ApiResponse.ok(order);
  }

  @Get(':uuid')
  @ApiOperation({ summary: 'Get lab order with results' })
  async findOne(@Param('uuid', UuidValidationPipe) uuid: string) {
    const order = await this.labService.findOrderByUuid(uuid);
    const codes = await this.labService.getOrderCodes(order.id);
    const reports = await this.labService.getReports(order.id);

    const reportsWithResults = await Promise.all(
      reports.map(async (report) => ({
        ...report,
        results: await this.labService.getResults(report.id),
      })),
    );

    return ApiResponse.ok({ ...order, codes, reports: reportsWithResults });
  }
}
