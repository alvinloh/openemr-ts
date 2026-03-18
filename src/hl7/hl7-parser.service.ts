import { Injectable, Logger } from '@nestjs/common';

export interface Hl7Segment {
  name: string;
  fields: string[];
}

export interface Hl7Message {
  segments: Hl7Segment[];
  raw: string;
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
    // HL7 fields are 1-indexed, but MSH is special (field separator is field 1)
    if (segment.name === 'MSH') {
      return segment.fields[index] || '';
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
}
