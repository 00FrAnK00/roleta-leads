'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import LeadsList from '@/components/LeadsList';
import { auth } from '@/lib/auth';
import { attendanceApi, User, Attendance } from '@/lib/api';

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [attendance, setAttendance] = useState<Attendance | null>(null);

  useEffect(() => {
    const userData = auth.getUser();
    setUser(userData);
    
    loadAttendance();
  }, []);

  const loadAttendance = async () => {
    try {
      const attendanceData = await attendanceApi.getStatus();
      setAttendance(attendanceData);
    } catch (err) {
      console.error('Erro ao carregar presença:', err);
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'FORTE': return 'text-green-600 bg-green-100';
      case 'MEDIO': return 'text-yellow-600 bg-yellow-100';
      case 'FRACO': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getTierLimits = (tier: string) => {
    switch (tier) {
      case 'FORTE': return { hour: 4, day: 18 };
      case 'MEDIO': return { hour: 3, day: 12 };
      case 'FRACO': return { hour: 2, day: 8 };
      default: return { hour: 0, day: 0 };
    }
  };

  if (!user) return null;

  const limits = getTierLimits(user.tier);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Informações do Corretor */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Informações do Corretor
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">Tier</p>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTierColor(user.tier)}`}>
                {user.tier}
              </span>
            </div>
            
            {user.isTop && (
              <div className="bg-purple-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">Status</p>
                <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
                  TOP
                </span>
              </div>
            )}

            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-sm text-blue-600">Limite/Hora</p>
              <p className="text-lg font-bold text-blue-900">{limits.hour}</p>
            </div>

            <div className="bg-green-50 rounded-lg p-4">
              <p className="text-sm text-green-600">Limite/Dia</p>
              <p className="text-lg font-bold text-green-900">{limits.day}</p>
            </div>
          </div>

          {attendance && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm text-gray-600">
                Em plantão na loja: <span className="font-medium">{attendance.store.name}</span>
              </p>
              <p className="text-xs text-gray-500">
                Desde: {new Date(attendance.checkinAt).toLocaleString('pt-BR')}
              </p>
            </div>
          )}
        </div>

        {/* Lista de Leads */}
        <LeadsList storeId={attendance?.store?.id} />
      </div>
    </DashboardLayout>
  );
}

