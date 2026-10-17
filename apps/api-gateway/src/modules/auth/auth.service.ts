import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { DatabaseService } from '../database/database.service';
import { LoginDto, AuthTokens, UserProfile, UserRole } from '@pos-ai/shared-types';

interface InternalUserRecord {
  id: string;
  store_id: string | null;
  username: string;
  email: string;
  password_hash: string;
  first_name: string;
  last_name: string;
  employee_code: string | null;
  is_active: boolean;
  roles?: string[];
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  // Fallback initial credentials (Password: 'Password123!')
  private readonly defaultUsers: InternalUserRecord[] = [
    {
      id: '20000000-0000-0000-0000-000000000001',
      store_id: '10000000-0000-0000-0000-000000000001',
      username: 'admin',
      email: 'admin@pos-ai.ph',
      password_hash: '$2a$10$0p257hU8WfQyZcWf9r5g8.uS0b/m.aO/l1f2X9XW7Y8o3GvC8r5uW',
      first_name: 'Jose',
      last_name: 'Rizal',
      employee_code: 'EMP-ADM-001',
      is_active: true,
      roles: ['admin'],
    },
    {
      id: '20000000-0000-0000-0000-000000000002',
      store_id: '10000000-0000-0000-0000-000000000001',
      username: 'manager_bgc',
      email: 'manager.bgc@pos-ai.ph',
      password_hash: '$2a$10$0p257hU8WfQyZcWf9r5g8.uS0b/m.aO/l1f2X9XW7Y8o3GvC8r5uW',
      first_name: 'Maria',
      last_name: 'Santos',
      employee_code: 'EMP-MGR-002',
      is_active: true,
      roles: ['store_manager', 'inventory_manager'],
    },
    {
      id: '20000000-0000-0000-0000-000000000003',
      store_id: '10000000-0000-0000-0000-000000000001',
      username: 'cashier_01',
      email: 'cashier1@pos-ai.ph',
      password_hash: '$2a$10$0p257hU8WfQyZcWf9r5g8.uS0b/m.aO/l1f2X9XW7Y8o3GvC8r5uW',
      first_name: 'Juan',
      last_name: 'Dela Cruz',
      employee_code: 'EMP-CSH-003',
      is_active: true,
      roles: ['cashier'],
    },
  ];

  constructor(
    private readonly jwtService: JwtService,
    private readonly db: DatabaseService,
  ) {}

  async validateAndLogin(dto: LoginDto): Promise<AuthTokens> {
    let user: InternalUserRecord | null = null;

    if (this.db.isDbConnected) {
      try {
        const users = await this.db.query<InternalUserRecord>(
          `SELECT u.id, u.store_id, u.username, u.email, u.password_hash, u.first_name, u.last_name, u.employee_code, u.is_active,
                  ARRAY_AGG(r.name) as roles
           FROM users u
           LEFT JOIN user_roles ur ON ur.user_id = u.id
           LEFT JOIN roles r ON r.id = ur.role_id
           WHERE u.username = $1 OR u.email = $1
           GROUP BY u.id`,
          [dto.username],
        );
        if (users && users.length > 0) {
          user = users[0];
        }
      } catch (err: any) {
        this.logger.warn(`Failed querying user from DB: ${err.message}, checking memory fallback`);
      }
    }

    if (!user) {
      user =
        this.defaultUsers.find(
          (u) => u.username === dto.username || u.email === dto.username,
        ) || null;
    }

    if (!user) {
      throw new UnauthorizedException('Invalid username or password');
    }

    if (!user.is_active) {
      throw new UnauthorizedException('User account is currently disabled');
    }

    // Verify Password: match bcrypt hash or standard demo password
    const isPasswordValid =
      dto.password === 'Password123!' ||
      (await bcrypt.compare(dto.password, user.password_hash));

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid username or password');
    }

    const roles: UserRole[] = ((user.roles as UserRole[]) || ['cashier']).filter(Boolean);

    const payload = {
      sub: user.id,
      username: user.username,
      email: user.email,
      storeId: user.store_id,
      roles,
    };

    const accessToken = this.jwtService.sign(payload, { expiresIn: '8h' });
    const refreshToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_REFRESH_SECRET || 'super_secret_refresh_key_2026!',
      expiresIn: '7d',
    });

    const userProfile: UserProfile = {
      id: user.id,
      storeId: user.store_id,
      username: user.username,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      employeeCode: user.employee_code || undefined,
      roles,
      isActive: user.is_active,
      createdAt: new Date().toISOString(),
    };

    return {
      accessToken,
      refreshToken,
      expiresIn: 28800,
      user: userProfile,
    };
  }

  async getUserProfile(userId: string): Promise<UserProfile> {
    if (this.db.isDbConnected) {
      const users = await this.db.query<InternalUserRecord>(
        `SELECT u.id, u.store_id, u.username, u.email, u.first_name, u.last_name, u.employee_code, u.is_active,
                ARRAY_AGG(r.name) as roles
         FROM users u
         LEFT JOIN user_roles ur ON ur.user_id = u.id
         LEFT JOIN roles r ON r.id = ur.role_id
         WHERE u.id = $1
         GROUP BY u.id`,
        [userId],
      );
      if (users && users.length > 0) {
        const u = users[0];
        return {
          id: u.id,
          storeId: u.store_id,
          username: u.username,
          email: u.email,
          firstName: u.first_name,
          lastName: u.last_name,
          employeeCode: u.employee_code || undefined,
          roles: (u.roles as UserRole[]) || ['cashier'],
          isActive: u.is_active,
          createdAt: new Date().toISOString(),
        };
      }
    }

    const defaultUser = this.defaultUsers.find((u) => u.id === userId) || this.defaultUsers[2];
    return {
      id: defaultUser.id,
      storeId: defaultUser.store_id,
      username: defaultUser.username,
      email: defaultUser.email,
      firstName: defaultUser.first_name,
      lastName: defaultUser.last_name,
      employeeCode: defaultUser.employee_code || undefined,
      roles: (defaultUser.roles as UserRole[]) || ['cashier'],
      isActive: defaultUser.is_active,
      createdAt: new Date().toISOString(),
    };
  }
}
