import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  HttpCode,
  Logger,
} from '@nestjs/common';
import { JwtOrApiKeyGuard } from '../common/guards/jwt-or-apikey.guard.js';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Hl7ParserService } from './hl7-parser.service.js';
import { Hl7GeneratorService } from './hl7-generator.service.js';
import { Hl7SenderService } from './hl7-sender.service.js';
import { LabService } from '../lab/lab.service.js';
import { PatientService } from '../patient/patient.service.js';
import { WebhookService } from '../webhook/webhook.service.js';
import { UuidValidationPipe } from '../common/pipes/uuid-validation.pipe.js';
import { ApiResponse } from '../common/dto/api-response.dto.js';

@ApiTags('HL7')
@ApiBearerAuth()
@UseGuards(JwtOrApiKeyGuard)
@Controller('api/hl7')
export class Hl7Controller {
  private readonly logger = new Logger(Hl7Controller.name);

  constructor(
    private readonly hl7Parser: Hl7ParserService,
    private readonly hl7Generator: Hl7GeneratorService,
    private readonly hl7Sender: Hl7SenderService,
    private readonly labService: LabService,
    private readonly patientService: PatientService,
    private readonly webhookService: WebhookService,
  ) {}

  @Get('generate/:orderUuid')
  @ApiOperation({ summary: 'Generate HL7v2 ORM order message for a lab order' })
  async generateOrder(@Param('orderUuid', UuidValidationPipe) orderUuid: string) {
    const order = await this.labService.findOrderByUuid(orderUuid);
    const codes = await this.labService.getOrderCodes(order.id);
    const patient = await this.patientService.findById(order.patientId);

    const hl7Message = this.hl7Generator.generateLabOrder(order, codes, {
      firstName: patient.firstName,
      lastName: patient.lastName,
      dateOfBirth: patient.dateOfBirth,
      sex: patient.sex,
      mrn: patient.mrn,
    });

    return {
      orderUuid: order.uuid,
      orderId: order.id,
      patientName: `${patient.lastName}, ${patient.firstName}`,
      patientMrn: patient.mrn,
      tests: codes.map((c) => `${c.procedureCode}: ${c.procedureName}`),
      hl7Message,
      segments: hl7Message.split('\r').filter(Boolean),
    };
  }

  @Post('send/:orderUuid')
  @ApiOperation({ summary: 'Generate and send HL7v2 order to configured lab system' })
  async sendOrder(
    @Param('orderUuid', UuidValidationPipe) orderUuid: string,
    @Body() body?: { labProviderId?: number },
  ) {
    const order = await this.labService.findOrderByUuid(orderUuid);
    const codes = await this.labService.getOrderCodes(order.id);
    const patient = await this.patientService.findById(order.patientId);

    const hl7Message = this.hl7Generator.generateLabOrder(order, codes, {
      firstName: patient.firstName,
      lastName: patient.lastName,
      dateOfBirth: patient.dateOfBirth,
      sex: patient.sex,
      mrn: patient.mrn,
    });

    const result = await this.hl7Sender.send(hl7Message, body?.labProviderId);

    // Dispatch webhook
    this.webhookService.dispatch('lab.order.sent', {
      orderId: order.id,
      orderUuid: order.uuid,
      patientId: order.patientId,
      patientMrn: patient.mrn,
      tests: codes.map((c) => c.procedureName),
      sendResult: result,
    });

    return result;
  }

  // ── Lab Providers ──

  @Get('providers')
  @ApiOperation({ summary: 'List configured lab providers' })
  async getProviders() {
    return ApiResponse.ok(await this.hl7Sender.getProviders());
  }

  @Post('providers')
  @ApiOperation({ summary: 'Create or update a lab provider' })
  async createProvider(@Body() body: any) {
    if (body.id) {
      return ApiResponse.ok(await this.hl7Sender.updateProvider(body.id, body));
    }
    return ApiResponse.ok(await this.hl7Sender.createProvider(body));
  }

  @Post('receive')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Receive HL7v2 messages (auto-detects ORU lab results and MDM clinical documents)',
  })
  async receive(@Body() body: { message: string }) {
    const msgType = this.hl7Parser.getMessageType(body.message);
    this.logger.log(`Received HL7 message type: ${msgType.full}`);

    // Route by message type
    if (msgType.type === 'MDM') {
      return this.handleMdm(body.message);
    }

    // Default: treat as ORU (lab results)
    return this.handleOru(body.message);
  }

  // ── ORU: Lab Results ──

  private async handleOru(message: string) {
    const parsed = this.hl7Parser.parseLabResults(message);
    this.logger.log(
      `Processing ORU: ${parsed.results.length} results for patient ${parsed.patientId}`,
    );

    const createdResults: any[] = [];

    if (parsed.orderControlId) {
      const orders = await this.labService.findOrders({});
      const matchingOrder = orders.find(
        (o) => String(o.id) === parsed.orderControlId || o.controlId === parsed.orderControlId,
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

    if (createdResults.length > 0) {
      this.webhookService.dispatch('lab.results.received', {
        patientId: parsed.patientId,
        orderControlId: parsed.orderControlId,
        resultsCount: createdResults.length,
        results: parsed.results,
      });
    }

    return {
      acknowledged: true,
      messageType: 'ORU',
      parsedResults: parsed.results.length,
      createdResults: createdResults.length,
    };
  }

  // ── MDM: Medical Document Management ──

  private async handleMdm(message: string) {
    const parsed = this.hl7Parser.parseMdmDocument(message);
    this.logger.log(
      `Processing ${parsed.messageType}: "${parsed.document.typeName || parsed.document.type}" for patient ${parsed.patientId}`,
    );

    if (!parsed.content) {
      return {
        acknowledged: true,
        messageType: parsed.messageType,
        error: 'No document content found in OBX segments',
      };
    }

    // Find matching patient
    let patientId: number | null = null;
    if (parsed.patientId) {
      try {
        // Try to find by MRN
        const patients = await this.patientService.findAll({
          mrn: parsed.patientId,
          page: 1,
          limit: 1,
          skip: 0,
        } as any);
        if (patients.data.length > 0) {
          patientId = patients.data[0].id;
        }
      } catch {
        // Try as numeric ID
        patientId = parseInt(parsed.patientId) || null;
      }
    }

    // Store as document in patient chart
    let document = null;
    if (patientId) {
      const docTitle = parsed.document.title
        || parsed.document.typeName
        || parsed.document.type
        || 'Clinical Document';

      const fileName = `${docTitle.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.txt`;
      const fileBuffer = Buffer.from(parsed.content, 'utf-8');

      // Use document service to store
      const { DocumentService } = await import('../document/document.service.js');
      // We need to store manually since we have a buffer, not a Multer file
      const { writeFile, mkdir } = await import('fs/promises');
      const { join, dirname } = await import('path');
      const { createHash } = await import('crypto');

      const uploadDir = process.env.UPLOAD_DIR || './uploads';
      const storagePath = join(String(patientId), `mdm-${fileName}`);
      const fullPath = join(uploadDir, storagePath);
      await mkdir(dirname(fullPath), { recursive: true });
      await writeFile(fullPath, fileBuffer);

      // Import the Document entity repository via TypeORM
      // For simplicity, we'll return the parsed data and let the caller handle storage
      document = {
        patientId,
        fileName,
        storagePath,
        size: fileBuffer.length,
        hash: createHash('sha256').update(fileBuffer).digest('hex'),
        documentType: parsed.document.typeName || parsed.document.type,
        author: parsed.document.author,
        originationDate: parsed.document.originationDateTime,
        activityStatus: parsed.document.activityStatus,
      };

      this.logger.log(
        `MDM document stored for patient ${patientId}: ${fileName} (${fileBuffer.length} bytes)`,
      );
    }

    // Dispatch webhook
    this.webhookService.dispatch('document.received', {
      messageType: parsed.messageType,
      patientId: patientId || parsed.patientId,
      patientName: parsed.patientName,
      documentType: parsed.document.typeName || parsed.document.type,
      title: parsed.document.title,
      author: parsed.document.author,
      contentLength: parsed.content.length,
      activityStatus: parsed.document.activityStatus,
    });

    return {
      acknowledged: true,
      messageType: parsed.messageType,
      patientId: patientId || parsed.patientId,
      document: {
        type: parsed.document.typeName || parsed.document.type,
        title: parsed.document.title,
        author: parsed.document.author,
        status: parsed.document.activityStatus,
        contentLength: parsed.content.length,
        contentPreview: parsed.content.substring(0, 200) + (parsed.content.length > 200 ? '...' : ''),
        stored: !!document,
        storagePath: document?.storagePath,
      },
    };
  }
}
