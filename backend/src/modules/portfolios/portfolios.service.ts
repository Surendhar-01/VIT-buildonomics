import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { CreatePortfolioDto, UpdatePortfolioDto } from './dto/portfolio.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class PortfoliosService {
  constructor(private readonly db: DatabaseService) {}

  async getMyPortfolios(userId: string) {
    if (this.db.isUsingSupabase && this.db.client) {
      const { data: prof } = await this.db.client
        .from('profiles')
        .select('id')
        .eq('user_id', userId)
        .single();
      if (!prof) return [];

      const { data } = await this.db.client
        .from('portfolios')
        .select('*, portfolio_sections(*)')
        .eq('profile_id', prof.id);
      return data || [];
    }

    const list: any[] = [];
    for (const port of this.db.inMemory.portfolios.values()) {
      if (port.profile_id === userId) {
        const sections = this.db.inMemory.portfolioSections.get(port.id) || [];
        list.push({ ...port, portfolio_sections: sections });
      }
    }
    return list;
  }

  async getPortfolioById(id: string) {
    let port: any = null;
    if (this.db.isUsingSupabase && this.db.client) {
      const { data } = await this.db.client
        .from('portfolios')
        .select('*, portfolio_sections(*)')
        .eq('id', id)
        .single();
      port = data;
    } else {
      port = this.db.inMemory.portfolios.get(id);
      if (port) {
        port.portfolio_sections = this.db.inMemory.portfolioSections.get(id) || [];
      }
    }

    if (!port) {
      throw new NotFoundException(`Portfolio not found`);
    }
    return port;
  }

  async getPublicPortfolioBySlug(slug: string) {
    let port: any = null;
    if (this.db.isUsingSupabase && this.db.client) {
      const { data } = await this.db.client
        .from('portfolios')
        .select('*, profiles(*), portfolio_sections(*)')
        .eq('slug', slug)
        .eq('is_published', true)
        .single();
      port = data;
    } else {
      for (const p of this.db.inMemory.portfolios.values()) {
        if (p.slug === slug && p.is_published) {
          port = { ...p };
          port.portfolio_sections = this.db.inMemory.portfolioSections.get(p.id) || [];
          port.profiles = this.db.inMemory.profiles.get(p.profile_id);
          break;
        }
      }
    }

    if (!port) {
      throw new NotFoundException(`Public portfolio with slug '${slug}' not found or unpublished.`);
    }

    // Attach candidate projects, verified skills and credentials
    const profileId = port.profile_id;
    let projects: any[] = [];
    let skills: any[] = [];
    let credentials: any[] = [];

    if (this.db.isUsingSupabase && this.db.client) {
      const { data: projData } = await this.db.client
        .from('projects')
        .select('*')
        .eq('profile_id', profileId)
        .eq('visibility', 'public');
      projects = projData || [];

      const { data: credData } = await this.db.client
        .from('credentials')
        .select('*')
        .eq('recipient_id', profileId)
        .eq('status', 'active');
      credentials = credData || [];
    } else {
      projects = Array.from(this.db.inMemory.projects.values()).filter(
        (p) => p.profile_id === profileId && p.visibility === 'public',
      );
      credentials = Array.from(this.db.inMemory.credentials.values()).filter(
        (c) => c.recipient_id === profileId && c.status === 'active',
      );
      const rawSkills = this.db.inMemory.profileSkills.get(profileId) || [];
      skills = rawSkills.map((rs) => ({
        skill_name: rs.skill_name || this.db.inMemory.skills.get(rs.skill_id)?.name,
        proficiency_level: rs.proficiency_level,
        evidence_description: rs.evidence_description,
      }));
    }

    return {
      ...port,
      projects,
      skills,
      credentials,
    };
  }

  async createPortfolio(userId: string, dto: CreatePortfolioDto) {
    const portId = uuidv4();
    const portfolio = {
      id: portId,
      profile_id: userId,
      title: dto.title,
      slug: dto.slug.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
      template: dto.template || 'modern-minimal',
      theme: dto.theme || 'dark-indigo',
      is_published: dto.isPublished ?? true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (this.db.isUsingSupabase && this.db.client) {
      const { data, error } = await this.db.client
        .from('portfolios')
        .insert(portfolio)
        .select()
        .single();
      if (error) throw new BadRequestException(error.message);
      return data;
    }

    this.db.inMemory.portfolios.set(portId, portfolio);
    return portfolio;
  }

  async updatePortfolio(userId: string, id: string, dto: UpdatePortfolioDto) {
    const existing = await this.getPortfolioById(id);
    const updated = {
      ...existing,
      ...dto,
      updated_at: new Date().toISOString(),
    };

    if (this.db.isUsingSupabase && this.db.client) {
      const { data, error } = await this.db.client
        .from('portfolios')
        .update(updated)
        .eq('id', id)
        .select()
        .single();
      if (error) throw new BadRequestException(error.message);
      return data;
    }

    this.db.inMemory.portfolios.set(id, updated);
    return updated;
  }

  async publishToggle(userId: string, id: string, isPublished: boolean) {
    return this.updatePortfolio(userId, id, { isPublished });
  }
}
