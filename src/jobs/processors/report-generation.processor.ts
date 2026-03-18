import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PdfService } from '../../pdf/pdf.service.js';
import { QUEUES } from '../queues.constants.js';

@Processor(QUEUES.REPORT_GENERATION)
export class ReportGenerationProcessor extends WorkerHost {
  private readonly logger = new Logger(ReportGenerationProcessor.name);

  constructor(private readonly pdfService: PdfService) {
    super();
  }

  async process(
    job: Job<{ type: string; data: Record<string, any>; outputPath?: string }>,
  ): Promise<any> {
    this.logger.log(`Generating ${job.data.type} report (job ${job.id})`);

    const buffer = await this.pdfService.generate(job.data.type, job.data.data);

    if (job.data.outputPath) {
      const { writeFile, mkdir } = await import('fs/promises');
      const { dirname } = await import('path');
      await mkdir(dirname(job.data.outputPath), { recursive: true });
      await writeFile(job.data.outputPath, buffer);
      this.logger.log(`Report saved to ${job.data.outputPath}`);
    }

    return { size: buffer.length, type: job.data.type };
  }
}
