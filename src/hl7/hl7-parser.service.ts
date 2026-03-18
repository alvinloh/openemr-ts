import { Injectable, Logger } from '@nestjs/common';

export interface Hl7Segment {
  name: string;
  fields: string[];
}

export interface Hl7Message {
  segments: Hl7Segment[];
  raw: string;
}

export interface ParsedMdmDocument {
  messageType: string; // MDM^T02, MDM^T04, MDM^T08
  patientId?: string;
  patientName?: { lastName: string; firstName: string };
  document: {
    uniqueId?: string;
    type?: string;         // Document type (e.g. DS=Discharge Summary, CN=Consultation Note)
    typeName?: string;     // Human-readable document type name
    activityStatus?: string; // AU=Authenticated, DI=Dictated, etc.
    originationDateTime?: string;
    author?: string;
    transcriptionist?: string;
    title?: string;
  };
  content: string;        // The actual document text content
  contentSegments: string[]; // Individual OBX text segments
}

export interface ParsedLabResult {
  patientId?: string;
  patientName?: { lastName: string; firstName: string };
  orderControlId?: string;
  results: Array<{
    testCode: string;
    testName: string;
    value: string;
    units: string;
    referenceRange: string;
    abnormalFlag: string;
    status: string;
    observationDate: string;
  }>;
}

@Injectable()
export class Hl7ParserService {
  private readonly logger = new Logger(Hl7ParserService.name);

  parse(raw: string): Hl7Message {
    const lines = raw.split(/\r?\n/).filter((l) => l.trim());
    const segments: Hl7Segment[] = lines.map((line) => {
      const fields = line.split('|');
      return { name: fields[0], fields };
    });
    return { segments, raw };
  }

  getSegment(msg: Hl7Message, name: string): Hl7Segment | undefined {
    return msg.segments.find((s) => s.name === name);
  }

  getSegments(msg: Hl7Message, name: string): Hl7Segment[] {
    return msg.segments.filter((s) => s.name === name);
  }

  getField(segment: Hl7Segment, index: number): string {
    // MSH is special: field separator | is MSH-1, so MSH-N = fields[N-1]
    // All other segments: SEG-N = fields[N]
    if (segment.name === 'MSH') {
      return segment.fields[index - 1] || '';
    }
    return segment.fields[index] || '';
  }

  getComponent(field: string, index: number): string {
    const parts = field.split('^');
    return parts[index - 1] || '';
  }

  parseLabResults(raw: string): ParsedLabResult {
    const msg = this.parse(raw);
    const pid = this.getSegment(msg, 'PID');
    const orc = this.getSegment(msg, 'ORC');
    const obxSegments = this.getSegments(msg, 'OBX');

    const result: ParsedLabResult = { results: [] };

    if (pid) {
      const patientIdField = this.getField(pid, 3);
      result.patientId = this.getComponent(patientIdField, 1);
      const nameField = this.getField(pid, 5);
      result.patientName = {
        lastName: this.getComponent(nameField, 1),
        firstName: this.getComponent(nameField, 2),
      };
    }

    if (orc) {
      result.orderControlId = this.getField(orc, 2);
    }

    for (const obx of obxSegments) {
      result.results.push({
        testCode: this.getComponent(this.getField(obx, 3), 1),
        testName: this.getComponent(this.getField(obx, 3), 2),
        value: this.getField(obx, 5),
        units: this.getField(obx, 6),
        referenceRange: this.getField(obx, 7),
        abnormalFlag: this.getField(obx, 8),
        status: this.getField(obx, 11),
        observationDate: this.getField(obx, 14),
      });
    }

    return result;
  }

  // Detect HL7 message type from MSH segment
  getMessageType(raw: string): { type: string; trigger: string; full: string } {
    const msg = this.parse(raw);
    const msh = this.getSegment(msg, 'MSH');
    if (!msh) return { type: '', trigger: '', full: '' };
    const msgTypeField = this.getField(msh, 9);
    const type = this.getComponent(msgTypeField, 1);    // e.g. MDM, ORU, ORM
    const trigger = this.getComponent(msgTypeField, 2);  // e.g. T02, R01, O01
    return { type, trigger, full: `${type}^${trigger}` };
  }

  // Parse MDM (Medical Document Management) message
  parseMdmDocument(raw: string): ParsedMdmDocument {
    const msg = this.parse(raw);
    const msh = this.getSegment(msg, 'MSH');
    const pid = this.getSegment(msg, 'PID');
    const txa = this.getSegment(msg, 'TXA');
    const obxSegments = this.getSegments(msg, 'OBX');

    const msgTypeField = msh ? this.getField(msh, 9) : '';
    const messageType = this.getComponent(msgTypeField, 1) + '^' + this.getComponent(msgTypeField, 2);

    const result: ParsedMdmDocument = {
      messageType,
      document: {},
      content: '',
      contentSegments: [],
    };

    // PID — Patient Identification
    if (pid) {
      const patientIdField = this.getField(pid, 3);
      result.patientId = this.getComponent(patientIdField, 1);
      const nameField = this.getField(pid, 5);
      result.patientName = {
        lastName: this.getComponent(nameField, 1),
        firstName: this.getComponent(nameField, 2),
      };
    }

    // TXA — Transcription Document Header
    if (txa) {
      result.document = {
        uniqueId: this.getField(txa, 12),
        type: this.getField(txa, 2),
        typeName: this.getComponent(this.getField(txa, 2), 2) || this.mapDocumentType(this.getField(txa, 2)),
        activityStatus: this.getField(txa, 17),
        originationDateTime: this.getField(txa, 4),
        author: this.getComponent(this.getField(txa, 5), 1)
          ? this.getComponent(this.getField(txa, 5), 2) + ' ' + this.getComponent(this.getField(txa, 5), 1)
          : this.getField(txa, 5),
        transcriptionist: this.getField(txa, 11),
        title: this.getField(txa, 16) || this.getComponent(this.getField(txa, 2), 2) || undefined,
      };
    }

    // OBX — Document Content (text segments)
    for (const obx of obxSegments) {
      const valueType = this.getField(obx, 2); // TX=text, FT=formatted text, ED=encapsulated data
      let text = '';

      if (valueType === 'TX' || valueType === 'FT' || valueType === 'ST') {
        text = this.getField(obx, 5);
      } else if (valueType === 'ED') {
        // Encapsulated data: encoding^type^data
        const edField = this.getField(obx, 5);
        const encoding = this.getComponent(edField, 3);
        const data = this.getComponent(edField, 5) || this.getComponent(edField, 4);
        if (encoding === 'Base64' && data) {
          try { text = Buffer.from(data, 'base64').toString('utf-8'); } catch { text = data; }
        } else {
          text = data || edField;
        }
      } else {
        text = this.getField(obx, 5);
      }

      if (text) {
        // HL7 uses \.br\ for line breaks in formatted text
        text = text.replace(/\\\.br\\/g, '\n').replace(/\\R\\/g, '\n');
        result.contentSegments.push(text);
      }
    }

    result.content = result.contentSegments.join('\n');

    return result;
  }

  // Map common document type codes to names
  private mapDocumentType(code: string): string {
    const types: Record<string, string> = {
      'DS': 'Discharge Summary',
      'HP': 'History & Physical',
      'OP': 'Operative Report',
      'CN': 'Consultation Note',
      'PN': 'Progress Note',
      'ED': 'Emergency Department Note',
      'SR': 'Surgical Report',
      'PR': 'Pathology Report',
      'RA': 'Radiology Report',
      'LT': 'Letter',
      'TX': 'Transfer Summary',
    };
    return types[code] || code;
  }
}
