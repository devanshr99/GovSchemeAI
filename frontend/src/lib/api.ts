import { EligibilityRequest, EligibilityResponse } from '../types/eligibility';
import { SchemeListResponse, SchemeDetail, Category } from '../types/scheme';

// API calls go through Next.js rewrites (proxied to backend)
// No need for an absolute URL — all /api/* requests are proxied automatically
const API_BASE_URL = '';

async function fetchJson<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers || {}),
    },
  });

  if (!response.ok) {
    let errorMessage = `HTTP error! Status: ${response.status}`;
    try {
      const errorData = await response.json();
      errorMessage = errorData.detail || errorMessage;
    } catch {
      // Ignore
    }
    throw new Error(errorMessage);
  }

  return response.json() as Promise<T>;
}

export const api = {
  // Eligibility check
  checkEligibility: (profile: EligibilityRequest): Promise<EligibilityResponse> => {
    return fetchJson<EligibilityResponse>('/api/eligibility/check', {
      method: 'POST',
      body: JSON.stringify(profile),
    });
  },

  // Schemes listing and retrieval
  getSchemes: (params: {
    page?: number;
    pageSize?: number;
    level?: string;
    state?: string;
    category?: string;
    search?: string;
    activeOnly?: boolean;
  } = {}): Promise<SchemeListResponse> => {
    const query = new URLSearchParams();
    if (params.page) query.append('page', params.page.toString());
    if (params.pageSize) query.append('page_size', params.pageSize.toString());
    if (params.level) query.append('level', params.level);
    if (params.state) query.append('state', params.state);
    if (params.category) query.append('category', params.category);
    if (params.search) query.append('search', params.search);
    if (params.activeOnly !== undefined) query.append('active_only', params.activeOnly.toString());

    const queryString = query.toString() ? `?${query.toString()}` : '';
    return fetchJson<SchemeListResponse>(`/api/schemes${queryString}`);
  },

  getSchemeDetail: (slug: string): Promise<SchemeDetail> => {
    return fetchJson<SchemeDetail>(`/api/schemes/${slug}`);
  },

  getCategories: (): Promise<Category[]> => {
    return fetchJson<Category[]>('/api/schemes/categories');
  },

  // Location lookups
  getStates: (): Promise<Array<{ code: string; name: string; name_hi?: string }>> => {
    return fetchJson<Array<{ code: string; name: string; name_hi?: string }>>('/api/locations/states');
  },

  getDistricts: (stateCode: string): Promise<Array<{ id: number; name: string; name_hi?: string }>> => {
    return fetchJson<Array<{ id: number; name: string; name_hi?: string }>>(`/api/locations/districts/${stateCode}`);
  },

  // AI Chat
  sendChatMessage: (params: {
    message: string;
    sessionId?: string;
    language: 'en' | 'hi';
  }): Promise<{
    response: string;
    session_id: string;
    sources: string[];
    suggested_questions: string[];
  }> => {
    return fetchJson<{
      response: string;
      session_id: string;
      sources: string[];
      suggested_questions: string[];
    }>('/api/chat', {
      method: 'POST',
      body: JSON.stringify({
        message: params.message,
        session_id: params.sessionId,
        language: params.language,
      }),
    });
  },

  // Profile Storage helpers
  saveProfileToStorage: (profile: EligibilityRequest): void => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('govscheme_profile', JSON.stringify(profile));
    }
  },

  getProfileFromStorage: (): EligibilityRequest | null => {
    if (typeof window !== 'undefined') {
      let stored = localStorage.getItem('govscheme_profile');
      if (!stored) {
        stored = localStorage.getItem('yojana_profile');
      }
      if (stored) {
        try {
          return JSON.parse(stored) as EligibilityRequest;
        } catch {
          return null;
        }
      }
    }
    return null;
  },

  clearProfileFromStorage: (): void => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('govscheme_profile');
      localStorage.removeItem('yojana_profile');
    }
  },

  // Update Scheduler / Staging API actions
  getUpdateHealth: (): Promise<{ enabled: boolean; running: boolean; next_run: string | null; cron: string }> => {
    return fetchJson('/api/admin/updates/health');
  },

  triggerUpdateRun: (): Promise<{ status: string; message: string }> => {
    return fetchJson('/api/admin/updates/runs/trigger', { method: 'POST' });
  },

  getUpdateRuns: (): Promise<any[]> => {
    return fetchJson('/api/admin/updates/runs');
  },

  getStagedEntries: (status: string = 'pending'): Promise<any[]> => {
    return fetchJson(`/api/admin/updates/staging?status=${status}`);
  },

  getStagedEntryDetail: (id: string): Promise<any> => {
    return fetchJson(`/api/admin/updates/staging/${id}`);
  },

  approveStagedEntry: (id: string, notes?: string): Promise<any> => {
    return fetchJson(`/api/admin/updates/staging/${id}/approve`, {
      method: 'POST',
      body: JSON.stringify({ notes }),
    });
  },

  rejectStagedEntry: (id: string, notes?: string): Promise<any> => {
    return fetchJson(`/api/admin/updates/staging/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ notes }),
    });
  },
};
