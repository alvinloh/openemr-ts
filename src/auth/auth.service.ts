import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity.js';
import { Role } from '../common/constants/roles.constants.js';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(username: string, password: string): Promise<User | null> {
    const user = await this.userRepo.findOne({ where: { username } });
    if (!user || !user.active) return null;
    const valid = await bcrypt.compare(password, user.passwordHash);
    return valid ? user : null;
  }

  async login(user: User) {
    const payload = {
      sub: user.uuid,
      username: user.username,
      role: user.role,
    };
    return {
      accessToken: this.jwtService.sign(payload),
      refreshToken: this.jwtService.sign(payload, { expiresIn: '7d' }),
      user: {
        uuid: user.uuid,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    };
  }

  async refresh(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken);
      const user = await this.userRepo.findOne({
        where: { uuid: payload.sub },
      });
      if (!user || !user.active) throw new UnauthorizedException();
      return this.login(user);
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async findByUuid(uuid: string): Promise<User | null> {
    return this.userRepo.findOne({ where: { uuid } });
  }

  async createUser(data: {
    username: string;
    password: string;
    firstName: string;
    lastName: string;
    role?: Role;
    email?: string;
    npi?: string;
    specialty?: string;
  }): Promise<User> {
    const existing = await this.userRepo.findOne({
      where: { username: data.username },
    });
    if (existing) throw new ConflictException('Username already exists');

    const user = this.userRepo.create({
      username: data.username,
      passwordHash: await bcrypt.hash(data.password, 10),
      firstName: data.firstName,
      lastName: data.lastName,
      role: data.role || Role.STAFF,
      email: data.email || null,
      npi: data.npi || null,
      specialty: data.specialty || null,
    });
    return this.userRepo.save(user);
  }
}
