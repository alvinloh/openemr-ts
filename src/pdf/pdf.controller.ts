import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import { JwtOrApiKeyGuard } from '../common/guards/jwt-or-apikey.guard.js';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Response } from 'express';
import { PdfService } from './pdf.service.js';
import { PatientService } from '../patient/patient.service.js';
import { EncounterService } from '../encounter/encounter.service.js';
import { MedicationService } from '../medication/medication.service.js';
import { LabService } from '../lab/lab.service.js';
import { PaginationDto } from '../common/dto/pagination.dto.js';

@ApiTags('PDF')
@ApiBearerAuth()
@UseGuards(JwtOrApiKeyGuard)
@Controller('api/pdf')
export class PdfController {
  constructor(
    private readonly pdfService: PdfService,
    private readonly patientService: PatientService,
    private readonly encounterService: EncounterService,
    private readonly medicationService: MedicationService,
    private readonly labService: LabService,
  ) {}

  @Get('encounter-summary')
  @ApiOperation({ summary: 'Generate encounter summary PDF' })
  async encounterSummary(
    @Query('patientId') patientId: string,
    @Query('encounterUuid') encounterUuid: string,
    @Res() res: Response,
  ) {
    const patient = await this.patientService.findById(Number(patientId));
    const encounter = await this.encounterService.findEncounterByUuid(encounterUuid);
    const vitals = await this.encounterService.getVitals(encounter.id);
    const diagnoses = await this.encounterService.getDiagnoses(encounter.id);
    const medications = await this.medicationService.findByPatient(Number(patientId));

    const buffer = await this.pdfService.generate('encounter-summary', {
      patient,
      encounter,
      vitals: vitals[0] || null,
      diagnoses,
      medications: medications.filter((m) => m.active),
    });

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="encounter-${encounterUuid}.pdf"`,
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }

  @Get('lab-report')
  @ApiOperation({ summary: 'Generate lab report PDF' })
  async labReport(
    @Query('orderUuid') orderUuid: string,
    @Res() res: Response,
  ) {
    const order = await this.labService.findOrderByUuid(orderUuid);
    const codes = await this.labService.getOrderCodes(order.id);
    const reports = await this.labService.getReports(order.id);
    const allResults: any[] = [];
    for (const report of reports) {
      const results = await this.labService.getResults(report.id);
      allResults.push(...results.map((r) => ({ ...r, reportDate: report.reportDate })));
    }

    const buffer = await this.pdfService.generate('lab-report', {
      order,
      codes,
      reports,
      results: allResults,
    });

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="lab-${orderUuid}.pdf"`,
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }
}
