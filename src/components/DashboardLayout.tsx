'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/auth';
import { attendanceApi, Attendance, User } from '@/lib/api';
import { LogOut, MapPin, Clock } from 'lucide-react';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [user, setUser] = useState<User | null>(null);
  const [attendance, setAttendance] = useState<Attendance | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
    loadAttendanceStatus();
  }, []);

  const checkAuth = () => {
    if (!auth.isAuthenticated()) {
      router.push('/login');
      return;
    }
    
    const userData = auth.getUser();
    setUser(userData);
  };

  const loadAttendanceStatus = async () => {
    try {
      const status = await attendanceApi.getStatus();
      setAttendance(status);
    } catch (err) {
      console.error('Erro ao carregar status de presença:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    auth.logout();
  };

  const handleCheckout = async () => {
    try {
      await attendanceApi.checkout();
      setAttendance(null);
      router.push('/checkin');
    } catch (err) {
      console.error('Erro ao fazer checkout:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Clock className="h-8 w-8 animate-spin mx-auto mb-4 text-primary-600" />
          <p>Carregando...</p>
        </div>
      </div>
    );
  }

  if (!attendance) {
    router.push('/checkin');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-semibold text-gray-900">
                Roleta de Leads
              </h1>
              {user && (
                <div className="text-sm text-gray-600">
                  Olá, <span className="font-medium">{user.name}</span>
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Status de Presença */}
              <div className="flex items-center space-x-2 text-sm">
                <MapPin className="h-4 w-4 text-green-600" />
                <span className="text-gray-700">
                  {attendance.store.name}
                </span>
                <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                  Disponível
                </span>
              </div>
              
              {/* Botões de Ação */}
              <button
                onClick={handleCheckout}
                className="btn btn-warning text-sm"
              >
                Sair do Plantão
              </button>
              
              <button
                onClick={handleLogout}
                className="btn btn-danger text-sm"
              >
                <LogOut className="h-4 w-4 mr-1" />
                Sair
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}

