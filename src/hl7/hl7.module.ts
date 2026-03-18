import { Module } from '@nestjs/common';
import { Hl7ParserService } from './hl7-parser.service.js';
import { Hl7GeneratorService } from './hl7-generator.service.js';
import { Hl7Controller } from './hl7.controller.js';
import { LabModule } from '../lab/lab.module.js';
import { PatientModule } from '../patient/patient.module.js';

@Module({
  imports: [LabModule, PatientModule],
  controllers: [Hl7Controller],
  providers: [Hl7ParserService, Hl7GeneratorService],
  exports: [Hl7ParserService, Hl7GeneratorService],
})
export class Hl7Module {}
