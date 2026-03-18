import { Hl7ParserService } from '../../src/hl7/hl7-parser.service.js';

describe('Hl7ParserService', () => {
  let service: Hl7ParserService;

  beforeEach(() => {
    service = new Hl7ParserService();
  });

  const sampleHl7 = [
    'MSH|^~\\&|LAB|LABFAC|OPENEMR|CLINIC|20260317120000||ORU^R01|MSG001|P|2.3',
    'PID|1||12345^^^OPENEMR||Doe^John||19850315|M',
    'ORC|RE|ORD001',
    'OBR|1|ORD001||85025^CBC with differential',
    'OBX|1|NM|6690-2^WBC||7.5|10*3/uL|4.5-11.0|N|||F||20260317120000',
    'OBX|2|NM|789-8^RBC||4.8|10*6/uL|4.2-5.9|N|||F||20260317120000',
    'OBX|3|NM|718-7^Hemoglobin||14.2|g/dL|12.0-17.5|N|||F||20260317120000',
  ].join('\n');

  describe('parse', () => {
    it('should parse HL7 message into segments', () => {
      const msg = service.parse(sampleHl7);
      expect(msg.segments).toHaveLength(7);
      expect(msg.segments[0].name).toBe('MSH');
      expect(msg.segments[1].name).toBe('PID');
    });

    it('should extract segment fields correctly', () => {
      const msg = service.parse(sampleHl7);
      const msh = service.getSegment(msg, 'MSH');
      expect(msh).toBeDefined();
      // After split on |, MSH fields[0]='MSH', fields[1]='^~\&', fields[2]='LAB'
      expect(service.getField(msh!, 1)).toBe('^~\\&');
      expect(service.getField(msh!, 2)).toBe('LAB');
    });
  });

  describe('getSegments', () => {
    it('should return all OBX segments', () => {
      const msg = service.parse(sampleHl7);
      const obxSegments = service.getSegments(msg, 'OBX');
      expect(obxSegments).toHaveLength(3);
    });
  });

  describe('getComponent', () => {
    it('should extract component from field', () => {
      expect(service.getComponent('Doe^John', 1)).toBe('Doe');
      expect(service.getComponent('Doe^John', 2)).toBe('John');
      expect(service.getComponent('Doe^John', 3)).toBe('');
    });
  });

  describe('parseLabResults', () => {
    it('should parse patient info from PID segment', () => {
      const result = service.parseLabResults(sampleHl7);
      expect(result.patientId).toBe('12345');
      expect(result.patientName?.lastName).toBe('Doe');
      expect(result.patientName?.firstName).toBe('John');
    });

    it('should parse order control ID from ORC segment', () => {
      const result = service.parseLabResults(sampleHl7);
      expect(result.orderControlId).toBe('ORD001');
    });

    it('should parse all OBX results', () => {
      const result = service.parseLabResults(sampleHl7);
      expect(result.results).toHaveLength(3);
    });

    it('should parse WBC result correctly', () => {
      const result = service.parseLabResults(sampleHl7);
      const wbc = result.results[0];
      expect(wbc.testCode).toBe('6690-2');
      expect(wbc.testName).toBe('WBC');
      expect(wbc.value).toBe('7.5');
      expect(wbc.units).toBe('10*3/uL');
      expect(wbc.referenceRange).toBe('4.5-11.0');
      expect(wbc.abnormalFlag).toBe('N');
      expect(wbc.status).toBe('F');
    });

    it('should handle empty message', () => {
      const result = service.parseLabResults('');
      expect(result.results).toHaveLength(0);
      expect(result.patientId).toBeUndefined();
    });
  });
});
