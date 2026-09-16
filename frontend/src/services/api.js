const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

class ApiService {
  constructor() {
    this.baseUrl = API_URL;
  }

  getAuthToken() {
    return localStorage.getItem('skillproof_token');
  }

  getCurrentRole() {
    return localStorage.getItem('skillproof_role') || 'student';
  }

  getCurrentUserId() {
    return localStorage.getItem('skillproof_user_id') || 'demo-student-uuid';
  }

  async request(endpoint, options = {}) {
    const token = this.getAuthToken();
    const role = this.getCurrentRole();
    const userId = this.getCurrentUserId();

    const headers = {
      'Content-Type': 'application/json',
      'x-dev-role': role,
      'x-dev-user-id': userId,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    };

    const url = `${this.baseUrl}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data?.message || data?.error || `HTTP Error ${response.status}`);
      }

      return data.data !== undefined ? data.data : data;
    } catch (err) {
      console.error(`API [${options.method || 'GET'} ${endpoint}] error:`, err);
      throw err;
    }
  }

  // Auth endpoints
  async login(email, password, role) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, role }),
    });
  }

  async register(data) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getSession() {
    return this.request('/auth/me');
  }

  // Profile endpoints
  async getMyProfile() {
    return this.request('/profiles/me');
  }

  async updateProfile(data) {
    return this.request('/profiles/me', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async addSkill(skill) {
    return this.request('/profiles/me/skills', {
      method: 'POST',
      body: JSON.stringify(skill),
    });
  }

  async removeSkill(skillId) {
    return this.request(`/profiles/me/skills/${skillId}`, {
      method: 'DELETE',
    });
  }

  async clearResume() {
    return this.request('/profiles/me/resume', {
      method: 'DELETE',
    });
  }

  async getPublicProfile(id) {
    return this.request(`/profiles/${id}`);
  }

  // Portfolios
  async getMyPortfolios() {
    return this.request('/portfolios/me');
  }

  async createPortfolio(data) {
    return this.request('/portfolios', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updatePortfolio(id, data) {
    return this.request(`/portfolios/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async getPublicPortfolio(slug) {
    return this.request(`/portfolios/public/${slug}`);
  }

  // Projects
  async getMyProjects() {
    return this.request('/projects/me');
  }

  async createProject(data) {
    return this.request('/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async deleteProject(id) {
    return this.request(`/projects/${id}`, {
      method: 'DELETE',
    });
  }

  async syncGitHub(repoUrl) {
    return this.request('/projects/github-sync', {
      method: 'POST',
      body: JSON.stringify({ repoUrl }),
    });
  }

  // Coding Problems & Execution
  async getProblems(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/coding-problems${query ? '?' + query : ''}`);
  }

  async getProblem(idOrSlug) {
    return this.request(`/coding-problems/${idOrSlug}`);
  }

  async runCode(language, sourceCode, input = '') {
    return this.request('/code-execution/run', {
      method: 'POST',
      body: JSON.stringify({ language, sourceCode, input }),
    });
  }

  async runSampleTests(problemId, language, sourceCode) {
    return this.request(`/coding-problems/${problemId}/run`, {
      method: 'POST',
      body: JSON.stringify({ language, sourceCode }),
    });
  }

  async submitSolution(problemId, language, sourceCode, attemptId) {
    return this.request(`/coding-problems/${problemId}/submit`, {
      method: 'POST',
      body: JSON.stringify({ language, sourceCode, attemptId }),
    });
  }

  // Assessments
  async getAssessments() {
    return this.request('/assessments');
  }

  async getRecommendedAssessments() {
    return this.request('/assessments/recommended');
  }

  async getAssessment(id) {
    return this.request(`/assessments/${id}`);
  }

  async startAssessment(id) {
    return this.request(`/assessments/${id}/start`, { method: 'POST' });
  }

  async submitAssessment(id, attemptId, submissions = []) {
    return this.request(`/assessments/${id}/submit`, {
      method: 'POST',
      body: JSON.stringify({ attemptId, submissions }),
    });
  }

  async getAttemptResult(attemptId) {
    return this.request(`/assessments/attempts/${attemptId}/result`);
  }

  // Credentials & Verification
  async getMyCredentials() {
    return this.request('/credentials/me');
  }

  async getCredential(credentialId) {
    return this.request(`/credentials/${credentialId}`);
  }

  async issueCredential(data) {
    return this.request('/credentials', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async revokeCredential(credentialId, reason) {
    return this.request(`/credentials/${credentialId}/revoke`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  async getCredentialTemplates() {
    return this.request('/credentials/templates');
  }

  async verifyCredential(credentialId) {
    return this.request(`/verify/${credentialId}`);
  }

  async getSignatureVerification(credentialId) {
    return this.request(`/verify/${credentialId}/signature`);
  }

  // AI Copilot
  async generateBio(data) {
    return this.request('/ai/portfolio-description', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async generateProjectSummary(data) {
    return this.request('/ai/project-summary', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async analyzeSkillGap(data) {
    return this.request('/ai/skill-gap-analysis', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async analyzeResume(resumeText, fileName) {
    return this.request('/ai/analyze-resume', {
      method: 'POST',
      body: JSON.stringify({ resumeText, fileName }),
    });
  }

  async applyResumeData(parsedData) {
    return this.request('/ai/apply-resume-data', {
      method: 'POST',
      body: JSON.stringify({ parsedData }),
    });
  }

  // Recruiters
  async searchCandidates(filters = {}) {
    const query = new URLSearchParams(filters).toString();
    return this.request(`/recruiters/candidates${query ? '?' + query : ''}`);
  }

  async getShortlists() {
    return this.request('/recruiters/shortlists');
  }

  async createShortlist(data) {
    return this.request('/recruiters/shortlists', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async addCandidateToShortlist(shortlistId, candidateId, notes) {
    return this.request(`/recruiters/shortlists/${shortlistId}/candidates`, {
      method: 'POST',
      body: JSON.stringify({ candidateId, notes }),
    });
  }

  // Admin
  async getAdminAnalytics() {
    return this.request('/admin/analytics');
  }

  async getAdminUsers() {
    return this.request('/admin/users');
  }

  async updateAdminUserStatus(userId, status) {
    return this.request(`/admin/users/${userId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  async approveIssuer(issuerId) {
    return this.request(`/admin/issuers/${issuerId}/approve`, {
      method: 'POST',
    });
  }

  async getAdminAuditLogs() {
    return this.request('/admin/audit-logs');
  }
}

export const api = new ApiService();
