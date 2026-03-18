import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Patient } from './entities/patient.entity.js';
import { PatientService } from './patient.service.js';
import { PatientController } from './patient.controller.js';

@Module({
  imports: [TypeOrmModule.forFeature([Patient])],
  controllers: [PatientController],
  providers: [PatientService],
  exports: [PatientService],
})
export class PatientModule {}
