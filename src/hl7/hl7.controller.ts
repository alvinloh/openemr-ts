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
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Hl7ParserService } from './hl7-parser.service.js';
import { Hl7GeneratorService } from './hl7-generator.service.js';
import { LabService } from '../lab/lab.service.js';
import { PatientService } from '../patient/patient.service.js';
import { UuidValidationPipe } from '../common/pipes/uuid-validation.pipe.js';

@ApiTags('HL7')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('api/hl7')
export class Hl7Controller {
  private readonly logger = new Logger(Hl7Controller.name);

  constructor(
    private readonly hl7Parser: Hl7ParserService,
    private readonly hl7Generator: Hl7GeneratorService,
    private readonly labService: LabService,
    private readonly patientService: PatientService,
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

  @Post('receive')
  @HttpCode(200)
  @ApiOperation({ summary: 'Receive HL7v2 lab results' })
  async receive(@Body() body: { message: string }) {
    const parsed = this.hl7Parser.parseLabResults(body.message);
    this.logger.log(
      `Received HL7 message with ${parsed.results.length} results for patient ${parsed.patientId}`,
    );

    // Find or create lab report, then insert results
    // For now, return the parsed data
    const createdResults = [];

    if (parsed.orderControlId) {
      // Try to find existing order by control ID
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

        // Update order status
        matchingOrder.status = 'complete';
        // Save via repo...
      }
    }

    return {
      acknowledged: true,
      parsedResults: parsed.results.length,
      createdResults: createdResults.length,
    };
  }
}
