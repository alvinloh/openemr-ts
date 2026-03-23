import { Injectable } from '@nestjs/common';

export interface MdmPatientInfo {
  mrn: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  sex: string;
}

export interface MdmDocumentInfo {
  documentId: string | number;
  documentType: string;
  documentTitle: string;
  content: string;
  authorId?: string | number;
  authorLastName?: string;
  authorFirstName?: string;
  originationDateTime?: string;
}

@Injectable()
export class MdmGeneratorService {
  /**
   * MDM^T02 - Original document notification and content
   */
  generateDocument(
    patient: MdmPatientInfo,
    document: MdmDocumentInfo,
    sendingApp = 'OPENEMR-TS',
    sendingFacility = 'CLINIC',
    receivingApp = 'DOC_RECEIVER',
    receivingFacility = 'HOSPITAL',
  ): string {
    const now = this.formatHl7Date(new Date());
    const controlId = `MDM${Date.now()}`;
    const segments: string[] = [];

    // MSH
    segments.push(
      `MSH|^~\\&|${sendingApp}|${sendingFacility}|${receivingApp}|${receivingFacility}|${now}||MDM^T02|${controlId}|P|2.3`,
    );

    // EVN
    segments.push(`EVN|T02|${now}`);

    // PID
    const dob = this.formatHl7Date(new Date(patient.dateOfBirth));
    const sex = patient.sex?.[0]?.toUpperCase() || 'U';
    segments.push(
      `PID|1||${patient.mrn}^^^OPENEMR-TS||${patient.lastName}^${patient.firstName}||${dob}|${sex}`,
    );

    // PV1
    segments.push('PV1|1|O');

    // TXA - Transcription Document Header
    const originDate = document.originationDateTime
      ? this.formatHl7Date(new Date(document.originationDateTime))
      : now;
    const author = document.authorLastName
      ? `${document.authorId || ''}^${document.authorLastName}^${document.authorFirstName || ''}`
      : document.authorId || '';
    segments.push(
      `TXA|1|${document.documentType}||${originDate}|${author}||||||${document.documentId}||||AU|||${document.documentTitle}`,
    );

    // OBX - Document Content
    // Escape content for HL7 (replace line breaks with \.br\)
    const escapedContent = document.content
      .replace(/\r\n/g, '\\.br\\')
      .replace(/\n/g, '\\.br\\')
      .replace(/\r/g, '\\.br\\');

    segments.push(
      `OBX|1|TX|DOC_TEXT^Document Text||${escapedContent}||||||F`,
    );

    return segments.join('\r');
  }

  private formatHl7Date(date: Date): string {
    return date
      .toISOString()
      .replace(/[-:T]/g, '')
      .replace(/\.\d+Z$/, '');
  }
}
