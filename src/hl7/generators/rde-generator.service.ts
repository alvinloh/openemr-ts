import { Injectable } from '@nestjs/common';

export interface RdePatientInfo {
  mrn: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  sex: string;
}

export interface RdeMedicationInfo {
  rxCode: string;
  rxName: string;
  dose: string;
  units: string;
  route?: string;
  frequency?: string;
  quantity?: number;
  refills?: number;
  providerId?: number | string;
  providerLastName?: string;
  providerFirstName?: string;
  pharmacy?: string;
}

@Injectable()
export class RdeGeneratorService {
  /**
   * RDE^O11 - Pharmacy/Treatment Encoded Order
   */
  generatePharmacyOrder(
    patient: RdePatientInfo,
    medication: RdeMedicationInfo,
    sendingApp = 'OPENEMR-TS',
    sendingFacility = 'CLINIC',
    receivingApp = 'PHARMACY',
    receivingFacility = 'PHARMACY',
  ): string {
    const now = this.formatHl7Date(new Date());
    const controlId = `RDE${Date.now()}`;
    const segments: string[] = [];

    // MSH
    segments.push(
      `MSH|^~\\&|${sendingApp}|${sendingFacility}|${receivingApp}|${receivingFacility}|${now}||RDE^O11|${controlId}|P|2.3`,
    );

    // PID
    const dob = this.formatHl7Date(new Date(patient.dateOfBirth));
    const sex = patient.sex?.[0]?.toUpperCase() || 'U';
    segments.push(
      `PID|1||${patient.mrn}^^^OPENEMR-TS||${patient.lastName}^${patient.firstName}||${dob}|${sex}`,
    );

    // PV1
    segments.push('PV1|1|O');

    // ORC - Common Order
    const provider = medication.providerLastName
      ? `${medication.providerId || ''}^${medication.providerLastName}^${medication.providerFirstName || ''}`
      : medication.providerId || '';
    segments.push(`ORC|NW|${controlId}|||SC|||${now}|||${provider}`);

    // RXE - Pharmacy/Treatment Encoded Order
    const route = medication.route || 'PO';
    const frequency = medication.frequency || 'QD';
    const quantity = medication.quantity || 30;
    const refills = medication.refills || 0;
    segments.push(
      `RXE|${frequency}|${medication.rxCode}^${medication.rxName}|${medication.dose}||${medication.units}|||${refills}||${quantity}|${medication.units}|||||||||||${route}`,
    );

    // RXR - Pharmacy/Treatment Route
    segments.push(`RXR|${route}`);

    return segments.join('\r');
  }

  private formatHl7Date(date: Date): string {
    return date
      .toISOString()
      .replace(/[-:T]/g, '')
      .replace(/\.\d+Z$/, '');
  }
}
