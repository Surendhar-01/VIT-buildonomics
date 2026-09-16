-- ==========================================================
-- AI SkillProof Platform — Seed Data Migration (004)
-- ==========================================================

-- 1. SEED SKILLS
INSERT INTO skills (name, category, description) VALUES
('React.js', 'frontend', 'Component-based UI library with hooks and state management'),
('Next.js', 'frontend', 'Full-stack React framework with SSR and App Router'),
('TypeScript', 'languages', 'Strongly typed superset of JavaScript'),
('JavaScript (ES6+)', 'languages', 'Modern ECMAScript standards, async/await, closures'),
('Python', 'languages', 'Versatile programming language for web, data, and algorithms'),
('Java', 'languages', 'Object-oriented enterprise programming language'),
('Node.js', 'backend', 'V8 JavaScript runtime for building scalable server-side systems'),
('NestJS', 'backend', 'Progressive Node.js framework with modular architecture'),
('PostgreSQL', 'database', 'Advanced relational database with JSONB and RLS capabilities'),
('MongoDB', 'database', 'NoSQL document database for semi-structured data'),
('Docker', 'devops', 'Containerization platform for reproducible application environments'),
('AWS Cloud', 'cloud', 'Cloud infrastructure covering S3, EC2, Lambda, and RDS'),
('RESTful APIs', 'backend', 'Design principles for clean, idempotent, and secure web APIs'),
('System Design', 'fundamentals', 'Distributed systems design, caching, load balancing, sharding'),
('Data Structures & Algorithms', 'fundamentals', 'Trees, graphs, dynamic programming, complexity analysis'),
('Machine Learning / AI', 'ai', 'Neural networks, LLM integration, prompt engineering')
ON CONFLICT (name) DO NOTHING;

-- 2. SEED CODING PROBLEMS
-- Problem 1: Two Sum
INSERT INTO coding_problems (
    id, title, slug, description, difficulty, category, supported_languages, constraints, starter_code
) VALUES (
    'a1111111-1111-1111-1111-111111111111',
    'Two Sum Problem',
    'two-sum-problem',
    'Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to target. You may assume that each input would have exactly one solution, and you may not use the same element twice. Format output as `[i, j]` with space after comma or simple JSON array.',
    'easy',
    'algorithms',
    ARRAY['javascript', 'python'],
    '2 <= nums.length <= 10^4\n-10^9 <= nums[i] <= 10^9\nOnly one valid answer exists.',
    '{"javascript": "function solve(input) {\n    const lines = input.trim().split(\"\\n\");\n    const nums = JSON.parse(lines[0]);\n    const target = parseInt(lines[1], 10);\n    \n    const map = new Map();\n    for (let i = 0; i < nums.length; i++) {\n        const complement = target - nums[i];\n        if (map.has(complement)) {\n            return JSON.stringify([map.get(complement), i]);\n        }\n        map.set(nums[i], i);\n    }\n    return \"[]\";\n}\n\nconst fs = require(\"fs\");\nconst input = fs.readFileSync(0, \"utf-8\");\nconsole.log(solve(input));", "python": "import sys, json\n\ndef solve(input_data):\n    lines = input_data.strip().split(\"\\n\")\n    nums = json.loads(lines[0])\n    target = int(lines[1])\n    \n    seen = {}\n    for i, num in enumerate(nums):\n        comp = target - num\n        if comp in seen:\n            return json.dumps([seen[comp], i])\n        seen[num] = i\n    return \"[]\"\n\nif __name__ == \"__main__\":\n    data = sys.stdin.read()\n    print(solve(data))"}'::jsonb
) ON CONFLICT (slug) DO NOTHING;

-- Test cases for Two Sum
INSERT INTO coding_test_cases (problem_id, input_data, expected_output, is_hidden, weight) VALUES
('a1111111-1111-1111-1111-111111111111', '[2,7,11,15]' || E'\n' || '9', '[0, 1]', false, 1),
('a1111111-1111-1111-1111-111111111111', '[3,2,4]' || E'\n' || '6', '[1, 2]', false, 1),
('a1111111-1111-1111-1111-111111111111', '[3,3]' || E'\n' || '6', '[0, 1]', true, 2),
('a1111111-1111-1111-1111-111111111111', '[1,5,8,12,19]' || E'\n' || '20', '[0, 4]', true, 2);

-- Problem 2: Valid Parentheses
INSERT INTO coding_problems (
    id, title, slug, description, difficulty, category, supported_languages, constraints, starter_code
) VALUES (
    'b2222222-2222-2222-2222-222222222222',
    'Valid Parentheses String',
    'valid-parentheses-string',
    'Given a string `s` containing just the characters ''('', '')'', ''{'', ''}'', ''['' and '']'', determine if the input string is valid. Output `true` or `false`.',
    'easy',
    'data-structures',
    ARRAY['javascript', 'python'],
    '1 <= s.length <= 10^4\ns consists of parentheses only ''()[]{}''.',
    '{"javascript": "function solve(input) {\n    const s = input.trim();\n    const stack = [];\n    const map = { \")\": \"(\", \"}\": \"{\", \"]\": \"[\" };\n    for (const char of s) {\n        if (char === \"(\" || char === \"{\" || char === \"[\") {\n            stack.push(char);\n        } else if (stack.pop() !== map[char]) {\n            return \"false\";\n        }\n    }\n    return stack.length === 0 ? \"true\" : \"false\";\n}\n\nconst fs = require(\"fs\");\nconsole.log(solve(fs.readFileSync(0, \"utf-8\")));", "python": "import sys\n\ndef solve(s):\n    s = s.strip()\n    stack = []\n    mapping = {\")\": \"(\", \"}\": \"{\", \"]\": \"[\"}\n    for char in s:\n        if char in mapping.values():\n            stack.append(char)\n        elif char in mapping:\n            if not stack or stack.pop() != mapping[char]:\n                return \"false\"\n    return \"true\" if not stack else \"false\"\n\nif __name__ == \"__main__\":\n    print(solve(sys.stdin.read()))"}'::jsonb
) ON CONFLICT (slug) DO NOTHING;

-- Test cases for Valid Parentheses
INSERT INTO coding_test_cases (problem_id, input_data, expected_output, is_hidden, weight) VALUES
('b2222222-2222-2222-2222-222222222222', '()[]{}', 'true', false, 1),
('b2222222-2222-2222-2222-222222222222', '(]', 'false', false, 1),
('b2222222-2222-2222-2222-222222222222', '([{}])', 'true', true, 2),
('b2222222-2222-2222-2222-222222222222', '[(])', 'false', true, 2);

-- Problem 3: Palindrome Check
INSERT INTO coding_problems (
    id, title, slug, description, difficulty, category, supported_languages, constraints, starter_code
) VALUES (
    'c3333333-3333-3333-3333-333333333333',
    'Valid Palindrome Phrase',
    'valid-palindrome-phrase',
    'A phrase is a palindrome if, after converting all uppercase letters into lowercase letters and removing all non-alphanumeric characters, it reads the same forward and backward. Alphanumeric characters include letters and numbers. Return `true` or `false`.',
    'easy',
    'algorithms',
    ARRAY['javascript', 'python'],
    '1 <= s.length <= 2 * 10^5\ns consists only of printable ASCII characters.',
    '{"javascript": "function solve(input) {\n    const clean = input.toLowerCase().replace(/[^a-z0-9]/g, \"\");\n    const rev = clean.split(\"\").reverse().join(\"\");\n    return clean === rev ? \"true\" : \"false\";\n}\n\nconst fs = require(\"fs\");\nconsole.log(solve(fs.readFileSync(0, \"utf-8\")));", "python": "import sys, re\n\ndef solve(s):\n    clean = re.sub(r\"[^a-zA-Z0-9]\", \"\", s).lower()\n    return \"true\" if clean == clean[::-1] else \"false\"\n\nif __name__ == \"__main__\":\n    print(solve(sys.stdin.read()))"}'::jsonb
) ON CONFLICT (slug) DO NOTHING;

-- Test cases for Palindrome
INSERT INTO coding_test_cases (problem_id, input_data, expected_output, is_hidden, weight) VALUES
('c3333333-3333-3333-3333-333333333333', 'A man, a plan, a canal: Panama', 'true', false, 1),
('c3333333-3333-3333-3333-333333333333', 'race a car', 'false', false, 1),
('c3333333-3333-3333-3333-333333333333', '0P', 'false', true, 2),
('c3333333-3333-3333-3333-333333333333', 'Was it a car or a cat I saw?', 'true', true, 2);

-- 3. SEED ASSESSMENTS
INSERT INTO assessments (
    id, title, description, duration_seconds, difficulty, category, status
) VALUES (
    'd4444444-4444-4444-4444-444444444444',
    'Full-Stack Algorithmic Benchmark',
    'Timed technical assessment covering array lookups, stack operations, and string filtering under time constraints.',
    3600,
    'intermediate',
    'Full Stack Engineering',
    'active'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO assessment_problems (assessment_id, problem_id, display_order, points) VALUES
('d4444444-4444-4444-4444-444444444444', 'a1111111-1111-1111-1111-111111111111', 1, 35),
('d4444444-4444-4444-4444-444444444444', 'b2222222-2222-2222-2222-222222222222', 2, 35),
('d4444444-4444-4444-4444-444444444444', 'c3333333-3333-3333-3333-333333333333', 3, 30)
ON CONFLICT (assessment_id, problem_id) DO NOTHING;

-- 4. SEED CREDENTIAL TEMPLATES
INSERT INTO credential_templates (
    id, issuer_id, title, description, criteria, credential_type, status
) VALUES (
    'e5555555-5555-5555-5555-555555555555',
    '00000000-0000-0000-0000-000000000001',
    'Certified Algorithmic Problem Solver',
    'Awarded for passing rigorous automated code execution benchmarks with 90%+ pass rate and optimal time complexity.',
    'Complete the Full-Stack Algorithmic Benchmark assessment with automated test pass rate >= 90%.',
    'assessment_achievement',
    'active'
),
(
    'e6666666-6666-6666-6666-666666666666',
    '00000000-0000-0000-0000-000000000001',
    'Full-Stack Web Development Specialist',
    'Awarded for verified mastery in modern frontend components, backend REST architectures, and database design.',
    'Published at least 2 verified full-stack projects with live demos and repository evidence.',
    'project_completion',
    'active'
) ON CONFLICT (id) DO NOTHING;
