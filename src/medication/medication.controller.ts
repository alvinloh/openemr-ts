import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { MedicationService } from './medication.service.js';
import { CreateMedicationDto } from './dto/create-medication.dto.js';
import { UpdateMedicationDto } from './dto/update-medication.dto.js';
import { UuidValidationPipe } from '../common/pipes/uuid-validation.pipe.js';
import { ApiResponse } from '../common/dto/api-response.dto.js';

@ApiTags('Medication')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('api/patient/:pid/medication')
export class MedicationController {
  constructor(private readonly medicationService: MedicationService) {}

  @Get()
  @ApiOperation({ summary: 'List patient medications' })
  async findAll(@Param('pid', ParseIntPipe) pid: number) {
    return ApiResponse.ok(await this.medicationService.findByPatient(pid));
  }

  @Post()
  @ApiOperation({ summary: 'Add medication' })
  async create(
    @Param('pid', ParseIntPipe) pid: number,
    @Body() dto: CreateMedicationDto,
  ) {
    return ApiResponse.ok(await this.medicationService.create(pid, dto));
  }

  @Get(':muuid')
  @ApiOperation({ summary: 'Get medication' })
  async findOne(
    @Param('pid', ParseIntPipe) pid: number,
    @Param('muuid', UuidValidationPipe) muuid: string,
  ) {
    return ApiResponse.ok(await this.medicationService.findOne(pid, muuid));
  }

  @Put(':muuid')
  @ApiOperation({ summary: 'Update medication' })
  async update(
    @Param('pid', ParseIntPipe) pid: number,
    @Param('muuid', UuidValidationPipe) muuid: string,
    @Body() dto: UpdateMedicationDto,
  ) {
    return ApiResponse.ok(await this.medicationService.update(pid, muuid, dto));
  }

  @Delete(':muuid')
  @ApiOperation({ summary: 'Delete medication' })
  async remove(
    @Param('pid', ParseIntPipe) pid: number,
    @Param('muuid', UuidValidationPipe) muuid: string,
  ) {
    await this.medicationService.remove(pid, muuid);
    return { message: 'Deleted' };
  }
}
