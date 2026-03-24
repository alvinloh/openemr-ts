import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { JwtOrApiKeyGuard } from '../common/guards/jwt-or-apikey.guard.js';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { EncounterService } from './encounter.service.js';
import { CreateEncounterDto } from './dto/create-encounter.dto.js';
import { UpdateEncounterDto } from './dto/update-encounter.dto.js';
import { CreateVitalsDto } from './dto/create-vitals.dto.js';
import { PaginationDto } from '../common/dto/pagination.dto.js';
import { UuidValidationPipe } from '../common/pipes/uuid-validation.pipe.js';
import { ApiResponse } from '../common/dto/api-response.dto.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';

@ApiTags('Encounter')
@ApiBearerAuth()
@UseGuards(JwtOrApiKeyGuard)
@Controller('api/patient/:pid/encounter')
export class EncounterController {
  constructor(private readonly encounterService: EncounterService) {}

  @Get()
  @ApiOperation({ summary: 'List patient encounters' })
  async findAll(
    @Param('pid', ParseIntPipe) pid: number,
    @Query() pagination: PaginationDto,
  ) {
    const { data, total } = await this.encounterService.findEncountersByPatient(
      pid,
      pagination,
    );
    return ApiResponse.paginated(data, total, pagination.page, pagination.limit);
  }

  @Post()
  @ApiOperation({ summary: 'Create encounter' })
  async create(
    @Param('pid', ParseIntPipe) pid: number,
    @Body() dto: CreateEncounterDto,
  ) {
    const encounter = await this.encounterService.createEncounter(pid, dto);
    return ApiResponse.ok(encounter);
  }

  @Get(':euuid')
  @ApiOperation({ summary: 'Get encounter by UUID' })
  async findOne(
    @Param('pid', ParseIntPipe) pid: number,
    @Param('euuid', UuidValidationPipe) euuid: string,
  ) {
    const encounter = await this.encounterService.findEncounterByUuid(
      euuid,
      pid,
    );
    return ApiResponse.ok(encounter);
  }

  @Put(':euuid')
  @ApiOperation({ summary: 'Update encounter' })
  async update(
    @Param('pid', ParseIntPipe) pid: number,
    @Param('euuid', UuidValidationPipe) euuid: string,
    @Body() dto: UpdateEncounterDto,
  ) {
    const encounter = await this.encounterService.updateEncounter(
      euuid,
      pid,
      dto,
    );
    return ApiResponse.ok(encounter);
  }

  // ── Vitals ──

  @Get(':euuid/vital')
  @ApiOperation({ summary: 'Get vitals for encounter' })
  async getVitals(
    @Param('pid', ParseIntPipe) pid: number,
    @Param('euuid', UuidValidationPipe) euuid: string,
  ) {
    const encounter = await this.encounterService.findEncounterByUuid(
      euuid,
      pid,
    );
    const vitals = await this.encounterService.getVitals(encounter.id);
    return ApiResponse.ok(vitals);
  }

  @Post(':euuid/vital')
  @ApiOperation({ summary: 'Add vitals to encounter' })
  async addVitals(
    @Param('pid', ParseIntPipe) pid: number,
    @Param('euuid', UuidValidationPipe) euuid: string,
    @Body() dto: CreateVitalsDto,
    @CurrentUser('id') userId: number,
  ) {
    const encounter = await this.encounterService.findEncounterByUuid(
      euuid,
      pid,
    );
    const vitals = await this.encounterService.createVitals(
      encounter.id,
      pid,
      userId,
      dto,
    );
    return ApiResponse.ok(vitals);
  }

  // ── Diagnoses ──

  @Get(':euuid/diagnosis')
  @ApiOperation({ summary: 'Get diagnoses for encounter' })
  async getDiagnoses(
    @Param('pid', ParseIntPipe) pid: number,
    @Param('euuid', UuidValidationPipe) euuid: string,
  ) {
    const encounter = await this.encounterService.findEncounterByUuid(
      euuid,
      pid,
    );
    const diagnoses = await this.encounterService.getDiagnoses(encounter.id);
    return ApiResponse.ok(diagnoses);
  }
}

@ApiTags('Condition')
@ApiBearerAuth()
@UseGuards(JwtOrApiKeyGuard)
@Controller('api/patient/:pid/condition')
export class ConditionController {
  constructor(private readonly encounterService: EncounterService) {}

  @Get()
  async findAll(@Param('pid', ParseIntPipe) pid: number) {
    return ApiResponse.ok(await this.encounterService.getConditions(pid));
  }

  @Post()
  async create(
    @Param('pid', ParseIntPipe) pid: number,
    @Body() body: any,
  ) {
    return ApiResponse.ok(await this.encounterService.createCondition(pid, body));
  }
}

@ApiTags('Allergy')
@ApiBearerAuth()
@UseGuards(JwtOrApiKeyGuard)
@Controller('api/patient/:pid/allergy')
export class AllergyController {
  constructor(private readonly encounterService: EncounterService) {}

  @Get()
  async findAll(@Param('pid', ParseIntPipe) pid: number) {
    return ApiResponse.ok(await this.encounterService.getAllergies(pid));
  }

  @Post()
  async create(
    @Param('pid', ParseIntPipe) pid: number,
    @Body() body: any,
  ) {
    return ApiResponse.ok(await this.encounterService.createAllergy(pid, body));
  }
}
