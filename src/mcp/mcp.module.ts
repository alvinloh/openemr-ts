import { Module } from '@nestjs/common';
import { McpController } from './mcp.controller.js';
import { McpToolsService } from './mcp-tools.service.js';
import { TenantModule } from '../tenant/tenant.module.js';
import { PatientModule } from '../patient/patient.module.js';
import { LabModule } from '../lab/lab.module.js';
import { SchedulingModule } from '../scheduling/scheduling.module.js';
import { Hl7Module } from '../hl7/hl7.module.js';
import { SimulationModule } from '../simulation/simulation.module.js';
import { EndpointModule } from '../endpoint/endpoint.module.js';
import { MeteringModule } from '../metering/metering.module.js';

@Module({
  imports: [
    TenantModule,
    PatientModule,
    LabModule,
    SchedulingModule,
    Hl7Module,
    SimulationModule,
    EndpointModule,
    MeteringModule,
  ],
  controllers: [McpController],
  providers: [McpToolsService],
})
export class McpModule {}
