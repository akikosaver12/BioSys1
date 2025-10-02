import React, { useState } from 'react';
import { useProducts } from '../hooks/useProducts';
import ProductCard from '../components/shop/ProductCard';
import Loading from '../components/common/Loading';
import { Grid, List } from "lucide-react";

const BASE_URL = "http://localhost:5000";

const ProductsPage: React.FC = () => {
  const { products, loading, error } = useProducts();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Mapear categorías a español
  const getCategoryLabel = (categoria: string) => {
    const categoryMap: Record<string, string> = {
      'alimento': 'Alimento',
      'juguetes': 'Juguetes',
      'medicamentos': 'Medicamentos',
      'accesorios': 'Accesorios',
      'higiene': 'Higiene',
      'otros': 'Otros'
    };
    return categoryMap[categoria] || categoria;
  };

  // Normalizar datos que vienen del backend
  const normalizedProducts = products.map(p => ({
    id: p._id, 
    name: p.nombre,
    description: p.descripcion,
    price: p.precio, // Solo precio base, sin descuentos
    category: p.categoria,
    image: p.imagen ? (p.imagen.startsWith('http') ? p.imagen : `${BASE_URL}${p.imagen}`) : "/placeholder.png",
    // Mantener datos originales para ProductCard
    originalProduct: p
  }));

  // Filtrar + ordenar
  const filteredProducts = normalizedProducts
    .filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           product.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'price-low': return a.price - b.price;
        case 'price-high': return b.price - a.price;
        case 'name': return a.name.localeCompare(b.name);
        default: return 0;
      }
    });

  // Sacar categorías dinámicas
  const uniqueCategories = Array.from(new Set(normalizedProducts.map(p => p.category)));
  const categories = ['all', ...uniqueCategories];

  // Loading
  if (loading) {
    return <Loading message="Cargando productos increíbles..." size="lg" />;
  }

  // Error
  if (error) {
    return (
      <div className="text-center py-20">
        <h1 className="text-2xl font-bold mb-4">❌ Error al cargar productos</h1>
        <p className="text-gray-600 mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="bg-lime-500 hover:bg-lime-600 px-6 py-2 rounded-xl font-bold text-white shadow-md transition"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">    
      <section className="py-12">
        <div className="container mx-auto px-6">

          {/* 🔎 FILTROS */}
          <div className="bg-white rounded-3xl shadow-lg p-6 mb-8 flex flex-col lg:flex-row gap-6 items-center">
            
            {/* Buscar */}
            <input
              type="text"
              placeholder="🔍 Buscar productos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 pl-4 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-lime-500 shadow-sm"
            />

            {/* Categoría */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="py-3 px-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-lime-500 shadow-sm"
            >
              <option value="all">Todas</option>
              {uniqueCategories.map(cat => (
                <option key={cat} value={cat}>{getCategoryLabel(cat)}</option>
              ))}
            </select>

            {/* Ordenar */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="py-3 px-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-lime-500 shadow-sm"
            >
              <option value="name">Ordenar por nombre</option>
              <option value="price-low">Precio: menor a mayor</option>
              <option value="price-high">Precio: mayor a menor</option>
            </select>

            {/* Vista grid/list */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-xl ${viewMode === 'grid' ? 'bg-lime-500 text-white' : 'bg-gray-100 text-gray-600'} shadow-md transition`}
              >
                <Grid size={20} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-xl ${viewMode === 'list' ? 'bg-lime-500 text-white' : 'bg-gray-100 text-gray-600'} shadow-md transition`}
              >
                <List size={20} />
              </button>
            </div>
          </div>

          {/* Contador de resultados */}
          <div className="mb-6">
            <p className="text-gray-600">
              {filteredProducts.length} producto{filteredProducts.length !== 1 ? 's' : ''} encontrado{filteredProducts.length !== 1 ? 's' : ''}
              {selectedCategory !== 'all' && ` en ${getCategoryLabel(selectedCategory)}`}
              {searchTerm && ` para "${searchTerm}"`}
            </p>
          </div>

          {/* 🛒 Productos */}
          {filteredProducts.length === 0 ? (
            <div className="text-center py-20">
              <h3 className="text-2xl font-bold mb-4">No se encontraron productos</h3>
              <p className="text-gray-600 mb-6">
                {searchTerm || selectedCategory !== 'all' 
                  ? 'Prueba ajustando los filtros de búsqueda'
                  : 'No hay productos disponibles en este momento'
                }
              </p>
              <button
                onClick={() => { setSearchTerm(''); setSelectedCategory('all'); }}
                className="bg-lime-500 hover:bg-lime-600 px-6 py-2 rounded-xl font-bold text-white shadow-md transition"
              >
                Ver todos los productos
              </button>
            </div>
          ) : (
            <div
              className={
                viewMode === 'grid'
                  ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"
                  : "space-y-6"
              }
            >
              {filteredProducts.map(normalizedProduct => {
                // Buscar el producto original completo
                const originalProduct = products.find(p => p._id === normalizedProduct.id);
                if (!originalProduct) return null;
                
                return (
                  <ProductCard 
                    key={normalizedProduct.id} 
                    product={originalProduct}
                  />
                );
              })}
            </div>
          )}

          {/* Información adicional si hay productos */}
          {filteredProducts.length > 0 && (
            <div className="mt-12 text-center">
              <div className="text-sm text-gray-500">
                Mostrando {filteredProducts.length} de {products.length} productos disponibles
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default ProductsPage;