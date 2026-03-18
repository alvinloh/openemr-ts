import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BillingEntry } from './entities/billing-entry.entity.js';
import { Claim } from './entities/claim.entity.js';
import { Insurance } from './entities/insurance.entity.js';

@Injectable()
export class BillingService {
  constructor(
    @InjectRepository(BillingEntry)
    private readonly billingRepo: Repository<BillingEntry>,
    @InjectRepository(Claim)
    private readonly claimRepo: Repository<Claim>,
    @InjectRepository(Insurance)
    private readonly insuranceRepo: Repository<Insurance>,
  ) {}

  // ── Billing Entries ──

  async createEntry(data: Partial<BillingEntry>): Promise<BillingEntry> {
    return this.billingRepo.save(this.billingRepo.create(data));
  }

  async getEntriesByEncounter(encounterId: number): Promise<BillingEntry[]> {
    return this.billingRepo.find({ where: { encounterId, active: true } });
  }

  async getEntriesByPatient(patientId: number): Promise<BillingEntry[]> {
    return this.billingRepo.find({
      where: { patientId, active: true },
      order: { createdAt: 'DESC' },
    });
  }

  // ── Claims ──

  async createClaim(data: Partial<Claim>): Promise<Claim> {
    return this.claimRepo.save(this.claimRepo.create(data));
  }

  async getClaimsByPatient(patientId: number): Promise<Claim[]> {
    return this.claimRepo.find({
      where: { patientId },
      order: { billTime: 'DESC' },
    });
  }

  // ── Insurance ──

  async getPatientInsurance(patientId: number): Promise<Insurance[]> {
    return this.insuranceRepo.find({ where: { patientId } });
  }

  async createInsurance(data: Partial<Insurance>): Promise<Insurance> {
    return this.insuranceRepo.save(this.insuranceRepo.create(data));
  }
}
