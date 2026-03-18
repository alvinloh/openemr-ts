import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Socket } from 'net';
import { LabProvider } from '../lab/entities/lab-provider.entity.js';

// MLLP framing characters
const VT = String.fromCharCode(0x0b);  // Start block
const FS = String.fromCharCode(0x1c);  // End block
const CR = String.fromCharCode(0x0d);  // Carriage return

export interface SendResult {
  success: boolean;
  protocol: string;
  destination: string;
  ack?: string;
  error?: string;
  sentAt: string;
}

@Injectable()
export class Hl7SenderService {
  private readonly logger = new Logger(Hl7SenderService.name);

  constructor(
    @InjectRepository(LabProvider)
    private readonly providerRepo: Repository<LabProvider>,
  ) {}

  async send(hl7Message: string, labProviderId?: number): Promise<SendResult> {
    // If no provider specified, try to find a configured one
    let provider: LabProvider | null = null;

    if (labProviderId) {
      provider = await this.providerRepo.findOne({ where: { id: labProviderId, active: true } });
    } else {
      provider = await this.providerRepo.findOne({ where: { active: true } });
    }

    if (!provider) {
      return {
        success: false,
        protocol: 'none',
        destination: 'none',
        error: 'No active lab provider configured. Add one in Connectors → Lab Providers.',
        sentAt: new Date().toISOString(),
      };
    }

    switch (provider.protocol) {
      case 'MLLP':
        return this.sendMllp(hl7Message, provider);
      case 'HTTP':
        return this.sendHttp(hl7Message, provider);
      default:
        return {
          success: false,
          protocol: provider.protocol,
          destination: provider.name,
          error: `Protocol "${provider.protocol}" does not support outbound sending. Configure MLLP or HTTP.`,
          sentAt: new Date().toISOString(),
        };
    }
  }

  // Send via MLLP (TCP with HL7 framing)
  private sendMllp(message: string, provider: LabProvider): Promise<SendResult> {
    return new Promise((resolve) => {
      if (!provider.host || !provider.port) {
        resolve({
          success: false,
          protocol: 'MLLP',
          destination: provider.name,
          error: 'Host and port not configured for this lab provider.',
          sentAt: new Date().toISOString(),
        });
        return;
      }

      const destination = `${provider.host}:${provider.port}`;
      this.logger.log(`Sending HL7 via MLLP to ${destination}`);

      const socket = new Socket();
      let ackData = '';
      const timeout = 10000; // 10 second timeout

      socket.setTimeout(timeout);

      socket.connect(provider.port, provider.host, () => {
        // Wrap message in MLLP frame: VT + message + FS + CR
        const framedMessage = VT + message + FS + CR;
        socket.write(framedMessage);
        this.logger.log(`MLLP message sent (${message.length} chars)`);
      });

      socket.on('data', (data) => {
        ackData += data.toString();
        // Check for MLLP end of message
        if (ackData.includes(FS)) {
          socket.end();
          const ack = ackData.replace(VT, '').replace(FS, '').replace(CR, '').trim();
          this.logger.log(`MLLP ACK received: ${ack.substring(0, 100)}`);
          resolve({
            success: true,
            protocol: 'MLLP',
            destination,
            ack,
            sentAt: new Date().toISOString(),
          });
        }
      });

      socket.on('timeout', () => {
        socket.destroy();
        // Some systems don't send ACK — treat timeout after successful send as OK
        resolve({
          success: true,
          protocol: 'MLLP',
          destination,
          ack: '(no ACK received — timeout)',
          sentAt: new Date().toISOString(),
        });
      });

      socket.on('error', (err) => {
        this.logger.error(`MLLP error to ${destination}: ${err.message}`);
        resolve({
          success: false,
          protocol: 'MLLP',
          destination,
          error: err.message,
          sentAt: new Date().toISOString(),
        });
      });
    });
  }

  // Send via HTTP POST
  private async sendHttp(message: string, provider: LabProvider): Promise<SendResult> {
    const url = provider.httpUrl;
    if (!url) {
      return {
        success: false,
        protocol: 'HTTP',
        destination: provider.name,
        error: 'HTTP URL not configured for this lab provider.',
        sentAt: new Date().toISOString(),
      };
    }

    this.logger.log(`Sending HL7 via HTTP to ${url}`);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/hl7-v2',
          'Accept': 'application/hl7-v2',
        },
        body: message,
      });

      const ack = await response.text();

      return {
        success: response.ok,
        protocol: 'HTTP',
        destination: url,
        ack: ack.substring(0, 500),
        sentAt: new Date().toISOString(),
      };
    } catch (err: any) {
      return {
        success: false,
        protocol: 'HTTP',
        destination: url,
        error: err.message,
        sentAt: new Date().toISOString(),
      };
    }
  }

  async getProviders(): Promise<LabProvider[]> {
    return this.providerRepo.find({ order: { name: 'ASC' } });
  }

  async createProvider(data: Partial<LabProvider>): Promise<LabProvider> {
    return this.providerRepo.save(this.providerRepo.create(data));
  }

  async updateProvider(id: number, data: Partial<LabProvider>): Promise<LabProvider> {
    const provider = await this.providerRepo.findOneOrFail({ where: { id } });
    Object.assign(provider, data);
    return this.providerRepo.save(provider);
  }
}
