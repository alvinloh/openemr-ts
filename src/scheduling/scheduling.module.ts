import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Appointment } from './entities/appointment.entity.js';
import { AppointmentCategory } from './entities/appointment-category.entity.js';
import { Facility } from './entities/facility.entity.js';
import { SchedulingService } from './scheduling.service.js';
import { SchedulingController } from './scheduling.controller.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Appointment, AppointmentCategory, Facility]),
  ],
  controllers: [SchedulingController],
  providers: [SchedulingService],
  exports: [SchedulingService],
})
export class SchedulingModule {}
