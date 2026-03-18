import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Hl7ParserService } from './hl7-parser.service.js';
import { Hl7GeneratorService } from './hl7-generator.service.js';
import { Hl7SenderService } from './hl7-sender.service.js';
import { Hl7Controller } from './hl7.controller.js';
import { LabModule } from '../lab/lab.module.js';
import { PatientModule } from '../patient/patient.module.js';
import { LabProvider } from '../lab/entities/lab-provider.entity.js';

@Module({
  imports: [LabModule, PatientModule, TypeOrmModule.forFeature([LabProvider])],
  controllers: [Hl7Controller],
  providers: [Hl7ParserService, Hl7GeneratorService, Hl7SenderService],
  exports: [Hl7ParserService, Hl7GeneratorService, Hl7SenderService],
})
export class Hl7Module {}
