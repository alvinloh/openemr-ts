import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { Hl7GeneratorService } from '../../hl7/hl7-generator.service.js';
import { LabService } from '../../lab/lab.service.js';
import { QUEUES } from '../queues.constants.js';

@Processor(QUEUES.HL7_OUTBOUND)
export class Hl7OutboundProcessor extends WorkerHost {
  private readonly logger = new Logger(Hl7OutboundProcessor.name);

  constructor(
    private readonly hl7Generator: Hl7GeneratorService,
    private readonly labService: LabService,
  ) {
    super();
  }

  async process(
    job: Job<{
      orderId: number;
      patientInfo: {
        firstName: string;
        lastName: string;
        dateOfBirth: string;
        sex: string;
        mrn: string;
      };
    }>,
  ): Promise<any> {
    this.logger.log(`Processing HL7 outbound job ${job.id} for order ${job.data.orderId}`);

    const order = await this.labService.findOrders({});
    const matchingOrder = order.find((o) => o.id == job.data.orderId);

    if (!matchingOrder) {
      this.logger.warn(`Order ${job.data.orderId} not found`);
      return { error: 'Order not found' };
    }

    const codes = await this.labService.getOrderCodes(matchingOrder.id);
    const hl7Message = this.hl7Generator.generateLabOrder(
      matchingOrder,
      codes,
      job.data.patientInfo,
    );

    this.logger.log(`Generated HL7 message (${hl7Message.length} chars)`);

    // In production, this would transmit the message to the lab system
    // For now, just log it
    return { message: hl7Message, length: hl7Message.length };
  }
}
