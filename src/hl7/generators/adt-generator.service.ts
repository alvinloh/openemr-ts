import { Injectable } from '@nestjs/common';

export interface AdtPatientInfo {
  mrn: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  sex: string;
  street?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  phoneHome?: string;
  phoneCell?: string;
  race?: string;
  ethnicity?: string;
  language?: string;
  maritalStatus?: string;
}

export interface AdtEncounterInfo {
  encounterId: number | string;
  encounterDate: string;
  encounterType?: string;
  providerId?: number | string;
  providerLastName?: string;
  providerFirstName?: string;
  facilityName?: string;
}

@Injectable()
export class AdtGeneratorService {
  /**
   * ADT^A04 - Register a Patient
   */
  generateRegister(
    patient: AdtPatientInfo,
    sendingApp = 'OPENEMR-TS',
    sendingFacility = 'CLINIC',
    receivingApp = 'ADT_RECEIVER',
    receivingFacility = 'HOSPITAL',
  ): string {
    const now = this.formatHl7Date(new Date());
    const controlId = `REG${Date.now()}`;
    const segments: string[] = [];

    segments.push(
      `MSH|^~\\&|${sendingApp}|${sendingFacility}|${receivingApp}|${receivingFacility}|${now}||ADT^A04|${controlId}|P|2.3`,
    );
    segments.push(`EVN|A04|${now}`);
    segments.push(this.buildPid(patient));
    segments.push(`PV1|1|O|||||||||||||||||||||||||||||||||||||||${now}`);

    return segments.join('\r');
  }

  /**
   * ADT^A01 - Admit/Check-in a Patient
   */
  generateAdmit(
    patient: AdtPatientInfo,
    encounter: AdtEncounterInfo,
    sendingApp = 'OPENEMR-TS',
    sendingFacility = 'CLINIC',
    receivingApp = 'ADT_RECEIVER',
    receivingFacility = 'HOSPITAL',
  ): string {
    const now = this.formatHl7Date(new Date());
    const controlId = `ADM${Date.now()}`;
    const segments: string[] = [];

    segments.push(
      `MSH|^~\\&|${sendingApp}|${sendingFacility}|${receivingApp}|${receivingFacility}|${now}||ADT^A01|${controlId}|P|2.3`,
    );
    segments.push(`EVN|A01|${now}`);
    segments.push(this.buildPid(patient));
    segments.push(this.buildPv1(encounter));

    return segments.join('\r');
  }

  /**
   * ADT^A03 - Discharge a Patient
   */
  generateDischarge(
    patient: AdtPatientInfo,
    encounter: AdtEncounterInfo,
    sendingApp = 'OPENEMR-TS',
    sendingFacility = 'CLINIC',
    receivingApp = 'ADT_RECEIVER',
    receivingFacility = 'HOSPITAL',
  ): string {
    const now = this.formatHl7Date(new Date());
    const controlId = `DIS${Date.now()}`;
    const segments: string[] = [];

    segments.push(
      `MSH|^~\\&|${sendingApp}|${sendingFacility}|${receivingApp}|${receivingFacility}|${now}||ADT^A03|${controlId}|P|2.3`,
    );
    segments.push(`EVN|A03|${now}`);
    segments.push(this.buildPid(patient));
    segments.push(this.buildPv1(encounter, now));

    return segments.join('\r');
  }

  private buildPid(patient: AdtPatientInfo): string {
    const dob = this.formatHl7Date(new Date(patient.dateOfBirth));
    const sex = patient.sex?.[0]?.toUpperCase() || 'U';
    const address = [
      patient.street || '',
      '',
      patient.city || '',
      patient.state || '',
      patient.postalCode || '',
    ].join('^');
    const phone = patient.phoneHome || patient.phoneCell || '';

    return `PID|1||${patient.mrn}^^^OPENEMR-TS||${patient.lastName}^${patient.firstName}||${dob}|${sex}|||${address}||${phone}`;
  }

  private buildPv1(encounter?: AdtEncounterInfo, dischargeDate?: string): string {
    if (!encounter) {
      return 'PV1|1|O';
    }
    const provider = encounter.providerLastName
      ? `${encounter.providerId || ''}^${encounter.providerLastName}^${encounter.providerFirstName || ''}`
      : encounter.providerId || '';
    const admitDate = this.formatHl7Date(new Date(encounter.encounterDate));
    const discharge = dischargeDate || '';
    return `PV1|1|O|${encounter.facilityName || ''}||||${provider}|||||||||${encounter.encounterId}|||||||||||||||||||||||${admitDate}|${discharge}`;
  }

  private formatHl7Date(date: Date): string {
    return date
      .toISOString()
      .replace(/[-:T]/g, '')
      .replace(/\.\d+Z$/, '');
  }
}
