import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import {
  FIRST_NAMES_MALE,
  FIRST_NAMES_FEMALE,
  LAST_NAMES,
  STREETS,
  CITIES_AND_STATES,
  RACES,
  ETHNICITIES,
  MARITAL_STATUSES,
} from './data/patient-data.js';

export interface GeneratedPatient {
  mrn: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  sex: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  countryCode: string;
  phoneCell: string;
  email: string;
  race: string;
  ethnicity: string;
  language: string;
  maritalStatus: string;
}

@Injectable()
export class PatientGeneratorService {
  generate(opts?: { ageMin?: number; ageMax?: number }): GeneratedPatient {
    const ageMin = opts?.ageMin ?? 18;
    const ageMax = opts?.ageMax ?? 85;
    const sex = Math.random() > 0.5 ? 'Male' : 'Female';
    const firstName = this.pick(sex === 'Male' ? FIRST_NAMES_MALE : FIRST_NAMES_FEMALE);
    const lastName = this.pick(LAST_NAMES);
    const [city, state, zip] = this.pick(CITIES_AND_STATES);

    return {
      mrn: `SIM-${crypto.randomBytes(4).toString('hex').toUpperCase()}`,
      firstName,
      lastName,
      dateOfBirth: this.randomDateOfBirth(ageMin, ageMax),
      sex,
      street: this.pick(STREETS),
      city,
      state,
      postalCode: zip,
      countryCode: 'US',
      phoneCell: this.randomPhone(),
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`,
      race: this.pick(RACES),
      ethnicity: this.pick(ETHNICITIES),
      language: 'en',
      maritalStatus: this.pick(MARITAL_STATUSES),
    };
  }

  generateBatch(count: number, opts?: { ageMin?: number; ageMax?: number }): GeneratedPatient[] {
    return Array.from({ length: count }, () => this.generate(opts));
  }

  private randomDateOfBirth(ageMin: number, ageMax: number): string {
    const now = new Date();
    const minYear = now.getFullYear() - ageMax;
    const maxYear = now.getFullYear() - ageMin;
    const year = minYear + Math.floor(Math.random() * (maxYear - minYear + 1));
    const month = 1 + Math.floor(Math.random() * 12);
    const day = 1 + Math.floor(Math.random() * 28);
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }

  private randomPhone(): string {
    const area = 200 + Math.floor(Math.random() * 800);
    const prefix = 200 + Math.floor(Math.random() * 800);
    const line = 1000 + Math.floor(Math.random() * 9000);
    return `${area}-${prefix}-${line}`;
  }

  private pick<T>(arr: readonly T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
  }
}
