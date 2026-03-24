import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Hl7ParserService } from './hl7-parser.service.js';
import { Hl7GeneratorService } from './hl7-generator.service.js';
import { Hl7SenderService } from './hl7-sender.service.js';
import { Hl7Controller } from './hl7.controller.js';
import { AdtGeneratorService } from './generators/adt-generator.service.js';
import { OruGeneratorService } from './generators/oru-generator.service.js';
import { SiuGeneratorService } from './generators/siu-generator.service.js';
import { RdeGeneratorService } from './generators/rde-generator.service.js';
import { MdmGeneratorService } from './generators/mdm-generator.service.js';
import { LabModule } from '../lab/lab.module.js';
import { PatientModule } from '../patient/patient.module.js';
import { LabProvider } from '../lab/entities/lab-provider.entity.js';
import { TenantModule } from '../tenant/tenant.module.js';

@Module({
  imports: [LabModule, PatientModule, TypeOrmModule.forFeature([LabProvider]), TenantModule],
  controllers: [Hl7Controller],
  providers: [
    Hl7ParserService,
    Hl7GeneratorService,
    Hl7SenderService,
    AdtGeneratorService,
    OruGeneratorService,
    SiuGeneratorService,
    RdeGeneratorService,
    MdmGeneratorService,
  ],
  exports: [
    Hl7ParserService,
    Hl7GeneratorService,
    Hl7SenderService,
    AdtGeneratorService,
    OruGeneratorService,
    SiuGeneratorService,
    RdeGeneratorService,
    MdmGeneratorService,
  ],
})
export class Hl7Module {}
