import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { QUEUES } from './queues.constants.js';
import { Hl7InboundProcessor } from './processors/hl7-inbound.processor.js';
import { Hl7OutboundProcessor } from './processors/hl7-outbound.processor.js';
import { ReportGenerationProcessor } from './processors/report-generation.processor.js';
import { Hl7Module } from '../hl7/hl7.module.js';
import { LabModule } from '../lab/lab.module.js';
import { PdfModule } from '../pdf/pdf.module.js';

@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: {
          host: config.get<string>('REDIS_HOST') ?? 'localhost',
          port: parseInt(config.get<string>('REDIS_PORT') ?? '6379', 10),
        },
      }),
    }),
    BullModule.registerQueue(
      { name: QUEUES.HL7_INBOUND },
      { name: QUEUES.HL7_OUTBOUND },
      { name: QUEUES.REPORT_GENERATION },
    ),
    Hl7Module,
    LabModule,
    PdfModule,
  ],
  providers: [
    Hl7InboundProcessor,
    Hl7OutboundProcessor,
    ReportGenerationProcessor,
  ],
  exports: [BullModule],
})
export class JobsModule {}
