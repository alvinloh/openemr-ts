import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LabOrder } from './entities/lab-order.entity.js';
import { LabOrderCode } from './entities/lab-order-code.entity.js';
import { LabReport } from './entities/lab-report.entity.js';
import { LabResult } from './entities/lab-result.entity.js';
import { LabProvider } from './entities/lab-provider.entity.js';
import { LabService } from './lab.service.js';
import { LabController } from './lab.controller.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      LabOrder,
      LabOrderCode,
      LabReport,
      LabResult,
      LabProvider,
    ]),
  ],
  controllers: [LabController],
  providers: [LabService],
  exports: [LabService],
})
export class LabModule {}
