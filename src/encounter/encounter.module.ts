import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Encounter } from './entities/encounter.entity.js';
import { EncounterDiagnosis } from './entities/encounter-diagnosis.entity.js';
import { Vitals } from './entities/vitals.entity.js';
import { Condition } from './entities/condition.entity.js';
import { Allergy } from './entities/allergy.entity.js';
import { EncounterService } from './encounter.service.js';
import {
  EncounterController,
  ConditionController,
  AllergyController,
} from './encounter.controller.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Encounter,
      EncounterDiagnosis,
      Vitals,
      Condition,
      Allergy,
    ]),
  ],
  controllers: [EncounterController, ConditionController, AllergyController],
  providers: [EncounterService],
  exports: [EncounterService],
})
export class EncounterModule {}
