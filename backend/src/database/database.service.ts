import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class DatabaseService implements OnModuleInit {
  private readonly logger = new Logger(DatabaseService.name);
  private supabaseClient: SupabaseClient | null = null;
  public isUsingSupabase = false;

  // In-memory fallback datastore for immediate testability
  public inMemory = {
    users: new Map<string, any>(),
    userRoles: new Map<string, any[]>(),
    profiles: new Map<string, any>(),
    skills: new Map<string, any>(),
    profileSkills: new Map<string, any[]>(),
    portfolios: new Map<string, any>(),
    portfolioSections: new Map<string, any[]>(),
    projects: new Map<string, any>(),
    codingProblems: new Map<string, any>(),
    codingTestCases: new Map<string, any[]>(),
    assessments: new Map<string, any>(),
    assessmentProblems: new Map<string, any[]>(),
    assessmentAttempts: new Map<string, any>(),
    codingSubmissions: new Map<string, any>(),
    aiFeedback: new Map<string, any>(),
    credentialTemplates: new Map<string, any>(),
    credentials: new Map<string, any>(),
    credentialRevocations: new Map<string, any>(),
    verificationLogs: new Array<any>(),
    shortlists: new Map<string, any>(),
    shortlistedCandidates: new Map<string, any[]>(),
    auditLogs: new Array<any>(),
  };

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseKey = this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY');

    if (
      supabaseUrl &&
      supabaseKey &&
      !supabaseUrl.includes('your-project') &&
      !supabaseKey.includes('your_supabase')
    ) {
      try {
        this.supabaseClient = createClient(supabaseUrl, supabaseKey, {
          auth: {
            persistSession: false,
            autoRefreshToken: false,
          },
        });
        this.isUsingSupabase = true;
        this.logger.log('Connected to Supabase PostgreSQL database.');
      } catch (err) {
        this.logger.warn(`Failed to connect to Supabase: ${err.message}. Falling back to internal engine.`);
      }
    } else {
      this.logger.log('Running with internal reactive datastore (Supabase credentials pending in .env).');
    }

    this.seedInitialData();
  }

  get client(): SupabaseClient | null {
    return this.supabaseClient;
  }

  private seedInitialData() {
    // Seed standard skills
    const seedSkills = [
      { id: 'sk-1', name: 'React.js', category: 'frontend', description: 'Component architecture, hooks, virtual DOM' },
      { id: 'sk-2', name: 'TypeScript', category: 'languages', description: 'Type systems, generics, interface design' },
      { id: 'sk-3', name: 'Node.js', category: 'backend', description: 'Event loop, streams, REST API architecture' },
      { id: 'sk-4', name: 'Python', category: 'languages', description: 'Algorithmic computing, automation, data structures' },
      { id: 'sk-5', name: 'PostgreSQL', category: 'database', description: 'Relational modeling, indexing, ACID transactions' },
      { id: 'sk-6', name: 'System Design', category: 'fundamentals', description: 'Microservices, caching, scalable infrastructure' },
      { id: 'sk-7', name: 'Docker', category: 'devops', description: 'Containerization, multi-stage builds, deployment' },
      { id: 'sk-8', name: 'AI & LLM Engineering', category: 'ai', description: 'Prompt engineering, RAG, tool calling' },
    ];
    for (const sk of seedSkills) {
      this.inMemory.skills.set(sk.id, sk);
    }

    // Seed default student demo profile
    const studentUser = {
      id: 'demo-student-uuid',
      email: 'student@skillproof.io',
      full_name: 'Alex Vance',
      role: 'student',
    };
    this.inMemory.users.set(studentUser.id, studentUser);
    this.inMemory.userRoles.set(studentUser.id, ['student']);
    this.inMemory.profiles.set('demo-student-uuid', {
      id: 'demo-student-uuid',
      user_id: 'demo-student-uuid',
      full_name: 'Alex Vance',
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      headline: 'Full-Stack Engineer & Distributed Systems Enthusiast',
      bio: 'Final year CS student passionate about building scalable, high-performance web systems and verifiable digital platforms.',
      location: 'San Francisco, CA',
      education: 'B.Tech in Computer Science',
      institution: 'Vellore Institute of Technology',
      graduation_year: 2026,
      experience: 'Software Engineering Intern @ CloudScale Tech (Summer 2025)',
      github_url: 'https://github.com/alexvance-dev',
      linkedin_url: 'https://linkedin.com/in/alexvance',
      resume_url: '',
      visibility: 'public',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    // Seed profile skills
    this.inMemory.profileSkills.set('demo-student-uuid', [
      { id: 'ps-1', profile_id: 'demo-student-uuid', skill_id: 'sk-1', proficiency_level: 'advanced', evidence_description: 'Built 3 production SPAs with state caching', verified: true },
      { id: 'ps-2', profile_id: 'demo-student-uuid', skill_id: 'sk-2', proficiency_level: 'expert', evidence_description: 'Implemented strict-mode monorepos', verified: true },
      { id: 'ps-3', profile_id: 'demo-student-uuid', skill_id: 'sk-3', proficiency_level: 'advanced', evidence_description: 'Designed microservice backend handling 500 RPS', verified: true },
    ]);

    // Seed coding problems
    const p1 = {
      id: 'prob-two-sum',
      title: 'Two Sum Target Problem',
      slug: 'two-sum-problem',
      description: 'Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to target.\nInput format: Line 1 contains a JSON array of integers, Line 2 contains the target integer.\nOutput format: `[i, j]` as a JSON array string.',
      difficulty: 'easy',
      category: 'algorithms',
      supported_languages: ['javascript', 'python'],
      constraints: '2 <= nums.length <= 10^4\n-10^9 <= nums[i] <= 10^9\nExactly one valid pair exists.',
      starter_code: {
        javascript: `function solve(input) {
  const lines = input.trim().split("\\n");
  const nums = JSON.parse(lines[0]);
  const target = parseInt(lines[1], 10);
  
  const map = new Map();
  for (let i = 0; i < nums.length; i++) {
    const diff = target - nums[i];
    if (map.has(diff)) {
      return JSON.stringify([map.get(diff), i]);
    }
    map.set(nums[i], i);
  }
  return "[]";
}

const fs = require("fs");
console.log(solve(fs.readFileSync(0, "utf-8")));`,
        python: `import sys, json

def solve(data):
    lines = data.strip().split("\\n")
    nums = json.loads(lines[0])
    target = int(lines[1])
    
    lookup = {}
    for i, num in enumerate(nums):
        diff = target - num
        if diff in lookup:
            return json.dumps([lookup[diff], i])
        lookup[num] = i
    return "[]"

if __name__ == "__main__":
    print(solve(sys.stdin.read()))`,
      },
      evaluation_type: 'standard_io',
      status: 'published',
      created_at: new Date().toISOString(),
    };

    const p2 = {
      id: 'prob-valid-parens',
      title: 'Valid Parentheses Structure',
      slug: 'valid-parentheses-string',
      description: 'Given a string `s` containing just the characters `(`, `)`, `{`, `}`, `[` and `]`, determine if the input string is valid.\nOutput format: `true` or `false`.',
      difficulty: 'easy',
      category: 'data-structures',
      supported_languages: ['javascript', 'python'],
      constraints: '1 <= s.length <= 10^4',
      starter_code: {
        javascript: `function solve(input) {
  const s = input.trim();
  const stack = [];
  const map = { ")": "(", "}": "{", "]": "[" };
  for (const char of s) {
    if (char === "(" || char === "{" || char === "[") {
      stack.push(char);
    } else if (stack.pop() !== map[char]) {
      return "false";
    }
  }
  return stack.length === 0 ? "true" : "false";
}

const fs = require("fs");
console.log(solve(fs.readFileSync(0, "utf-8")));`,
        python: `import sys

def solve(s):
    s = s.strip()
    stack = []
    lookup = {")": "(", "}": "{", "]": "["}
    for char in s:
        if char in lookup.values():
            stack.append(char)
        elif char in lookup:
            if not stack or stack.pop() != lookup[char]:
                return "false"
    return "true" if not stack else "false"

if __name__ == "__main__":
    print(solve(sys.stdin.read()))`,
      },
      evaluation_type: 'standard_io',
      status: 'published',
      created_at: new Date().toISOString(),
    };

    // 3. SQL Problem: Department Top Earners
    const pSql = {
      id: 'prob-sql-top-earners',
      title: 'Department Top Earners SQL Query',
      slug: 'department-top-earners-sql',
      description: 'Given employee records as JSON rows, find the highest paid employee in each department. Output format: JSON array sorted by department.',
      difficulty: 'medium',
      category: 'sql',
      supported_languages: ['javascript', 'python'],
      constraints: '1 <= employees.length <= 10^4',
      starter_code: {
        javascript: `function solve(input) {
  const employees = JSON.parse(input.trim());
  const map = {};
  for (const e of employees) {
    if (!map[e.department] || e.salary > map[e.department].max_salary) {
      map[e.department] = { department: e.department, max_salary: e.salary, top_earners: [e.name] };
    } else if (e.salary === map[e.department].max_salary) {
      map[e.department].top_earners.push(e.name);
    }
  }
  return JSON.stringify(Object.values(map).sort((a, b) => a.department.localeCompare(b.department)));
}
const fs = require("fs");
console.log(solve(fs.readFileSync(0, "utf-8")));`,
        python: `import sys, json
def solve(data):
    emps = json.loads(data.strip())
    m = {}
    for e in emps:
        d, s, n = e["department"], e["salary"], e["name"]
        if d not in m or s > m[d]["max_salary"]:
            m[d] = {"department": d, "max_salary": s, "top_earners": [n]}
        elif s == m[d]["max_salary"]:
            m[d]["top_earners"].append(n)
    return json.dumps(sorted(m.values(), key=lambda x: x["department"]))
if __name__ == "__main__":
    print(solve(sys.stdin.read()))`,
      },
      evaluation_type: 'standard_io',
      status: 'published',
      created_at: new Date().toISOString(),
    };

    // 4. Frontend Problem: Function Debounce
    const pFe = {
      id: 'prob-fe-debounce',
      title: 'Function Debounce & Rate Limiter',
      slug: 'function-debounce-implementation',
      description: 'Simulate an event debouncer. Given array of timestamps and delay, output array of execution timestamps.',
      difficulty: 'medium',
      category: 'frontend',
      supported_languages: ['javascript', 'python'],
      constraints: 'Timestamps are sorted non-decreasingly.',
      starter_code: {
        javascript: `function solve(input) {
  const [callsRaw, delayRaw] = input.trim().split("\\n");
  const calls = JSON.parse(callsRaw);
  const delay = parseInt(delayRaw, 10);
  if (!calls.length) return "[]";
  const execs = [];
  let timer = calls[0] + delay;
  for (let i = 1; i < calls.length; i++) {
    if (calls[i] >= timer) {
      execs.push(timer);
    }
    timer = calls[i] + delay;
  }
  execs.push(timer);
  return JSON.stringify(execs);
}
const fs = require("fs");
console.log(solve(fs.readFileSync(0, "utf-8")));`,
        python: `import sys, json
def solve(data):
    lines = data.strip().split("\\n")
    calls = json.loads(lines[0])
    delay = int(lines[1])
    if not calls: return "[]"
    execs = []
    timer = calls[0] + delay
    for c in calls[1:]:
        if c >= timer:
            execs.append(timer)
        timer = c + delay
    execs.append(timer)
    return json.dumps(execs)
if __name__ == "__main__":
    print(solve(sys.stdin.read()))`,
      },
      evaluation_type: 'standard_io',
      status: 'published',
      created_at: new Date().toISOString(),
    };

    // 5. Backend Problem: LRU Cache
    const pBe = {
      id: 'prob-be-lru-cache',
      title: 'LRU Cache Eviction Policy Engine',
      slug: 'lru-cache-eviction-engine',
      description: 'Implement an in-memory O(1) Least Recently Used (LRU) Cache supporting get and put with capacity evictions.',
      difficulty: 'medium',
      category: 'backend',
      supported_languages: ['javascript', 'python'],
      constraints: 'Capacity >= 1, Operations count <= 10^5',
      starter_code: {
        javascript: `function solve(input) {
  const [capRaw, opsRaw] = input.trim().split("\\n");
  const capacity = parseInt(capRaw, 10);
  const ops = JSON.parse(opsRaw);
  const cache = new Map();
  const res = [];
  for (const [type, k, v] of ops) {
    if (type === "get") {
      if (!cache.has(k)) res.push(-1);
      else {
        const val = cache.get(k);
        cache.delete(k);
        cache.set(k, val);
        res.push(val);
      }
    } else {
      if (cache.has(k)) cache.delete(k);
      else if (cache.size >= capacity) cache.delete(cache.keys().next().value);
      cache.set(k, v);
    }
  }
  return JSON.stringify(res);
}
const fs = require("fs");
console.log(solve(fs.readFileSync(0, "utf-8")));`,
        python: `import sys, json
from collections import OrderedDict
def solve(data):
    lines = data.strip().split("\\n")
    cap = int(lines[0])
    ops = json.loads(lines[1])
    cache = OrderedDict()
    res = []
    for op in ops:
        t, k = op[0], op[1]
        if t == "get":
            if k not in cache: res.append(-1)
            else:
                cache.move_to_end(k)
                res.append(cache[k])
        else:
            v = op[2]
            if k in cache: cache.move_to_end(k)
            cache[k] = v
            if len(cache) > cap: cache.popitem(last=False)
    return json.dumps(res)
if __name__ == "__main__":
    print(solve(sys.stdin.read()))`,
      },
      evaluation_type: 'standard_io',
      status: 'published',
      created_at: new Date().toISOString(),
    };

    this.inMemory.codingProblems.set(p1.id, p1);
    this.inMemory.codingProblems.set(p2.id, p2);
    this.inMemory.codingProblems.set(pSql.id, pSql);
    this.inMemory.codingProblems.set(pFe.id, pFe);
    this.inMemory.codingProblems.set(pBe.id, pBe);

    // Seed test cases
    this.inMemory.codingTestCases.set(p1.id, [
      { id: 'tc-1', problem_id: p1.id, input_data: '[2,7,11,15]\n9', expected_output: '[0, 1]', is_hidden: false, weight: 1 },
      { id: 'tc-2', problem_id: p1.id, input_data: '[3,2,4]\n6', expected_output: '[1, 2]', is_hidden: false, weight: 1 },
      { id: 'tc-3', problem_id: p1.id, input_data: '[3,3]\n6', expected_output: '[0, 1]', is_hidden: true, weight: 2 },
    ]);

    this.inMemory.codingTestCases.set(p2.id, [
      { id: 'tc-5', problem_id: p2.id, input_data: '()[]{}', expected_output: 'true', is_hidden: false, weight: 1 },
      { id: 'tc-6', problem_id: p2.id, input_data: '(]', expected_output: 'false', is_hidden: false, weight: 1 },
      { id: 'tc-7', problem_id: p2.id, input_data: '([{}])', expected_output: 'true', is_hidden: true, weight: 2 },
    ]);

    this.inMemory.codingTestCases.set(pSql.id, [
      { id: 'tc-sql-1', problem_id: pSql.id, input_data: '[{"id":1,"name":"Joe","salary":85000,"department":"IT"},{"id":2,"name":"Henry","salary":80000,"department":"Finance"},{"id":3,"name":"Sam","salary":60000,"department":"Finance"},{"id":4,"name":"Max","salary":90000,"department":"IT"}]', expected_output: '[{"department":"Finance","max_salary":80000,"top_earners":["Henry"]},{"department":"IT","max_salary":90000,"top_earners":["Max"]}]', is_hidden: false, weight: 1 },
      { id: 'tc-sql-2', problem_id: pSql.id, input_data: '[{"id":1,"name":"Alice","salary":120000,"department":"Engineering"},{"id":2,"name":"Bob","salary":120000,"department":"Engineering"}]', expected_output: '[{"department":"Engineering","max_salary":120000,"top_earners":["Alice","Bob"]}]', is_hidden: true, weight: 2 },
    ]);

    this.inMemory.codingTestCases.set(pFe.id, [
      { id: 'tc-fe-1', problem_id: pFe.id, input_data: '[0,50,100,300,320,600]\n200', expected_output: '[300,520,800]', is_hidden: false, weight: 1 },
      { id: 'tc-fe-2', problem_id: pFe.id, input_data: '[10,20,30]\n50', expected_output: '[80]', is_hidden: true, weight: 2 },
    ]);

    this.inMemory.codingTestCases.set(pBe.id, [
      { id: 'tc-be-1', problem_id: pBe.id, input_data: '2\n[["put",1,1],["put",2,2],["get",1],["put",3,3],["get",2],["put",4,4],["get",1],["get",3],["get",4]]', expected_output: '[1,-1,-1,3,4]', is_hidden: false, weight: 1 },
    ]);

    // Seed assessments
    const assess1 = {
      id: 'assess-fullstack-core',
      title: 'Full-Stack Algorithmic Benchmark',
      description: 'Timed technical assessment covering two-pointer lookups, stack operations, and time complexity bounds.',
      duration_seconds: 3600,
      difficulty: 'intermediate',
      category: 'Full Stack Engineering',
      status: 'active',
      created_at: new Date().toISOString(),
    };

    const assessSql = {
      id: 'assess-sql-data',
      title: 'Relational Databases & SQL Benchmark',
      description: 'Practical evaluation on aggregations, windowing lookups, relational data integrity, and analytical SQL performance.',
      duration_seconds: 2700,
      difficulty: 'intermediate',
      category: 'SQL & Databases',
      status: 'active',
      created_at: new Date().toISOString(),
    };

    const assessFe = {
      id: 'assess-frontend-web',
      title: 'Modern Frontend & Reactive State Benchmark',
      description: 'Hands-on assessment on event loop debouncing, reactive state stores, and rendering performance.',
      duration_seconds: 2700,
      difficulty: 'intermediate',
      category: 'Frontend Engineering',
      status: 'active',
      created_at: new Date().toISOString(),
    };

    const assessBe = {
      id: 'assess-backend-arch',
      title: 'Backend Systems & Distributed Caching Benchmark',
      description: 'In-depth assessment covering LRU memory eviction algorithms, request rate limiting, and RESTful concurrency.',
      duration_seconds: 3600,
      difficulty: 'advanced',
      category: 'Backend Engineering',
      status: 'active',
      created_at: new Date().toISOString(),
    };

    this.inMemory.assessments.set(assess1.id, assess1);
    this.inMemory.assessments.set(assessSql.id, assessSql);
    this.inMemory.assessments.set(assessFe.id, assessFe);
    this.inMemory.assessments.set(assessBe.id, assessBe);

    this.inMemory.assessmentProblems.set(assess1.id, [
      { assessment_id: assess1.id, problem_id: p1.id, display_order: 1, points: 50 },
      { assessment_id: assess1.id, problem_id: p2.id, display_order: 2, points: 50 },
    ]);

    this.inMemory.assessmentProblems.set(assessSql.id, [
      { assessment_id: assessSql.id, problem_id: pSql.id, display_order: 1, points: 100 },
    ]);

    this.inMemory.assessmentProblems.set(assessFe.id, [
      { assessment_id: assessFe.id, problem_id: pFe.id, display_order: 1, points: 100 },
    ]);

    this.inMemory.assessmentProblems.set(assessBe.id, [
      { assessment_id: assessBe.id, problem_id: pBe.id, display_order: 1, points: 100 },
    ]);

    // Seed demo portfolio
    this.inMemory.portfolios.set('port-alex', {
      id: 'port-alex',
      profile_id: 'demo-student-uuid',
      title: 'Alex Vance — Software Engineer Portfolio',
      slug: 'alex-vance',
      template: 'modern-minimal',
      theme: 'dark-indigo',
      is_published: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    // Seed sample project
    this.inMemory.projects.set('proj-1', {
      id: 'proj-1',
      profile_id: 'demo-student-uuid',
      title: 'HyperLog: Distributed Observability Engine',
      description: 'High-throughput stream processing pipeline built with Node.js, Redis, and WebSockets capable of ingesting 25,000 log events per second with sub-10ms UI telemetry.',
      repository_url: 'https://github.com/alexvance-dev/hyperlog',
      live_url: 'https://hyperlog.demo.skillproof.io',
      technologies: ['TypeScript', 'Node.js', 'Redis', 'React', 'Docker'],
      category: 'Distributed Systems',
      status: 'completed',
      visibility: 'public',
      is_featured: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    // Seed credential templates
    this.inMemory.credentialTemplates.set('tmpl-algo-master', {
      id: 'tmpl-algo-master',
      issuer_id: 'institution-vit',
      title: 'Certified Algorithmic Problem Solver',
      description: 'Awarded for passing rigorous automated code execution benchmarks with >= 90% test case pass rate.',
      criteria: 'Pass Full-Stack Algorithmic Benchmark with optimal runtime efficiency.',
      credential_type: 'assessment_achievement',
      status: 'active',
      created_at: new Date().toISOString(),
    });
  }

  logAudit(actorId: string | null, action: string, entityType: string, entityId?: string, metadata?: any) {
    const entry = {
      id: 'audit-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      actor_id: actorId,
      action,
      entity_type: entityType,
      entity_id: entityId,
      metadata: metadata || {},
      created_at: new Date().toISOString(),
    };
    this.inMemory.auditLogs.unshift(entry);
    this.logger.log(`AUDIT: [${action}] on ${entityType} ${entityId || ''}`);
    return entry;
  }
}
