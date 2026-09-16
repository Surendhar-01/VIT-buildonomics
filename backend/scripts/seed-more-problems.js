const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://uccsdkqmgdtilemzrmbl.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVjY3Nka3FtZ2R0aWxlbXpybWJsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTU0NTk0OSwiZXhwIjoyMTA1MTIxOTQ5fQ.THPyrOuB6cmIDMSTwZObEaBXzDyq-eUWQqdmo64TxOI';

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function seed() {
  console.log('Seeding SQL, Frontend, and Backend problems into Supabase...');

  // 1. SQL Problems
  const sqlProblem1 = {
    id: 'e5555555-5555-5555-5555-555555555555',
    title: 'Department Top Earners SQL Query',
    slug: 'department-top-earners-sql',
    description: `Given a list of employee records in JSON format representing a relational table:
\`[{"id":1,"name":"Joe","salary":85000,"department":"IT"},{"id":2,"name":"Henry","salary":80000,"department":"Finance"},{"id":3,"name":"Sam","salary":60000,"department":"Finance"},{"id":4,"name":"Max","salary":90000,"department":"IT"}]\`

Write a query solver that returns the highest-earning employee in each department.
If there is a tie, return both.
Output format: JSON array of objects sorted by department ascending:
\`[{"department":"Finance","max_salary":80000,"top_earners":["Henry"]},{"department":"IT","max_salary":90000,"top_earners":["Max"]}]\``,
    difficulty: 'medium',
    category: 'sql',
    supported_languages: ['javascript', 'python'],
    constraints: '1 <= employees.length <= 10^4\nSalaries are positive integers.',
    starter_code: {
      javascript: `function solve(input) {
  const employees = JSON.parse(input.trim());
  const deptMap = {};

  for (const emp of employees) {
    if (!deptMap[emp.department] || emp.salary > deptMap[emp.department].max_salary) {
      deptMap[emp.department] = { department: emp.department, max_salary: emp.salary, top_earners: [emp.name] };
    } else if (emp.salary === deptMap[emp.department].max_salary) {
      deptMap[emp.department].top_earners.push(emp.name);
    }
  }

  const result = Object.values(deptMap).sort((a, b) => a.department.localeCompare(b.department));
  return JSON.stringify(result);
}

const fs = require("fs");
console.log(solve(fs.readFileSync(0, "utf-8")));`,
      python: `import sys, json

def solve(data):
    employees = json.loads(data.strip())
    dept_map = {}
    
    for emp in employees:
        d = emp["department"]
        s = emp["salary"]
        name = emp["name"]
        if d not in dept_map or s > dept_map[d]["max_salary"]:
            dept_map[d] = {"department": d, "max_salary": s, "top_earners": [name]}
        elif s == dept_map[d]["max_salary"]:
            dept_map[d]["top_earners"].append(name)
            
    result = sorted(dept_map.values(), key=lambda x: x["department"])
    return json.dumps(result)

if __name__ == "__main__":
    print(solve(sys.stdin.read()))`,
    },
    evaluation_type: 'standard_io',
    status: 'published',
  };

  // 2. Frontend Problems
  const feProblem1 = {
    id: 'f6666666-6666-6666-6666-666666666666',
    title: 'Function Debounce & Rate Limiter',
    slug: 'function-debounce-implementation',
    description: `Implement an event debouncing utility simulator.
Input: JSON string containing array of call timestamps: \`[0, 50, 100, 300, 320, 600]\` and delay \`200\` ms on Line 2.
Output: JSON array of timestamps at which the debounced function actually executes.
Example: For timestamps \`[0, 50, 100, 300, 320, 600]\` with delay \`200\`:
Calls at 0, 50, 100 trigger execution at 100 + 200 = 300.
Calls at 300, 320 trigger execution at 320 + 200 = 520.
Call at 600 triggers execution at 600 + 200 = 800.
Output: \`[300, 520, 800]\``,
    difficulty: 'medium',
    category: 'frontend',
    supported_languages: ['javascript', 'python'],
    constraints: 'Timestamps are sorted non-decreasingly.\n1 <= delay <= 5000',
    starter_code: {
      javascript: `function solve(input) {
  const lines = input.trim().split("\\n");
  const calls = JSON.parse(lines[0]);
  const delay = parseInt(lines[1], 10);

  const executions = [];
  if (calls.length === 0) return "[]";

  let lastTimer = calls[0] + delay;

  for (let i = 1; i < calls.length; i++) {
    if (calls[i] < lastTimer) {
      lastTimer = calls[i] + delay;
    } else {
      executions.push(lastTimer);
      lastTimer = calls[i] + delay;
    }
  }
  executions.push(lastTimer);

  return JSON.stringify(executions);
}

const fs = require("fs");
console.log(solve(fs.readFileSync(0, "utf-8")));`,
      python: `import sys, json

def solve(data):
    lines = data.strip().split("\\n")
    calls = json.loads(lines[0])
    delay = int(lines[1])
    
    if not calls:
        return "[]"
        
    executions = []
    last_timer = calls[0] + delay
    
    for c in calls[1:]:
        if c < last_timer:
            last_timer = c + delay
        else:
            executions.append(last_timer)
            last_timer = c + delay
    executions.append(last_timer)
    
    return json.dumps(executions)

if __name__ == "__main__":
    print(solve(sys.stdin.read()))`,
    },
    evaluation_type: 'standard_io',
    status: 'published',
  };

  // 3. Backend Problems
  const beProblem1 = {
    id: 'b7777777-7777-7777-7777-777777777777',
    title: 'LRU Cache Eviction Policy Engine',
    slug: 'lru-cache-eviction-engine',
    description: `Design an in-memory Key-Value Least Recently Used (LRU) Cache simulator.
Input:
Line 1: Cache capacity (integer)
Line 2: Operations JSON array: \`[["put",1,1],["put",2,2],["get",1],["put",3,3],["get",2],["put",4,4],["get",1],["get",3],["get",4]]\`
Output:
JSON array of returned values for each "get" operation (-1 if key not present).
Output for above example: \`[1, -1, -1, 3, 4]\``,
    difficulty: 'medium',
    category: 'backend',
    supported_languages: ['javascript', 'python'],
    constraints: 'Capacity >= 1\nOperations count <= 10^5\nAll operations must execute with O(1) amortized lookup.',
    starter_code: {
      javascript: `function solve(input) {
  const lines = input.trim().split("\\n");
  const capacity = parseInt(lines[0], 10);
  const ops = JSON.parse(lines[1]);

  const cache = new Map();
  const results = [];

  for (const op of ops) {
    const type = op[0];
    const key = op[1];
    if (type === "get") {
      if (!cache.has(key)) {
        results.push(-1);
      } else {
        const val = cache.get(key);
        cache.delete(key);
        cache.set(key, val);
        results.push(val);
      }
    } else if (type === "put") {
      const val = op[2];
      if (cache.has(key)) {
        cache.delete(key);
      } else if (cache.size >= capacity) {
        const oldestKey = cache.keys().next().value;
        cache.delete(oldestKey);
      }
      cache.set(key, val);
    }
  }

  return JSON.stringify(results);
}

const fs = require("fs");
console.log(solve(fs.readFileSync(0, "utf-8")));`,
      python: `import sys, json
from collections import OrderedDict

def solve(data):
    lines = data.strip().split("\\n")
    capacity = int(lines[0])
    ops = json.loads(lines[1])
    
    cache = OrderedDict()
    results = []
    
    for op in ops:
        t = op[0]
        k = op[1]
        if t == "get":
            if k not in cache:
                results.append(-1)
            else:
                cache.move_to_end(k)
                results.append(cache[k])
        elif t == "put":
            v = op[2]
            if k in cache:
                cache.move_to_end(k)
            cache[k] = v
            if len(cache) > capacity:
                cache.popitem(last=False)
                
    return json.dumps(results)

if __name__ == "__main__":
    print(solve(sys.stdin.read()))`,
    },
    evaluation_type: 'standard_io',
    status: 'published',
  };

  // Upsert Problems
  const problems = [sqlProblem1, feProblem1, beProblem1];
  for (const prob of problems) {
    const { error } = await supabase.from('coding_problems').upsert(prob);
    if (error) console.error('Error inserting problem:', prob.title, error.message);
    else console.log('✓ Seeded Problem:', prob.title);
  }

  // 4. Test Cases
  const testCases = [
    // SQL
    { id: 'tc-sql-1', problem_id: sqlProblem1.id, input_data: '[{"id":1,"name":"Joe","salary":85000,"department":"IT"},{"id":2,"name":"Henry","salary":80000,"department":"Finance"},{"id":3,"name":"Sam","salary":60000,"department":"Finance"},{"id":4,"name":"Max","salary":90000,"department":"IT"}]', expected_output: '[{"department":"Finance","max_salary":80000,"top_earners":["Henry"]},{"department":"IT","max_salary":90000,"top_earners":["Max"]}]', is_hidden: false, weight: 1 },
    { id: 'tc-sql-2', problem_id: sqlProblem1.id, input_data: '[{"id":1,"name":"Alice","salary":120000,"department":"Engineering"},{"id":2,"name":"Bob","salary":120000,"department":"Engineering"}]', expected_output: '[{"department":"Engineering","max_salary":120000,"top_earners":["Alice","Bob"]}]', is_hidden: true, weight: 2 },
    // Frontend
    { id: 'tc-fe-1', problem_id: feProblem1.id, input_data: '[0,50,100,300,320,600]\n200', expected_output: '[300,520,800]', is_hidden: false, weight: 1 },
    { id: 'tc-fe-2', problem_id: feProblem1.id, input_data: '[10,20,30]\n50', expected_output: '[80]', is_hidden: true, weight: 2 },
    // Backend
    { id: 'tc-be-1', problem_id: beProblem1.id, input_data: '2\n[["put",1,1],["put",2,2],["get",1],["put",3,3],["get",2],["put",4,4],["get",1],["get",3],["get",4]]', expected_output: '[1,-1,-1,3,4]', is_hidden: false, weight: 1 },
    { id: 'tc-be-2', problem_id: beProblem1.id, input_data: '1\n[["put",10,100],["get",10],["put",20,200],["get",10],["get",20]]', expected_output: '[100,-1,200]', is_hidden: true, weight: 2 },
  ];

  for (const tc of testCases) {
    const { error } = await supabase.from('coding_test_cases').upsert(tc);
    if (error) console.error('Error inserting test case:', tc.id, error.message);
    else console.log('✓ SeededTestCase:', tc.id);
  }

  // 5. New Assessments
  const assessSQL = {
    id: 'a8888888-8888-8888-8888-888888888888',
    title: 'Relational Databases & SQL Benchmark',
    description: 'Practical evaluation on aggregations, windowing lookups, data normalization, and query performance.',
    duration_seconds: 2700,
    difficulty: 'intermediate',
    category: 'SQL & Databases',
    status: 'active',
  };

  const assessFrontend = {
    id: 'a9999999-9999-9999-9999-999999999999',
    title: 'Modern Frontend & Reactive State Benchmark',
    description: 'Hands-on assessment on event loop debouncing, reactive state stores, and rendering performance.',
    duration_seconds: 2700,
    difficulty: 'intermediate',
    category: 'Frontend Engineering',
    status: 'active',
  };

  const assessBackend = {
    id: 'baaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    title: 'Backend Systems & Distributed Caching Benchmark',
    description: 'In-depth assessment covering LRU memory eviction algorithms, request rate limiting, and RESTful concurrency.',
    duration_seconds: 3600,
    difficulty: 'advanced',
    category: 'Backend Engineering',
    status: 'active',
  };

  const assessments = [assessSQL, assessFrontend, assessBackend];
  for (const ass of assessments) {
    const { error } = await supabase.from('assessments').upsert(ass);
    if (error) console.error('Error inserting assessment:', ass.title, error.message);
    else console.log('✓ Seeded Assessment:', ass.title);
  }

  // Link assessment problems
  const links = [
    { assessment_id: assessSQL.id, problem_id: sqlProblem1.id, display_order: 1, points: 100 },
    { assessment_id: assessFrontend.id, problem_id: feProblem1.id, display_order: 1, points: 100 },
    { assessment_id: assessBackend.id, problem_id: beProblem1.id, display_order: 1, points: 100 },
  ];

  for (const link of links) {
    const { error } = await supabase.from('assessment_problems').upsert(link, { onConflict: 'assessment_id,problem_id' });
    if (error) console.error('Error linking problem:', error.message);
  }

  console.log('✓ All categories seeded successfully!');
}

seed();
