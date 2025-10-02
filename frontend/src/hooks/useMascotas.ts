import { useState, useEffect } from 'react';
import api from '../utils/api';

// Definimos la estructura de una mascota
export interface Mascota {
  id: number;
  nombre: string;
  años: number;
  raza: string;
}

// Custom hook para manejar mascotas
export const useMascotas = () => {
  const [mascotas, setMascotas] = useState<Mascota[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Función para obtener mascotas del backend
  const fetchMascotas = async () => {
    try {
      setLoading(true);
      const response = await api.get<Mascota[]>('/mascotas'); // Ruta en Laravel
      setMascotas(response.data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Error al obtener mascotas');
      console.error('❌ Error obteniendo mascotas:', err);
    } finally {
      setLoading(false);
    }
  };

  // Ejecutar al cargar el hook
  useEffect(() => {
    fetchMascotas();
  }, []);

  return {
    mascotas,     // Lista de mascotas
    loading,      // Estado de carga
    error,        // Mensaje de error
    refetch: fetchMascotas // Función para recargar
  };
};
