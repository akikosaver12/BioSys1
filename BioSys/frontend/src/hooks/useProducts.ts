import { useState, useEffect } from "react";
import { Product, BackendProduct } from '../types/Product';

// Re-exportar Product para mantener compatibilidad
export type { Product, BackendProduct } from '../types/Product';

// CONSTANTES - Consistente con otros archivos
const API_URL = process.env.REACT_APP_API_URL || "https://biosys1.onrender.com/api";

interface UseProductsState {
  products: Product[];
  loading: boolean;
  error: string | null;
}

interface UseProductsReturn extends UseProductsState {
  fetchProducts: () => Promise<void>;
  fetchProductById: (id: string) => Promise<Product | null>;
  refetch: () => Promise<void>;
}

export function useProducts(): UseProductsReturn {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem("token");

      // Armamos headers dinámicamente
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(`${API_URL}/productos`, {
        headers,
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data: BackendProduct[] = await response.json();

      // Normalizamos datos manteniendo toda la información original
      const normalized: Product[] = data
        .filter((p: BackendProduct) => p.activo) // Solo productos activos
        .map((p: BackendProduct): Product => ({
          // Datos originales completos
          ...p,
          // Campos normalizados para compatibilidad
          id: p._id,
          name: p.nombre,
          description: p.descripcion,
          price: p.precio, // Solo el precio base, sin descuentos
          category: p.categoria,
          image: p.imagenUrl || p.imagen, // 🆕 PRIORIZAR imagenUrl (Base64)
        }));

      setProducts(normalized);
    } catch (err: any) {
      setError(err.message || 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const fetchProductById = async (id: string): Promise<Product | null> => {
    try {
      const token = localStorage.getItem("token");

      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(`${API_URL}/productos/${id}`, {
        headers,
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data: BackendProduct = await response.json();

      // Normalizar el producto individual
      const normalized: Product = {
        ...data,
        id: data._id,
        name: data.nombre,
        description: data.descripcion,
        price: data.precio,
        category: data.categoria,
        image: data.imagenUrl || data.imagen, // 🆕 PRIORIZAR imagenUrl (Base64)
      };

      return normalized;
    } catch (err) {
      console.error('Error fetching product by ID:', err);
      return null;
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  return {
    products,
    loading,
    error,
    fetchProducts,
    fetchProductById,
    refetch: fetchProducts
  };
}