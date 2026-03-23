import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { PatientGeneratorService, GeneratedPatient } from './patient-generator.service.js';
import { PatientService } from '../patient/patient.service.js';
import { EncounterService } from '../encounter/encounter.service.js';
import { LabService } from '../lab/lab.service.js';
import { SchedulingService } from '../scheduling/scheduling.service.js';
import { MedicationService } from '../medication/medication.service.js';
import { Hl7SenderService, SendResult } from '../hl7/hl7-sender.service.js';
import { AdtGeneratorService } from '../hl7/generators/adt-generator.service.js';
import { OruGeneratorService } from '../hl7/generators/oru-generator.service.js';
import { SiuGeneratorService } from '../hl7/generators/siu-generator.service.js';
import { RdeGeneratorService } from '../hl7/generators/rde-generator.service.js';
import { Hl7GeneratorService } from '../hl7/hl7-generator.service.js';
import { LAB_PANELS, LabPanelDefinition } from './data/lab-panels.js';
import { DIAGNOSIS_CODES, MEDICATIONS } from './data/patient-data.js';
import { Patient } from '../patient/entities/patient.entity.js';

export type SimulationStep = 'register' | 'checkin' | 'order-labs' | 'receive-results' | 'schedule-followup' | 'prescribe' | 'discharge';

export interface SimulationRequest {
  scenario?: string;
  steps?: SimulationStep[];
  patientCount: number;
  labPanels?: string[];
  pacing?: 'instant' | 'realtime';
  tenantId?: number;
  ageMin?: number;
  ageMax?: number;
}

export interface StepResult {
  step: SimulationStep;
  patientMrn: string;
  patientName: string;
  entityType: string;
  entityUuid?: string;
  hl7MessageType: string;
  hl7Sent: boolean;
  hl7SendResult?: SendResult;
  hl7Message?: string;
  durationMs: number;
}

export interface SimulationResult {
  simulationId: string;
  scenario: string;
  patientsCreated: number;
  stepsExecuted: number;
  hl7MessagesSent: number;
  hl7MessagesGenerated: number;
  durationMs: number;
  steps: StepResult[];
}

const PRESET_SCENARIOS: Record<string, SimulationStep[]> = {
  'full-visit': ['register', 'checkin', 'order-labs', 'receive-results', 'schedule-followup'],
  'lab-only': ['register', 'order-labs', 'receive-results'],
  'admit-discharge': ['register', 'checkin', 'discharge'],
  'pharmacy': ['register', 'checkin', 'prescribe', 'discharge'],
  'referral': ['register', 'schedule-followup'],
};

@Injectable()
export class SimulationService {
  private readonly logger = new Logger(SimulationService.name);

  constructor(
    private readonly patientGenerator: PatientGeneratorService,
    private readonly patientService: PatientService,
    private readonly encounterService: EncounterService,
    private readonly labService: LabService,
    private readonly schedulingService: SchedulingService,
    private readonly medicationService: MedicationService,
    private readonly hl7Sender: Hl7SenderService,
    private readonly hl7Generator: Hl7GeneratorService,
    private readonly adtGenerator: AdtGeneratorService,
    private readonly oruGenerator: OruGeneratorService,
    private readonly siuGenerator: SiuGeneratorService,
    private readonly rdeGenerator: RdeGeneratorService,
  ) {}

  getPresets(): Record<string, SimulationStep[]> {
    return PRESET_SCENARIOS;
  }

  async run(request: SimulationRequest): Promise<SimulationResult> {
    const simulationId = uuidv4();
    const startTime = Date.now();

    // Resolve steps from scenario or explicit steps
    let steps = request.steps;
    if (!steps && request.scenario) {
      steps = PRESET_SCENARIOS[request.scenario];
      if (!steps) {
        throw new BadRequestException(
          `Unknown scenario "${request.scenario}". Available: ${Object.keys(PRESET_SCENARIOS).join(', ')}`,
        );
      }
    }
    if (!steps || steps.length === 0) {
      steps = PRESET_SCENARIOS['full-visit'];
    }

    const scenario = request.scenario || 'custom';
    const patientCount = Math.min(request.patientCount, 100); // Cap at 100

    this.logger.log(
      `Simulation ${simulationId}: ${scenario} with ${patientCount} patients, steps: ${steps.join(' → ')}`,
    );

    // Generate patient data
    const generatedPatients = this.patientGenerator.generateBatch(patientCount, {
      ageMin: request.ageMin,
      ageMax: request.ageMax,
    });

    const allStepResults: StepResult[] = [];
    let hl7Sent = 0;
    let hl7Generated = 0;

    // Process each patient through the workflow
    for (const genPatient of generatedPatients) {
      const context: WorkflowContext = {
        genPatient,
        tenantId: request.tenantId,
        labPanels: request.labPanels,
      };

      for (const step of steps) {
        const stepStart = Date.now();
        try {
          const result = await this.executeStep(step, context);
          result.durationMs = Date.now() - stepStart;
          allStepResults.push(result);

          if (result.hl7Message) hl7Generated++;
          if (result.hl7Sent) hl7Sent++;

          // Add pacing delay for realtime mode
          if (request.pacing === 'realtime') {
            await this.delay(500 + Math.random() * 1500);
          }
        } catch (err: any) {
          this.logger.error(`Step "${step}" failed for ${genPatient.mrn}: ${err.message}`);
          allStepResults.push({
            step,
            patientMrn: genPatient.mrn,
            patientName: `${genPatient.lastName}, ${genPatient.firstName}`,
            entityType: 'error',
            hl7MessageType: 'N/A',
            hl7Sent: false,
            durationMs: Date.now() - stepStart,
          });
        }
      }
    }

    return {
      simulationId,
      scenario,
      patientsCreated: patientCount,
      stepsExecuted: allStepResults.length,
      hl7MessagesSent: hl7Sent,
      hl7MessagesGenerated: hl7Generated,
      durationMs: Date.now() - startTime,
      steps: allStepResults,
    };
  }

  async cleanup(tenantId?: number): Promise<{ deletedPatients: number }> {
    const deleted = await this.patientService.deleteByMrnPrefix('SIM-', tenantId);
    return { deletedPatients: deleted };
  }

  // --- Step executors ---

  private async executeStep(step: SimulationStep, ctx: WorkflowContext): Promise<StepResult> {
    switch (step) {
      case 'register':
        return this.stepRegister(ctx);
      case 'checkin':
        return this.stepCheckin(ctx);
      case 'order-labs':
        return this.stepOrderLabs(ctx);
      case 'receive-results':
        return this.stepReceiveResults(ctx);
      case 'schedule-followup':
        return this.stepScheduleFollowup(ctx);
      case 'prescribe':
        return this.stepPrescribe(ctx);
      case 'discharge':
        return this.stepDischarge(ctx);
      default:
        throw new BadRequestException(`Unknown step: ${step}`);
    }
  }

  private async stepRegister(ctx: WorkflowContext): Promise<StepResult> {
    // Create patient in database
    const patient = await this.patientService.create({
      ...ctx.genPatient,
      tenantId: ctx.tenantId,
    } as any);
    ctx.patient = patient;

    // Generate ADT^A04
    const hl7Message = this.adtGenerator.generateRegister(ctx.genPatient);
    const sendResult = await this.trySend(hl7Message);

    return {
      step: 'register',
      patientMrn: patient.mrn,
      patientName: `${patient.lastName}, ${patient.firstName}`,
      entityType: 'Patient',
      entityUuid: patient.uuid,
      hl7MessageType: 'ADT^A04',
      hl7Sent: sendResult?.success ?? false,
      hl7SendResult: sendResult ?? undefined,
      hl7Message,
      durationMs: 0,
    };
  }

  private async stepCheckin(ctx: WorkflowContext): Promise<StepResult> {
    const patient = await this.ensurePatient(ctx);

    // Create encounter
    const encounter = await this.encounterService.createEncounter(patient.id, {
      date: new Date().toISOString().split('T')[0],
      reasonForVisit: this.pick(DIAGNOSIS_CODES).description,
      type: 'office_visit',
    } as any);
    ctx.encounterId = encounter.id;
    ctx.encounterUuid = encounter.uuid;

    // Generate ADT^A01
    const hl7Message = this.adtGenerator.generateAdmit(ctx.genPatient, {
      encounterId: encounter.id,
      encounterDate: new Date().toISOString(),
    });
    const sendResult = await this.trySend(hl7Message);

    return {
      step: 'checkin',
      patientMrn: patient.mrn,
      patientName: `${patient.lastName}, ${patient.firstName}`,
      entityType: 'Encounter',
      entityUuid: encounter.uuid,
      hl7MessageType: 'ADT^A01',
      hl7Sent: sendResult?.success ?? false,
      hl7SendResult: sendResult ?? undefined,
      hl7Message,
      durationMs: 0,
    };
  }

  private async stepOrderLabs(ctx: WorkflowContext): Promise<StepResult> {
    const patient = await this.ensurePatient(ctx);

    // Pick lab panels
    const panelNames = ctx.labPanels || ['CBC', 'BMP'];
    const panels = LAB_PANELS.filter((p) =>
      panelNames.some((name) => p.code === name || p.name.toLowerCase().includes(name.toLowerCase())),
    );
    const selectedPanels = panels.length > 0 ? panels : [LAB_PANELS[0]];

    // Create lab order
    const codes = selectedPanels.flatMap((panel, pi) =>
      panel.tests.map((test, ti) => ({
        seq: pi * 10 + ti + 1,
        procedureCode: test.code,
        procedureName: test.name,
      })),
    );

    const order = await this.labService.createOrder(
      {
        patientId: patient.id,
        encounterId: ctx.encounterId,
        orderDate: new Date().toISOString().split('T')[0],
        status: 'pending',
        priority: 'routine',
        tenantId: ctx.tenantId,
      } as any,
      codes,
    );
    ctx.labOrderId = order.id;
    ctx.labOrderUuid = order.uuid;
    ctx.labPanelDefs = selectedPanels;

    // Generate ORM^O01 using existing generator
    const hl7Message = this.hl7Generator.generateLabOrder(order, codes as any, {
      firstName: patient.firstName,
      lastName: patient.lastName,
      dateOfBirth: patient.dateOfBirth,
      sex: patient.sex,
      mrn: patient.mrn,
    });
    const sendResult = await this.trySend(hl7Message);

    return {
      step: 'order-labs',
      patientMrn: patient.mrn,
      patientName: `${patient.lastName}, ${patient.firstName}`,
      entityType: 'LabOrder',
      entityUuid: order.uuid,
      hl7MessageType: 'ORM^O01',
      hl7Sent: sendResult?.success ?? false,
      hl7SendResult: sendResult ?? undefined,
      hl7Message,
      durationMs: 0,
    };
  }

  private async stepReceiveResults(ctx: WorkflowContext): Promise<StepResult> {
    const patient = await this.ensurePatient(ctx);
    const panels = ctx.labPanelDefs || [LAB_PANELS[0]];

    // Generate realistic lab results
    const results = panels.flatMap((panel) =>
      panel.tests.map((test) => {
        const value = (test.min + Math.random() * (test.max - test.min)).toFixed(1);
        let abnormalFlag = 'N';
        const numValue = parseFloat(value);
        if (test.abnormalLow && numValue < test.abnormalLow) abnormalFlag = 'L';
        if (test.abnormalHigh && numValue > test.abnormalHigh) abnormalFlag = 'H';
        return {
          testCode: test.code,
          testName: test.name,
          value,
          units: test.unit,
          referenceRange: test.referenceRange,
          abnormalFlag,
          status: 'F',
        };
      }),
    );

    // Generate ORU^R01 (simulated inbound results)
    const hl7Message = this.oruGenerator.generateLabResults(
      ctx.genPatient,
      ctx.labOrderId || 'SIM-ORDER',
      results,
    );

    // Process the results by creating report and results in the system
    if (ctx.labOrderId) {
      try {
        const report = await this.labService.createReport({
          labOrderId: ctx.labOrderId,
          reportDate: new Date().toISOString().split('T')[0],
          status: 'complete',
          reviewStatus: 'received',
        });

        for (const r of results) {
          await this.labService.createResult({
            labReportId: report.id,
            resultCode: r.testCode,
            resultText: r.testName,
            value: r.value,
            units: r.units,
            referenceRange: r.referenceRange,
            abnormal: r.abnormalFlag === 'N' ? 'no' : 'yes',
            status: 'final',
            date: new Date(),
          });
        }
      } catch (err: any) {
        this.logger.warn(`Could not store lab results: ${err.message}`);
      }
    }

    return {
      step: 'receive-results',
      patientMrn: patient.mrn,
      patientName: `${patient.lastName}, ${patient.firstName}`,
      entityType: 'LabResult',
      hl7MessageType: 'ORU^R01',
      hl7Sent: false, // This is inbound, not sent
      hl7Message,
      durationMs: 0,
    };
  }

  private async stepScheduleFollowup(ctx: WorkflowContext): Promise<StepResult> {
    const patient = await this.ensurePatient(ctx);

    // Schedule a follow-up 7 days from now
    const followupDate = new Date();
    followupDate.setDate(followupDate.getDate() + 7);
    followupDate.setHours(9 + Math.floor(Math.random() * 8), 0, 0, 0);

    const appointment = await this.schedulingService.create({
      patientId: patient.id,
      startTime: followupDate,
      duration: 30,
      status: 'scheduled',
      reason: 'Follow-up visit',
      tenantId: ctx.tenantId,
    } as any);

    // Generate SIU^S12
    const hl7Message = this.siuGenerator.generateNewAppointment(
      ctx.genPatient,
      {
        appointmentId: appointment.id,
        startTime: followupDate.toISOString(),
        duration: 30,
        reason: 'Follow-up visit',
        status: 'Booked',
      },
    );
    const sendResult = await this.trySend(hl7Message);

    return {
      step: 'schedule-followup',
      patientMrn: patient.mrn,
      patientName: `${patient.lastName}, ${patient.firstName}`,
      entityType: 'Appointment',
      entityUuid: appointment.uuid,
      hl7MessageType: 'SIU^S12',
      hl7Sent: sendResult?.success ?? false,
      hl7SendResult: sendResult ?? undefined,
      hl7Message,
      durationMs: 0,
    };
  }

  private async stepPrescribe(ctx: WorkflowContext): Promise<StepResult> {
    const patient = await this.ensurePatient(ctx);
    const med = this.pick(MEDICATIONS);

    const medication = await this.medicationService.create(patient.id, {
      drugName: med.name,
      rxnormCode: med.rxCode,
      dosage: med.dose,
      dosageUnits: med.units,
      route: med.route,
      frequency: med.frequency,
      quantity: 30,
      refills: 2,
      encounterId: ctx.encounterId,
    } as any);

    // Generate RDE^O11
    const hl7Message = this.rdeGenerator.generatePharmacyOrder(ctx.genPatient, {
      rxCode: med.rxCode,
      rxName: med.name,
      dose: med.dose,
      units: med.units,
      route: med.route,
      frequency: med.frequency,
      quantity: 30,
      refills: 2,
    });
    const sendResult = await this.trySend(hl7Message);

    return {
      step: 'prescribe',
      patientMrn: patient.mrn,
      patientName: `${patient.lastName}, ${patient.firstName}`,
      entityType: 'Medication',
      entityUuid: medication.uuid,
      hl7MessageType: 'RDE^O11',
      hl7Sent: sendResult?.success ?? false,
      hl7SendResult: sendResult ?? undefined,
      hl7Message,
      durationMs: 0,
    };
  }

  private async stepDischarge(ctx: WorkflowContext): Promise<StepResult> {
    const patient = await this.ensurePatient(ctx);

    // Generate ADT^A03
    const hl7Message = this.adtGenerator.generateDischarge(ctx.genPatient, {
      encounterId: ctx.encounterId || 0,
      encounterDate: new Date().toISOString(),
    });
    const sendResult = await this.trySend(hl7Message);

    return {
      step: 'discharge',
      patientMrn: patient.mrn,
      patientName: `${patient.lastName}, ${patient.firstName}`,
      entityType: 'Encounter',
      entityUuid: ctx.encounterUuid,
      hl7MessageType: 'ADT^A03',
      hl7Sent: sendResult?.success ?? false,
      hl7SendResult: sendResult ?? undefined,
      hl7Message,
      durationMs: 0,
    };
  }

  // --- Helpers ---

  private async ensurePatient(ctx: WorkflowContext): Promise<Patient> {
    if (ctx.patient) return ctx.patient;
    // Register step wasn't run — create the patient now
    const patient = await this.patientService.create({
      ...ctx.genPatient,
      tenantId: ctx.tenantId,
    } as any);
    ctx.patient = patient;
    return patient;
  }

  private async trySend(hl7Message: string): Promise<SendResult | null> {
    try {
      return await this.hl7Sender.send(hl7Message);
    } catch {
      return null;
    }
  }

  private pick<T>(arr: readonly T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

interface WorkflowContext {
  genPatient: GeneratedPatient;
  patient?: Patient;
  tenantId?: number;
  encounterId?: number;
  encounterUuid?: string;
  labOrderId?: number;
  labOrderUuid?: string;
  labPanels?: string[];
  labPanelDefs?: LabPanelDefinition[];
}
