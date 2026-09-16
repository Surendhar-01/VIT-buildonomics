import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class SkillsService {
  constructor(private readonly db: DatabaseService) {}

  async getAllSkills(category?: string) {
    if (this.db.isUsingSupabase && this.db.client) {
      let query = this.db.client.from('skills').select('*');
      if (category) {
        query = query.eq('category', category);
      }
      const { data } = await query;
      return data || [];
    }

    const all = Array.from(this.db.inMemory.skills.values());
    if (category) {
      return all.filter((s) => s.category.toLowerCase() === category.toLowerCase());
    }
    return all;
  }

  async createSkill(data: { name: string; category: string; description?: string }) {
    const skill = {
      id: uuidv4(),
      name: data.name,
      category: data.category,
      description: data.description || '',
      created_at: new Date().toISOString(),
    };

    if (this.db.isUsingSupabase && this.db.client) {
      const { data: row } = await this.db.client
        .from('skills')
        .insert(skill)
        .select()
        .single();
      return row;
    }

    this.db.inMemory.skills.set(skill.id, skill);
    return skill;
  }
}
