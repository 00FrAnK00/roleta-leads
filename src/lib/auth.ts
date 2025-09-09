import Cookies from 'js-cookie';
import { User } from './api';

export const auth = {
  setToken: (token: string) => {
    Cookies.set('auth_token', token, { expires: 1 }); // 1 dia
  },

  getToken: (): string | undefined => {
    return Cookies.get('auth_token');
  },

  removeToken: () => {
    Cookies.remove('auth_token');
  },

  setUser: (user: User) => {
    Cookies.set('user_data', JSON.stringify(user), { expires: 1 });
  },

  getUser: (): User | null => {
    const userData = Cookies.get('user_data');
    return userData ? JSON.parse(userData) : null;
  },

  removeUser: () => {
    Cookies.remove('user_data');
  },

  isAuthenticated: (): boolean => {
    return !!auth.getToken();
  },

  logout: () => {
    auth.removeToken();
    auth.removeUser();
    window.location.href = '/login';
  },
};

