import { Injectable } from '@nestjs/common';

export interface OruPatientInfo {
  mrn: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  sex: string;
}

export interface OruLabResult {
  testCode: string;
  testName: string;
  value: string;
  units: string;
  referenceRange: string;
  abnormalFlag?: string;
  status?: string;
}

@Injectable()
export class OruGeneratorService {
  /**
   * ORU^R01 - Unsolicited observation result (lab results)
   */
  generateLabResults(
    patient: OruPatientInfo,
    orderControlId: string | number,
    results: OruLabResult[],
    sendingApp = 'LAB_SYSTEM',
    sendingFacility = 'LAB',
    receivingApp = 'OPENEMR-TS',
    receivingFacility = 'CLINIC',
  ): string {
    const now = this.formatHl7Date(new Date());
    const controlId = `ORU${Date.now()}`;
    const segments: string[] = [];

    // MSH
    segments.push(
      `MSH|^~\\&|${sendingApp}|${sendingFacility}|${receivingApp}|${receivingFacility}|${now}||ORU^R01|${controlId}|P|2.3`,
    );

    // PID
    const dob = this.formatHl7Date(new Date(patient.dateOfBirth));
    const sex = patient.sex?.[0]?.toUpperCase() || 'U';
    segments.push(
      `PID|1||${patient.mrn}^^^OPENEMR-TS||${patient.lastName}^${patient.firstName}||${dob}|${sex}`,
    );

    // PV1
    segments.push('PV1|1|O');

    // ORC
    segments.push(`ORC|RE|${orderControlId}`);

    // OBR
    segments.push(
      `OBR|1|${orderControlId}||LAB_PANEL^Laboratory Panel|||${now}`,
    );

    // OBX for each result
    for (let i = 0; i < results.length; i++) {
      const r = results[i];
      const abnormal = r.abnormalFlag || 'N';
      const status = r.status || 'F';
      segments.push(
        `OBX|${i + 1}|NM|${r.testCode}^${r.testName}||${r.value}|${r.units}|${r.referenceRange}|${abnormal}|||${status}|||${now}`,
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
