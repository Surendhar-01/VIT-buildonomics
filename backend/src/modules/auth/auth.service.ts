import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DatabaseService } from '../../database/database.service';
import { ForgotPasswordDto, LoginDto, RegisterDto } from './dto/auth.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AuthService {
  constructor(
    private readonly db: DatabaseService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const email = dto.email.toLowerCase().trim();

    // Supabase Auth if configured
    if (this.db.isUsingSupabase && this.db.client) {
      let userId = '';
      let session: any = null;
      let token = '';

      // Create pre-confirmed user using service role admin API
      const { data: adminUser, error: adminErr } = await this.db.client.auth.admin.createUser({
        email,
        password: dto.password,
        email_confirm: true,
        user_metadata: {
          full_name: dto.fullName,
          role: dto.role,
        },
      });

      if (!adminErr && adminUser?.user) {
        userId = adminUser.user.id;
      } else {
        // Fallback to standard signUp
        const { data: signData, error: signError } = await this.db.client.auth.signUp({
          email,
          password: dto.password,
          options: {
            data: {
              full_name: dto.fullName,
              role: dto.role,
            },
          },
        });

        if (signError) {
          throw new BadRequestException(signError.message);
        }
        userId = signData.user?.id || uuidv4();
      }

      // Immediately sign in to generate valid JWT session token
      const { data: loginData } = await this.db.client.auth.signInWithPassword({
        email,
        password: dto.password,
      });

      session = loginData?.session || null;
      token = session?.access_token || `dev-${dto.role}-${userId}`;

      // Insert role
      await this.db.client.from('user_roles').insert({
        user_id: userId,
        role: dto.role,
        status: dto.role === 'issuer' ? 'pending' : 'active',
      });

      // Insert clean initial profile (empty bio/headline for students)
      await this.db.client.from('profiles').insert({
        user_id: userId,
        full_name: dto.fullName,
        headline: '',
        bio: '',
        institution: dto.institutionName || '',
      });

      this.db.logAudit(userId, 'REGISTER_USER', 'user', userId, { role: dto.role });

      return {
        user: {
          id: userId,
          email,
          fullName: dto.fullName,
          role: dto.role,
          status: dto.role === 'issuer' ? 'pending' : 'active',
        },
        session,
        token,
        message: dto.role === 'issuer' 
          ? 'Registration received. Issuer accounts require administrator approval before issuing credentials.' 
          : 'Registration successful.',
      };
    }

    // Dev / in-memory registration
    const existing = Array.from(this.db.inMemory.users.values()).find(
      (u) => u.email === email,
    );
    if (existing) {
      throw new BadRequestException('An account with this email already exists.');
    }

    const userId = uuidv4();
    const newUser = {
      id: userId,
      email,
      fullName: dto.fullName,
      role: dto.role,
      status: dto.role === 'issuer' ? 'pending' : 'active',
    };

    this.db.inMemory.users.set(userId, newUser);
    this.db.inMemory.userRoles.set(userId, [dto.role]);

    // Bootstrap profile
    const profile = {
      id: userId,
      user_id: userId,
      full_name: dto.fullName,
      headline: dto.role === 'student' ? 'Aspiring Software Engineer' : `${dto.role.toUpperCase()}`,
      bio: '',
      location: '',
      education: '',
      institution: dto.institutionName || '',
      graduation_year: new Date().getFullYear() + 1,
      experience: '',
      certifications: '',
      github_url: '',
      linkedin_url: '',
      resume_url: '',
      visibility: 'public',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.db.inMemory.profiles.set(userId, profile);

    const token = `dev-${dto.role}-${userId}`;
    this.db.logAudit(userId, 'REGISTER_USER', 'user', userId, { role: dto.role });

    return {
      user: newUser,
      token,
      message: dto.role === 'issuer'
        ? 'Registration received. Issuer accounts require admin review.'
        : 'Registration successful.',
    };
  }

  async login(dto: LoginDto) {
    const email = dto.email.toLowerCase().trim();

    // 1. Check Platform Administrator login configured via .env
    const adminEmail = (this.configService.get<string>('ADMIN_EMAIL') || 'admin@skillproof.io').toLowerCase().trim();
    const adminPassword = this.configService.get<string>('ADMIN_PASSWORD') || 'Admin@SkillProof2026!';

    if (dto.role === 'admin' || email === adminEmail) {
      if (dto.role && dto.role !== 'admin') {
        throw new UnauthorizedException('Administrator accounts must log in through the Admin Portal.');
      }
      if (dto.role === 'admin' && email !== adminEmail) {
        throw new UnauthorizedException('Access Denied: Only platform administrators can log in through the Admin Portal.');
      }
      if (email !== adminEmail || dto.password !== adminPassword) {
        throw new UnauthorizedException('Invalid administrator email or password.');
      }

      const adminUser = {
        id: 'admin-master-root',
        email: adminEmail,
        fullName: 'Platform Administrator',
        role: 'admin',
        status: 'active',
      };
      this.db.logAudit(adminUser.id, 'LOGIN_ADMIN', 'user', adminUser.id);
      return {
        user: adminUser,
        token: 'dev-admin-master-root-token',
        message: 'Administrator authentication successful.',
      };
    }

    // 2. Regular user authentication (Student, Recruiter, Issuer)
    if (this.db.isUsingSupabase && this.db.client) {
      const { data, error } = await this.db.client.auth.signInWithPassword({
        email,
        password: dto.password,
      });

      if (error) {
        throw new UnauthorizedException(error.message);
      }

      const { data: roleData } = await this.db.client
        .from('user_roles')
        .select('role, status')
        .eq('user_id', data.user.id)
        .single();

      const userRole = roleData?.role || data.user.user_metadata?.role || 'student';

      if (roleData?.status === 'suspended') {
        throw new UnauthorizedException('This account has been suspended by platform administration.');
      }

      // Enforce strict role matching
      if (dto.role && dto.role !== userRole) {
        throw new UnauthorizedException(
          `Access Denied: This account is registered as a ${userRole.toUpperCase()}. Please use the ${userRole.toUpperCase()} login portal.`
        );
      }

      this.db.logAudit(data.user.id, 'LOGIN_USER', 'user', data.user.id);

      return {
        user: {
          id: data.user.id,
          email: data.user.email,
          fullName: data.user.user_metadata?.full_name || 'User',
          role: userRole,
        },
        session: data.session,
        token: data.session?.access_token,
      };
    }

    // Dev / in-memory fallback check
    let user = Array.from(this.db.inMemory.users.values()).find(
      (u) => u.email === email,
    );

    if (!user) {
      throw new UnauthorizedException('Invalid email or password. Please register an account first.');
    }

    // Strict role validation
    if (dto.role && user.role !== dto.role) {
      throw new UnauthorizedException(
        `Access Denied: This account is registered as a ${user.role.toUpperCase()}. Please use the ${user.role.toUpperCase()} login portal.`
      );
    }

    const token = `dev-${user.role}-${user.id}`;
    this.db.logAudit(user.id, 'LOGIN_USER', 'user', user.id);

    return {
      user,
      token,
      message: 'Login successful',
    };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    if (this.db.isUsingSupabase && this.db.client) {
      await this.db.client.auth.resetPasswordForEmail(dto.email);
    }
    return {
      success: true,
      message: `If an account exists for ${dto.email}, a secure password reset link has been dispatched.`,
    };
  }

  async getSession(user: any) {
    return {
      authenticated: true,
      user,
    };
  }
}
