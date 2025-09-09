'use client';

import { useState, useEffect } from 'react';
import { leadsApi, capturesApi, Lead, CaptureStats } from '@/lib/api';
import { Clock, Flame, Target, AlertCircle, CheckCircle, XCircle } from 'lucide-react';

interface LeadsListProps {
  storeId?: string;
}

export default function LeadsList({ storeId }: LeadsListProps) {
  const [waitingLeads, setWaitingLeads] = useState<Lead[]>([]);
  const [assignedLeads, setAssignedLeads] = useState<Lead[]>([]);
  const [stats, setStats] = useState<CaptureStats>({ hourly: 0, daily: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [capturing, setCapturing] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000); // Atualizar a cada 5 segundos
    return () => clearInterval(interval);
  }, [storeId]);

  const loadData = async () => {
    try {
      const [waiting, assigned, captureStats] = await Promise.all([
        leadsApi.getWaiting(storeId),
        leadsApi.getAssigned(),
        capturesApi.getStats(),
      ]);

      setWaitingLeads(waiting);
      setAssignedLeads(assigned);
      setStats(captureStats);
      setError('');
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
      setError('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleCapture = async (leadId: string) => {
    setCapturing(leadId);
    setError('');

    try {
      await capturesApi.capture(leadId);
      await loadData(); // Recarregar dados após captura
    } catch (err: any) {
      setError(
        err.response?.data?.message || 
        'Erro ao capturar lead'
      );
    } finally {
      setCapturing(null);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Agora';
    if (diffMins < 60) return `${diffMins}min`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ${diffMins % 60}min`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ${diffHours % 24}h`;
  };

  const getLeadTypeIcon = (lead: Lead) => {
    if (lead.isHot) {
      return <Flame className="h-4 w-4 text-red-500" title="Lead HOT" />;
    }
    return <Target className="h-4 w-4 text-blue-500" title="Lead Regular" />;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'WAITING':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'ASSIGNED':
        return <AlertCircle className="h-4 w-4 text-blue-500" />;
      case 'CAPTURED':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      default:
        return <XCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Clock className="h-6 w-6 animate-spin text-primary-600 mr-2" />
        <span>Carregando leads...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Estatísticas */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600">Capturas (Hora)</p>
              <p className="text-2xl font-bold text-blue-900">{stats.hourly}</p>
            </div>
            <Clock className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600">Capturas (Dia)</p>
              <p className="text-2xl font-bold text-green-900">{stats.daily}</p>
            </div>
            <Target className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="bg-purple-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-600">Total</p>
              <p className="text-2xl font-bold text-purple-900">{stats.total}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Leads Atribuídos */}
      {assignedLeads.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="px-6 py-4 border-b">
            <h3 className="text-lg font-semibold text-gray-900">
              Seus Leads ({assignedLeads.length})
            </h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Campanha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Conjunto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Atribuído há
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Ação
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {assignedLeads.map((lead) => (
                  <tr key={lead.id} className={lead.isHot ? 'bg-red-50' : ''}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getLeadTypeIcon(lead)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {lead.campaign}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {lead.adSet}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {lead.assignedAt ? formatTime(lead.assignedAt) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleCapture(lead.id)}
                        disabled={capturing === lead.id}
                        className={`btn ${
                          capturing === lead.id ? 'btn-disabled' : 
                          lead.isHot ? 'btn-danger' : 'btn-primary'
                        } text-sm`}
                      >
                        {capturing === lead.id ? 'Capturando...' : 'Capturar'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Lista de Espera */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">
            Lista de Espera ({waitingLeads.length})
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Ordenado por: HOT primeiro, depois mais antigo
          </p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Tipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Campanha
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Conjunto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Chegada
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Idade
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {waitingLeads.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    Nenhum lead na fila de espera
                  </td>
                </tr>
              ) : (
                waitingLeads.map((lead, index) => (
                  <tr key={lead.id} className={lead.isHot ? 'bg-red-50' : ''}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getLeadTypeIcon(lead)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {lead.campaign}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {lead.adSet}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(lead.receivedAt).toLocaleTimeString('pt-BR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatTime(lead.receivedAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getStatusIcon(lead.status)}
                        <span className="ml-2 text-sm text-gray-600">
                          {index === 0 ? 'Próximo' : `${index + 1}º na fila`}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

