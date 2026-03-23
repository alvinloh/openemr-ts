import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  UseGuards,
  Request,
  HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiHeader } from '@nestjs/swagger';
import { TenantGuard } from '../tenant/guards/tenant.guard.js';
import { SimulationService, SimulationRequest, SimulationStep } from './simulation.service.js';
import { SimulateDto } from './dto/simulate.dto.js';

@ApiTags('Simulation')
@Controller('api/simulate')
export class SimulationController {
  constructor(private readonly simulationService: SimulationService) {}

  @Post()
  @UseGuards(TenantGuard)
  @HttpCode(200)
  @ApiOperation({ summary: 'Run a workflow simulation with synthetic patients and HL7 messages' })
  @ApiHeader({ name: 'x-api-key', description: 'Tenant API key' })
  async simulate(@Request() req: any, @Body() dto: SimulateDto) {
    const request: SimulationRequest = {
      scenario: dto.scenario,
      steps: dto.steps as SimulationStep[],
      patientCount: dto.patientCount || 1,
      labPanels: dto.labPanels,
      pacing: dto.pacing || 'instant',
      tenantId: req.tenant.id,
      ageMin: dto.ageMin,
      ageMax: dto.ageMax,
    };

    return this.simulationService.run(request);
  }

  @Get('presets')
  @ApiOperation({ summary: 'List available simulation preset scenarios' })
  async getPresets() {
    return this.simulationService.getPresets();
  }

  @Delete('cleanup')
  @UseGuards(TenantGuard)
  @HttpCode(200)
  @ApiOperation({ summary: 'Delete all simulated (SIM-*) patient data for your tenant' })
  @ApiHeader({ name: 'x-api-key', description: 'Tenant API key' })
  async cleanup(@Request() req: any) {
    return this.simulationService.cleanup(req.tenant.id);
  }
}
