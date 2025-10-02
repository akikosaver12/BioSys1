import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Product, BackendProduct } from '../../types/Product';
import { useCart } from '../../contexts/CartContext';

const BASE_URL = "http://localhost:5000";

const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { dispatch } = useCart();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0);
  const [quantity, setQuantity] = useState<number>(1);

  // Fetch del producto
  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) {
        setError('ID de producto no válido');
        setLoading(false);
        return;
      }

      try {
        const token = localStorage.getItem("token");

        const headers: HeadersInit = {
          "Content-Type": "application/json",
        };

        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }

        const response = await fetch(`${BASE_URL}/api/productos/${id}`, {
          headers,
        });
        
        if (!response.ok) {
          throw new Error('Producto no encontrado');
        }
        
        const backendData: BackendProduct = await response.json();
        
        // Normalizar el producto individual
        const productData: Product = {
          ...backendData,
          id: backendData._id,
          name: backendData.nombre,
          description: backendData.descripcion,
          price: backendData.precio,
          category: backendData.categoria,
          image: backendData.imagen,
        };
        
        setProduct(productData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar el producto');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  // Formateador para pesos colombianos
  const formatCOP = (value: number): string =>
    new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(value);

  // Mapear categorías a español
  const getCategoryLabel = (categoria: string): string => {
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

  const handleAddToCart = () => {
    if (!product) return;
    
    for (let i = 0; i < quantity; i++) {
      dispatch({ 
        type: 'ADD_TO_CART', 
        payload: { 
          ...product, 
          image: product.image ?? 'https://via.placeholder.com/600?text=Producto',
          imagen: product.imagen ?? 'https://via.placeholder.com/600?text=Producto'
        } 
      });
    }

    // Mostrar confirmación visual
    const button = document.getElementById('add-to-cart-btn');
    if (button) {
      const originalText = button.textContent;
      button.textContent = '¡Agregado!';
      button.classList.add('bg-green-500', 'hover:bg-green-600');
      setTimeout(() => {
        if (button.textContent === '¡Agregado!') {
          button.textContent = originalText;
          button.classList.remove('bg-green-500', 'hover:bg-green-600');
        }
      }, 2000);
    }
  };

  const handleBuyNow = () => {
    handleAddToCart();
    navigate('/cart');
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const target = e.target as HTMLImageElement;
    target.src = 'https://via.placeholder.com/600?text=Producto';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            {error || 'Producto no encontrado'}
          </h2>
          <button
            onClick={() => navigate('/products')}
            className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors"
          >
            Ver todos los productos
          </button>
        </div>
      </div>
    );
  }

  const isAvailable = product.activo && product.stock > 0;
  const images: string[] = [product.imagen || 'https://via.placeholder.com/600?text=Producto'];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <nav className="flex text-sm text-gray-500">
            <button onClick={() => navigate('/')} className="hover:text-purple-600">
              Inicio
            </button>
            <span className="mx-2">›</span>
            <button onClick={() => navigate('/products')} className="hover:text-purple-600">
              Productos
            </button>
            <span className="mx-2">›</span>
            <span className="text-gray-800">{getCategoryLabel(product.categoria)}</span>
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="lg:flex">
            
            {/* SECCIÓN DE IMÁGENES */}
            <div className="lg:w-1/2 p-6">
              <div className="space-y-4">
                {/* Imagen principal */}
                <div className="aspect-square bg-gray-100 rounded-xl overflow-hidden">
                  <img
                    src={images[selectedImageIndex]}
                    alt={product.nombre}
                    className="w-full h-full object-cover"
                    onError={handleImageError}
                  />
                </div>

                {/* Thumbnails (si hubiera múltiples imágenes) */}
                <div className="flex space-x-2">
                  {images.map((img: string, index: number) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImageIndex(index)}
                      className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                        selectedImageIndex === index
                          ? 'border-purple-500'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <img
                        src={img}
                        alt={`${product.nombre} ${index + 1}`}
                        className="w-full h-full object-cover"
                        onError={handleImageError}
                      />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* SECCIÓN DE INFORMACIÓN */}
            <div className="lg:w-1/2 p-6 lg:pl-8">
              
              {/* Badges */}
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium">
                  {getCategoryLabel(product.categoria)}
                </span>
                
                {product.envioGratis && (
                  <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                    🚚 Envío Gratis
                  </span>
                )}
                
                {product.garantia?.tiene && (
                  <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                    🛡️ Garantía {product.garantia.meses} {product.garantia.meses === 1 ? 'mes' : 'meses'}
                  </span>
                )}
              </div>

              {/* Título */}
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                {product.nombre}
              </h1>

              {/* Rating */}
              <div className="flex items-center space-x-2 mb-6">
                <div className="flex space-x-1">
                  {[...Array(5)].map((_, i: number) => (
                    <svg key={i} className="w-5 h-5 text-yellow-400 fill-current" viewBox="0 0 20 20">
                      <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"/>
                    </svg>
                  ))}
                </div>
                <span className="text-gray-600">(4.8) • +100 vendidos</span>
              </div>

              {/* Precio */}
              <div className="mb-6">
                <div className="text-4xl font-bold text-gray-900 mb-2">
                  {formatCOP(product.precio)}
                </div>
                <div className="text-green-600 font-medium">
                  {product.envioGratis ? 'Llega gratis mañana' : 'Envío disponible'}
                </div>
              </div>

              {/* Stock */}
              <div className="mb-6">
                <div className="flex items-center space-x-2 mb-2">
                  <div className={`w-3 h-3 rounded-full ${
                    product.stock > 10 ? 'bg-green-500' : 
                    product.stock > 0 ? 'bg-yellow-500' : 
                    'bg-red-500'
                  }`}></div>
                  <span className={`font-medium ${
                    product.stock > 10 ? 'text-green-600' : 
                    product.stock > 0 ? 'text-yellow-600' : 
                    'text-red-600'
                  }`}>
                    {product.stock > 10 ? 'Stock disponible' : 
                     product.stock > 0 ? `Solo ${product.stock} disponibles` : 
                     'Agotado'}
                  </span>
                </div>
                
                {isAvailable && (
                  <div className="text-sm text-gray-600">
                    Almacenado y enviado por 🐾 Clínica Veterinaria
                  </div>
                )}
              </div>

              {/* Cantidad */}
              {isAvailable && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cantidad: 
                    <span className="ml-2 font-bold">{quantity} unidad{quantity > 1 ? 'es' : ''}</span>
                    <span className="ml-2 text-gray-500">({Math.min(product.stock, 50)} disponibles)</span>
                  </label>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={quantity <= 1}
                      className="w-10 h-10 border border-gray-300 rounded-lg flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      −
                    </button>
                    <span className="w-12 text-center font-medium">{quantity}</span>
                    <button
                      onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                      disabled={quantity >= product.stock}
                      className="w-10 h-10 border border-gray-300 rounded-lg flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      +
                    </button>
                  </div>
                </div>
              )}

              {/* Botones de acción */}
              <div className="space-y-3 mb-8">
                <button
                  onClick={handleBuyNow}
                  disabled={!isAvailable}
                  className={`w-full py-4 px-6 rounded-xl font-bold text-lg transition-all ${
                    isAvailable
                      ? 'bg-blue-500 hover:bg-blue-600 text-white shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {isAvailable ? 'Comprar ahora' : 'No disponible'}
                </button>

                <button
                  id="add-to-cart-btn"
                  onClick={handleAddToCart}
                  disabled={!isAvailable}
                  className={`w-full py-4 px-6 rounded-xl font-bold text-lg transition-all border-2 ${
                    isAvailable
                      ? 'border-blue-500 text-blue-500 hover:bg-blue-50 transform hover:scale-[1.02] active:scale-[0.98]'
                      : 'border-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  Agregar al carrito
                </button>
              </div>

              {/* Información del vendedor */}
              <div className="bg-gray-50 rounded-xl p-4 mb-6">
                <h3 className="font-bold text-gray-900 mb-2">Vendido por</h3>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-purple-600">
                      {product.usuario?.name || 'Clínica Veterinaria'}
                    </div>
                    <div className="text-sm text-gray-600">+10mil ventas</div>
                  </div>
                </div>
              </div>

              {/* Garantía detallada */}
              {product.garantia?.tiene && product.garantia.descripcion && (
                <div className="bg-blue-50 rounded-xl p-4">
                  <h3 className="font-bold text-blue-900 mb-2 flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Garantía incluida
                  </h3>
                  <p className="text-blue-800 text-sm">
                    {product.garantia.descripcion}
                  </p>
                  <div className="text-xs text-blue-600 mt-2">
                    Vigencia: {product.garantia.meses} {product.garantia.meses === 1 ? 'mes' : 'meses'}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* SECCIÓN DE DESCRIPCIÓN DETALLADA */}
          <div className="border-t bg-white p-6">
            <div className="max-w-4xl">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Descripción del producto</h2>
              <div className="prose max-w-none text-gray-700">
                <p className="text-lg leading-relaxed">
                  {product.descripcion}
                </p>
                
                {/* Características destacadas */}
                <div className="mt-6 grid md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-bold text-gray-900 mb-2">Características</h3>
                    <ul className="space-y-1 text-sm text-gray-600">
                      <li>• Categoría: {getCategoryLabel(product.categoria)}</li>
                      <li>• Stock disponible: {product.stock} unidades</li>
                      {product.envioGratis && <li>• Envío gratuito incluido</li>}
                      {product.garantia?.tiene && (
                        <li>• Garantía de {product.garantia.meses} {product.garantia.meses === 1 ? 'mes' : 'meses'}</li>
                      )}
                    </ul>
                  </div>
                  
                  <div className="bg-green-50 rounded-lg p-4">
                    <h3 className="font-bold text-green-900 mb-2">Beneficios</h3>
                    <ul className="space-y-1 text-sm text-green-700">
                      <li>• Producto verificado</li>
                      <li>• Atención especializada</li>
                      <li>• Envío seguro</li>
                      <li>• Soporte post-venta</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Botón para volver */}
        <div className="mt-8 text-center">
          <button
            onClick={() => navigate('/products')}
            className="bg-purple-600 text-white px-8 py-3 rounded-xl font-medium hover:bg-purple-700 transition-colors"
          >
            ← Ver todos los productos
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;