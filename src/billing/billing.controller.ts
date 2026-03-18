import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BillingService } from './billing.service.js';
import { ApiResponse } from '../common/dto/api-response.dto.js';

@ApiTags('Billing')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('api')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Get('patient/:pid/billing')
  @ApiOperation({ summary: 'List patient billing entries' })
  async getByPatient(@Param('pid', ParseIntPipe) pid: number) {
    return ApiResponse.ok(await this.billingService.getEntriesByPatient(pid));
  }

  @Post('patient/:pid/billing')
  @ApiOperation({ summary: 'Create billing entry' })
  async createEntry(
    @Param('pid', ParseIntPipe) pid: number,
    @Body() body: any,
  ) {
    return ApiResponse.ok(
      await this.billingService.createEntry({ ...body, patientId: pid }),
    );
  }

  @Get('patient/:pid/insurance')
  @ApiOperation({ summary: 'Get patient insurance' })
  async getInsurance(@Param('pid', ParseIntPipe) pid: number) {
    return ApiResponse.ok(await this.billingService.getPatientInsurance(pid));
  }

  @Post('patient/:pid/insurance')
  @ApiOperation({ summary: 'Add patient insurance' })
  async createInsurance(
    @Param('pid', ParseIntPipe) pid: number,
    @Body() body: any,
  ) {
    return ApiResponse.ok(
      await this.billingService.createInsurance({ ...body, patientId: pid }),
    );
  }
}
