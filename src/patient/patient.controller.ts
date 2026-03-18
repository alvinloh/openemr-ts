import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PatientService } from './patient.service.js';
import { CreatePatientDto } from './dto/create-patient.dto.js';
import { UpdatePatientDto } from './dto/update-patient.dto.js';
import { PatientQueryDto } from './dto/patient-query.dto.js';
import { UuidValidationPipe } from '../common/pipes/uuid-validation.pipe.js';
import { ApiResponse } from '../common/dto/api-response.dto.js';

@ApiTags('Patient')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('api/patient')
export class PatientController {
  constructor(private readonly patientService: PatientService) {}

  @Get()
  @ApiOperation({ summary: 'Search/list patients' })
  async findAll(@Query() query: PatientQueryDto) {
    const { data, total } = await this.patientService.findAll(query);
    return ApiResponse.paginated(data, total, query.page, query.limit);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new patient' })
  async create(@Body() dto: CreatePatientDto) {
    const patient = await this.patientService.create(dto);
    return ApiResponse.ok(patient);
  }

  @Get(':uuid')
  @ApiOperation({ summary: 'Get patient by UUID' })
  async findOne(@Param('uuid', UuidValidationPipe) uuid: string) {
    const patient = await this.patientService.findByUuid(uuid);
    return ApiResponse.ok(patient);
  }

  @Put(':uuid')
  @ApiOperation({ summary: 'Update patient' })
  async update(
    @Param('uuid', UuidValidationPipe) uuid: string,
    @Body() dto: UpdatePatientDto,
  ) {
    const patient = await this.patientService.update(uuid, dto);
    return ApiResponse.ok(patient);
  }
}
