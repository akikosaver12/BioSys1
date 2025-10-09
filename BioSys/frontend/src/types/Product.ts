// Tipos según tu esquema real de MongoDB
export interface BackendProduct {
  _id: string;
  nombre: string;
  descripcion: string;
  precio: number;
  categoria: 'alimento' | 'juguetes' | 'medicamentos' | 'accesorios' | 'higiene' | 'otros';
  imagen?: string;
  imagenUrl?: string; // 🆕 OPCIONAL - Base64 desde MongoDB
  stock: number;
  envioGratis: boolean;
  activo: boolean;
  garantia: {
    tiene: boolean;
    meses: number;
    descripcion: string;
  };
  descuento?: {
    tiene: boolean;
    porcentaje: number;
    fechaInicio?: Date | string;
    fechaFin?: Date | string;
  };
  usuario: {
    name: string;
    email: string;
    telefono: string;
  };
  createdAt: string;
  updatedAt: string;
}

// Tipo normalizado para frontend (mantener compatibilidad)
export interface Product extends BackendProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image?: string; // 🆕 Este campo contendrá imagenUrl o imagen
}

// Tipos para el carrito
export interface CartItem extends Product {
  quantity: number;
}

// Tipos para categorías
export type ProductCategory = 
  | 'alimento' 
  | 'juguetes' 
  | 'medicamentos' 
  | 'accesorios' 
  | 'higiene' 
  | 'otros';

export const CATEGORY_LABELS: Record<ProductCategory, string> = {
  'alimento': 'Alimento',
  'juguetes': 'Juguetes', 
  'medicamentos': 'Medicamentos',
  'accesorios': 'Accesorios',
  'higiene': 'Higiene',
  'otros': 'Otros'
};