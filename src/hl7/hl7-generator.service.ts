import { Injectable } from '@nestjs/common';
import { LabOrder } from '../lab/entities/lab-order.entity.js';
import { LabOrderCode } from '../lab/entities/lab-order-code.entity.js';

@Injectable()
export class Hl7GeneratorService {
  generateLabOrder(
    order: LabOrder,
    codes: LabOrderCode[],
    patientInfo: { firstName: string; lastName: string; dateOfBirth: string; sex: string; mrn: string },
    sendingApp = 'OPENEMR-TS',
    sendingFacility = 'CLINIC',
    receivingApp = 'LAB',
    receivingFacility = 'LAB',
  ): string {
    const now = this.formatHl7Date(new Date());
    const segments: string[] = [];

    // MSH - Message Header
    segments.push(
      `MSH|^~\\&|${sendingApp}|${sendingFacility}|${receivingApp}|${receivingFacility}|${now}||ORM^O01|${order.controlId || order.id}|P|2.3`,
    );

    // PID - Patient Identification
    segments.push(
      `PID|1||${patientInfo.mrn}^^^OPENEMR-TS||${patientInfo.lastName}^${patientInfo.firstName}||${this.formatHl7Date(new Date(patientInfo.dateOfBirth))}|${patientInfo.sex?.[0] || 'U'}`,
    );

    // PV1 - Patient Visit
    segments.push(`PV1|1|O`);

    // ORC - Common Order
    segments.push(
      `ORC|NW|${order.id}|||${order.status === 'pending' ? 'SC' : 'IP'}`,
    );

    // OBR - Observation Request (one per order code)
    for (const code of codes) {
      segments.push(
        `OBR|${code.seq}|${order.id}||${code.procedureCode}^${code.procedureName}|||${order.collectedDate ? this.formatHl7Date(new Date(order.collectedDate)) : ''}||||||||${order.providerId || ''}`,
      );
    }

    return segments.join('\r');
  }

  private formatHl7Date(date: Date): string {
    return date
      .toISOString()
      .replace(/[-:T]/g, '')
      .replace(/\.\d+Z$/, '');
  }
}
