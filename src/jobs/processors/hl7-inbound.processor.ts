import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { Hl7ParserService } from '../../hl7/hl7-parser.service.js';
import { LabService } from '../../lab/lab.service.js';
import { QUEUES } from '../queues.constants.js';

@Processor(QUEUES.HL7_INBOUND)
export class Hl7InboundProcessor extends WorkerHost {
  private readonly logger = new Logger(Hl7InboundProcessor.name);

  constructor(
    private readonly hl7Parser: Hl7ParserService,
    private readonly labService: LabService,
  ) {
    super();
  }

  async process(job: Job<{ message: string }>): Promise<any> {
    this.logger.log(`Processing HL7 inbound job ${job.id}`);

    const parsed = this.hl7Parser.parseLabResults(job.data.message);
    this.logger.log(
      `Parsed ${parsed.results.length} results for patient ${parsed.patientId}`,
    );

    const createdResults: any[] = [];

    if (parsed.orderControlId) {
      const orders = await this.labService.findOrders({});
      const matchingOrder = orders.find(
        (o) =>
          String(o.id) === parsed.orderControlId ||
          o.controlId === parsed.orderControlId,
      );

      if (matchingOrder) {
        const report = await this.labService.createReport({
          labOrderId: matchingOrder.id,
          reportDate: new Date().toISOString().split('T')[0],
          status: 'complete',
          reviewStatus: 'received',
        });

        for (const r of parsed.results) {
          const result = await this.labService.createResult({
            labReportId: report.id,
            resultCode: r.testCode,
            resultText: r.testName,
            value: r.value,
            units: r.units,
            referenceRange: r.referenceRange,
            abnormal: r.abnormalFlag || 'no',
            status: r.status === 'F' ? 'final' : 'preliminary',
            date: r.observationDate ? new Date(r.observationDate) : new Date(),
          });
          createdResults.push(result);
        }
      }
    }

    return { parsedResults: parsed.results.length, created: createdResults.length };
  }
}
