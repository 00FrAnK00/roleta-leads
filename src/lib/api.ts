import axios from 'axios';
import Cookies from 'js-cookie';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';

export const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para adicionar token de autenticação
api.interceptors.request.use((config) => {
  const token = Cookies.get('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para tratar erros de autenticação
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      Cookies.remove('auth_token');
      Cookies.remove('user_data');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Tipos
export interface User {
  id: string;
  email: string;
  name: string;
  tier: 'FORTE' | 'MEDIO' | 'FRACO';
  isTop: boolean;
  isAdmin: boolean;
}

export interface Store {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  radius: number;
}

export interface Lead {
  id: string;
  campaign: string;
  adSet: string;
  isHot: boolean;
  status: 'WAITING' | 'ASSIGNED' | 'CAPTURED' | 'EXPIRED';
  receivedAt: string;
  assignedAt?: string;
  capturedAt?: string;
  assignedTo?: string;
  store: Store;
  leadData: any;
}

export interface Capture {
  id: string;
  status: 'PROCESSING' | 'SENT' | 'ERROR';
  capturedAt: string;
  sentAt?: string;
  lead: Lead;
}

export interface CaptureStats {
  hourly: number;
  daily: number;
  total: number;
}

export interface LoginResponse {
  access_token: string;
  user: User;
}

export interface Attendance {
  id: string;
  status: 'PRESENT' | 'ABSENT';
  checkinAt: string;
  checkoutAt?: string;
  store: Store;
}

// Funções da API
export const authApi = {
  login: async (email: string, password: string): Promise<LoginResponse> => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },
};

export const userApi = {
  getProfile: async (): Promise<User> => {
    const response = await api.get('/users/me');
    return response.data;
  },
};

export const storeApi = {
  getAll: async (): Promise<Store[]> => {
    const response = await api.get('/stores');
    return response.data;
  },
};

export const attendanceApi = {
  checkin: async (data: {
    storeId: string;
    latitude?: number;
    longitude?: number;
    totpCode?: string;
  }): Promise<Attendance> => {
    const response = await api.post('/attendance/checkin', data);
    return response.data;
  },
  
  checkout: async (): Promise<Attendance> => {
    const response = await api.delete('/attendance/checkout');
    return response.data;
  },
  
  getStatus: async (): Promise<Attendance | null> => {
    try {
      const response = await api.get('/attendance/status');
      return response.data;
    } catch (error) {
      return null;
    }
  },
};

export const leadsApi = {
  getWaiting: async (storeId?: string): Promise<Lead[]> => {
    const params = storeId ? { storeId } : {};
    const response = await api.get('/leads/waiting', { params });
    return response.data;
  },

  getAssigned: async (): Promise<Lead[]> => {
    const response = await api.get('/leads/assigned');
    return response.data;
  },
};

export const capturesApi = {
  capture: async (leadId: string): Promise<Capture> => {
    const response = await api.post(`/captures/${leadId}`);
    return response.data;
  },

  getMy: async (limit = 50): Promise<Capture[]> => {
    const response = await api.get('/captures/my', { params: { limit } });
    return response.data;
  },

  getStats: async (): Promise<CaptureStats> => {
    const response = await api.get('/captures/stats');
    return response.data;
  },
};

export const webhooksApi = {
  createTestLead: async (campaign: string, adSet: string, isHot = false): Promise<any> => {
    const response = await api.post('/webhooks/create-test-lead', 
      { campaign, adSet }, 
      { params: { hot: isHot.toString() } }
    );
    return response.data;
  },
};

