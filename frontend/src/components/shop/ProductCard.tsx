import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Product } from '../../hooks/useProducts'; 
import { useCart } from '../../contexts/CartContext';

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addToCart } = useCart(); // Usar la función addToCart en lugar de dispatch
  const navigate = useNavigate();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Usar addToCart que maneja la verificación de autenticación
    const success = addToCart(product);
    
    if (success) {
      const button = document.getElementById(`add-btn-${product._id}`);
      if (button) {
        button.classList.add('animate-pulse');
        setTimeout(() => button.classList.remove('animate-pulse'), 600);
      }
    }
  };

  const handleCardClick = () => {
    navigate(`/product/${product._id}`);
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    console.log('Producto agregado/removido de favoritos:', product.nombre);
  };

  const formatCOP = (value: number) =>
    new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(value);

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

  const isAvailable = product.activo && product.stock > 0;

  const getFeatures = () => {
    const features = [];
    
    if (product.garantia?.tiene) {
      const meses = product.garantia.meses;
      if (meses >= 12) {
        const años = Math.floor(meses / 12);
        const mesesRestantes = meses % 12;
        if (años === 1 && mesesRestantes === 0) {
          features.push('Garantía 1 año');
        } else if (mesesRestantes === 0) {
          features.push(`Garantía ${años} años`);
        } else {
          features.push(`Garantía ${años}a ${mesesRestantes}m`);
        }
      } else {
        features.push(`Garantía ${meses} meses`);
      }
    }
    
    if (product.envioGratis) {
      features.push('Envío gratis');
    }
    
    return features;
  };

  const features = getFeatures();

  return (
    <div 
      onClick={handleCardClick}
      className="group bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden transform hover:-translate-y-2 border border-gray-100 relative cursor-pointer"
    >
      
      {/* IMAGEN DEL PRODUCTO */}
      <div className="relative overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
        <img
          src={product.imagen || 'https://via.placeholder.com/400?text=Producto'}
          alt={product.nombre}
          className="w-full h-64 object-cover"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = 'https://via.placeholder.com/400?text=Producto';
          }}
        />

        {/* OVERLAY */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

        {/* BADGE CATEGORÍA */}
        <div className="absolute top-4 left-4">
          <span className="bg-white/90 backdrop-blur-sm text-gray-700 px-3 py-1 rounded-full text-sm font-medium shadow-lg">
            {getCategoryLabel(product.categoria)}
          </span>
        </div>

        {/* BADGES ESPECIALES - Basados en datos reales */}
        <div className="absolute top-4 right-4 flex flex-col space-y-2">
          {product.envioGratis && (
            <span className="bg-green-500/90 backdrop-blur-sm text-white px-2 py-1 rounded-full text-xs font-bold shadow-lg">
              🚚 Envío Gratis
            </span>
          )}
          
          {product.garantia?.tiene && (
            <span className="bg-blue-500/90 backdrop-blur-sm text-white px-2 py-1 rounded-full text-xs font-bold shadow-lg">
              🛡️ Garantía
            </span>
          )}
        </div>

        {/* BADGE STOCK BAJO */}
        {product.stock <= 5 && product.stock > 0 && (
          <div className="absolute bottom-4 left-4">
            <span className="bg-orange-500/90 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
              ¡Últimas {product.stock} unidades!
            </span>
          </div>
        )}

        {/* BADGE SIN STOCK */}
        {product.stock === 0 && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="bg-red-600 text-white px-4 py-2 rounded-full text-sm font-bold">
              Agotado
            </span>
          </div>
        )}

        {/* FAVORITO */}
        <button 
          onClick={handleFavoriteClick}
          className="absolute top-4 right-4 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-white hover:scale-110 z-10"
        >
          <svg className="w-5 h-5 text-gray-600 hover:text-red-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </button>

        {/* BOTÓN VER DETALLES - Aparece en hover */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
          <span className="bg-black/70 text-white px-4 py-2 rounded-full text-sm font-medium backdrop-blur-sm">
            Ver detalles
          </span>
        </div>
      </div>

      {/* INFORMACIÓN DEL PRODUCTO */}
      <div className="p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-gray-700 transition-colors line-clamp-2">
          {product.nombre}
        </h3>

        {/* DESCRIPCIÓN */}
        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
          {product.descripcion}
        </p>

        {/* RATING */}
        <div className="flex items-center space-x-2 mb-3">
          <div className="flex space-x-1">
            {[...Array(5)].map((_, i) => (
              <svg key={i} className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
                <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"/>
              </svg>
            ))}
          </div>
          <span className="text-sm text-gray-500">(4.8)</span>
        </div>

        {/* PRECIO - Solo precio real, sin descuentos falsos */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <span className="text-2xl font-bold text-gray-900">
              {formatCOP(product.precio)}
            </span>
          </div>
        </div>

        {/* FEATURES - Basadas en datos reales */}
        {features.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {features.map((feature, index) => (
              <span key={index} className="bg-gray-100 text-gray-600 px-2 py-1 rounded-lg text-xs font-medium">
                {feature}
              </span>
            ))}
          </div>
        )}

        {/* STOCK INDICATOR */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${
              product.stock > 10 ? 'bg-green-500' : 
              product.stock > 0 ? 'bg-yellow-500' : 
              'bg-red-500'
            }`}></div>
            <span className={`text-xs font-medium ${
              product.stock > 10 ? 'text-green-600' : 
              product.stock > 0 ? 'text-yellow-600' : 
              'text-red-600'
            }`}>
              {product.stock > 10 ? 'En stock' : 
               product.stock > 0 ? `Solo ${product.stock} disponibles` : 
               'Agotado'}
            </span>
          </div>
          
          {/* INFO DEL VENDEDOR */}
          <div className="text-xs text-gray-400">
            Por: {product.usuario?.name || 'Vendedor'}
          </div>
        </div>

        {/* BOTONES DE ACCIÓN */}
        <div className="flex space-x-2">
          {/* BOTÓN VER DETALLES */}
          <button
            onClick={handleCardClick}
            className="flex-1 font-medium py-3 px-4 rounded-2xl border-2 border-purple-200 text-purple-600 hover:bg-purple-50 hover:border-purple-300 transition-all duration-200 shadow-sm transform active:scale-[0.98] flex items-center justify-center space-x-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            <span className="hidden sm:inline">Ver más</span>
          </button>

          {/* BOTÓN AGREGAR AL CARRITO */}
          <button
            id={`add-btn-${product._id}`}
            onClick={handleAddToCart}
            disabled={!isAvailable}
            className={`flex-1 font-bold py-3 px-4 rounded-2xl transition-all duration-200 shadow-lg transform active:scale-[0.98] flex items-center justify-center space-x-2 ${
              isAvailable
                ? 'bg-lime-400 hover:bg-lime-500 text-black hover:shadow-xl hover:scale-[1.02]'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.5 4H19m-10-4v6a2 2 0 104 0v-6m-4 0h4" />
            </svg>
            <span className="hidden sm:inline">
              {!isAvailable ? 'No disponible' : 'Carrito'}
            </span>
          </button>
        </div>

        {/* INFORMACIÓN ADICIONAL DE GARANTÍA */}
        {product.garantia?.tiene && product.garantia.descripcion && (
          <div className="mt-3 p-2 bg-blue-50 rounded-lg">
            <p className="text-xs text-blue-700">
              <span className="font-medium">Garantía:</span> {product.garantia.descripcion}
            </p>
          </div>
        )}
      </div>

      {/* EFECTO HOVER */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
      </div>
    </div>
  );
};

export default ProductCard;