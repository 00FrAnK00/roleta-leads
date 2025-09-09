'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { storeApi, attendanceApi, Store } from '@/lib/api';
import { geolocation } from '@/lib/geolocation';
import { MapPin, Smartphone, Clock } from 'lucide-react';

interface CheckinFormProps {
  onSuccess?: () => void;
}

export default function CheckinForm({ onSuccess }: CheckinFormProps) {
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [useLocation, setUseLocation] = useState(true);
  const [totpCode, setTotpCode] = useState('');
  const [locationStatus, setLocationStatus] = useState<'idle' | 'getting' | 'success' | 'error'>('idle');
  const router = useRouter();

  useEffect(() => {
    loadStores();
  }, []);

  const loadStores = async () => {
    try {
      const storesData = await storeApi.getAll();
      setStores(storesData);
      if (storesData.length === 1) {
        setSelectedStore(storesData[0]);
      }
    } catch (err) {
      setError('Erro ao carregar lojas disponíveis');
    }
  };

  const handleLocationCheckin = async () => {
    if (!selectedStore) return;

    setLoading(true);
    setError('');
    setLocationStatus('getting');

    try {
      const position = await geolocation.getCurrentPosition();
      setLocationStatus('success');

      const attendance = await attendanceApi.checkin({
        storeId: selectedStore.id,
        latitude: position.latitude,
        longitude: position.longitude,
      });

      onSuccess?.();
      router.push('/dashboard');
    } catch (err: any) {
      setLocationStatus('error');
      setError(
        err.response?.data?.message || 
        err.message || 
        'Erro ao fazer check-in com localização'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleTotpCheckin = async () => {
    if (!selectedStore || !totpCode) return;

    setLoading(true);
    setError('');

    try {
      const attendance = await attendanceApi.checkin({
        storeId: selectedStore.id,
        totpCode: totpCode,
      });

      onSuccess?.();
      router.push('/dashboard');
    } catch (err: any) {
      setError(
        err.response?.data?.message || 
        'Código de autenticação inválido'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">Entrar em Plantão</h2>
        <p className="text-gray-600 mt-2">
          Selecione a loja e confirme sua presença
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Seleção de Loja */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Selecionar Loja
        </label>
        <select
          className="input"
          value={selectedStore?.id || ''}
          onChange={(e) => {
            const store = stores.find(s => s.id === e.target.value);
            setSelectedStore(store || null);
          }}
          disabled={loading}
        >
          <option value="">Selecione uma loja</option>
          {stores.map((store) => (
            <option key={store.id} value={store.id}>
              {store.name}
            </option>
          ))}
        </select>
      </div>

      {selectedStore && (
        <div className="space-y-4">
          {/* Opção de Localização */}
          <div className="card">
            <div className="flex items-center space-x-3 mb-3">
              <MapPin className="h-5 w-5 text-primary-600" />
              <h3 className="font-medium">Check-in por Localização</h3>
            </div>
            
            <p className="text-sm text-gray-600 mb-4">
              Use sua localização GPS para confirmar que está na loja
            </p>
            
            {locationStatus === 'getting' && (
              <div className="flex items-center space-x-2 text-blue-600 mb-3">
                <Clock className="h-4 w-4 animate-spin" />
                <span className="text-sm">Obtendo localização...</span>
              </div>
            )}
            
            {locationStatus === 'error' && (
              <div className="text-red-600 text-sm mb-3">
                Não foi possível obter sua localização. Use o código de autenticação abaixo.
              </div>
            )}
            
            <button
              onClick={handleLocationCheckin}
              disabled={loading || !selectedStore}
              className={`w-full btn ${loading ? 'btn-disabled' : 'btn-primary'}`}
            >
              {loading ? 'Verificando...' : 'Usar Localização GPS'}
            </button>
          </div>

          {/* Opção de Código TOTP */}
          <div className="card">
            <div className="flex items-center space-x-3 mb-3">
              <Smartphone className="h-5 w-5 text-primary-600" />
              <h3 className="font-medium">Check-in por Código</h3>
            </div>
            
            <p className="text-sm text-gray-600 mb-4">
              Digite o código de 6 dígitos exibido no dispositivo da loja
            </p>
            
            <div className="space-y-3">
              <input
                type="text"
                placeholder="000000"
                className="input text-center text-lg font-mono"
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                disabled={loading}
                maxLength={6}
              />
              
              <button
                onClick={handleTotpCheckin}
                disabled={loading || !selectedStore || totpCode.length !== 6}
                className={`w-full btn ${
                  loading || totpCode.length !== 6 ? 'btn-disabled' : 'btn-success'
                }`}
              >
                {loading ? 'Verificando...' : 'Confirmar Código'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

