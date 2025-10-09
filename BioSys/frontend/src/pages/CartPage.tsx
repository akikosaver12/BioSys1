import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';

const API_URL = process.env.REACT_APP_API_URL || "https://biosys1.onrender.com/api";

const CartPage: React.FC = () => {
  const { state: cartState, dispatch } = useCart();
  const [procesandoPago, setProcesandoPago] = useState(false);
  const [error, setError] = useState('');

  const updateQuantity = (id: string, quantity: number) => {
    if (!id || quantity < 1) return;
    dispatch({ type: 'UPDATE_QUANTITY', payload: { id, quantity } });
  };

  const removeFromCart = (id: string) => {
    if (!id) return;
    dispatch({ type: 'REMOVE_FROM_CART', payload: id });
  };

  const clearCartAction = () => {
    dispatch({ type: 'CLEAR_CART' });
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

  const clearCart = () => {
    if (window.confirm('¿Estás seguro de que quieres vaciar el carrito?')) {
      clearCartAction();
    }
  };

  const procesarPago = async () => {
    if (!cartState.items || cartState.items.length === 0) {
      setError('El carrito está vacío');
      return;
    }

    const itemsValidos = cartState.items.filter(item => item && item.id && item.name && item.price);
    if (itemsValidos.length === 0) {
      setError('No hay productos válidos en el carrito');
      return;
    }

    setProcesandoPago(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('Debes iniciar sesión para continuar');
        setProcesandoPago(false);
        return;
      }

      const items = itemsValidos.map(item => ({
        title: item.name,
        unit_price: item.price,
        quantity: item.quantity,
        description: `${getCategoryLabel(item.category)} - ${item.name}`,
        currency_id: 'COP'
      }));

      const userData = JSON.parse(localStorage.getItem('user') || '{}');

      const payer = {
        name: userData.name || 'Usuario',
        email: userData.email || 'user@example.com',
        phone: userData.telefono || '3001234567',
        address: {
          street_name: userData.direccion?.calle || 'Calle principal',
          street_number: 123,
          zip_code: '110111'
        }
      };

      const response = await fetch(`${API_URL}/crear-preferencia-pago`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ items, payer })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al procesar el pago');
      }

      const data = await response.json();
      
      const redirectUrl = data.init_point || data.sandbox_init_point;
      if (!redirectUrl) {
        throw new Error('No se recibió URL de pago válida del servidor');
      }
      
      window.location.href = redirectUrl;

    } catch (error) {
      console.error('Error procesando pago:', error);
      setError('Hubo un error al procesar el pago. Por favor intenta nuevamente.');
      setProcesandoPago(false);
    }
  };

  if (!cartState.isUserLoggedIn) {
    return (
      <div className="min-h-screen bg-gray-50 py-20">
        <div className="container mx-auto px-6">
          <div className="max-w-md mx-auto text-center">
            <div className="relative mb-8">
              <div className="w-32 h-32 mx-auto bg-gradient-to-br from-blue-100 to-purple-200 rounded-3xl flex items-center justify-center shadow-xl">
                <div className="text-6xl text-blue-500">🔒</div>
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-lime-400 rounded-full flex items-center justify-center animate-bounce">
                <span className="text-lg">🛒</span>
              </div>
            </div>
            
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Inicia sesión para usar tu carrito
            </h1>
            <p className="text-gray-600 mb-8 leading-relaxed">
              Para agregar productos a tu carrito y mantener tus compras guardadas, 
              necesitas tener una cuenta activa. ¡Es rápido y fácil!
            </p>
            
            <div className="space-y-4">
              <Link 
                to="/login" 
                className="block w-full bg-lime-400 hover:bg-lime-500 text-black font-bold py-4 px-6 rounded-2xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                🔑 Iniciar Sesión
              </Link>
              <Link 
                to="/products" 
                className="block w-full bg-white border-2 border-gray-200 hover:border-gray-300 text-gray-700 font-semibold py-4 px-6 rounded-2xl transition-all duration-200"
              >
                🛍️ Ver Productos
              </Link>
              <Link 
                to="/" 
                className="block w-full text-gray-500 hover:text-gray-700 font-medium py-2 transition-colors"
              >
                🏠 Volver al Inicio
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (cartState.items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-20">
        <div className="container mx-auto px-6">
          <div className="max-w-md mx-auto text-center">
            <div className="relative mb-8">
              <div className="w-32 h-32 mx-auto bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl flex items-center justify-center shadow-xl">
                <div className="text-6xl text-gray-400">🛒</div>
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-lime-400 rounded-full flex items-center justify-center animate-bounce">
                <span className="text-lg">💨</span>
              </div>
            </div>
            
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Tu carrito está vacío
            </h1>
            <p className="text-gray-600 mb-8 leading-relaxed">
              ¡No te preocupes! Tenemos productos increíbles esperándote. 
              Explora nuestra colección y encuentra algo que te encante.
            </p>
            
            <div className="space-y-4">
              <Link 
                to="/products" 
                className="block w-full bg-lime-400 hover:bg-lime-500 text-black font-bold py-4 px-6 rounded-2xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                🛍️ Explorar Productos
              </Link>
              <Link 
                to="/" 
                className="block w-full bg-white border-2 border-gray-200 hover:border-gray-300 text-gray-700 font-semibold py-4 px-6 rounded-2xl transition-all duration-200"
              >
                🏠 Volver al Inicio
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-6">
        
        <div className="mb-12">
          <nav className="mb-6">
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <Link to="/" className="hover:text-gray-700 transition-colors">Inicio</Link>
              <span>›</span>
              <span className="text-gray-900 font-medium">Carrito de Compras</span>
            </div>
          </nav>
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                🛒 Tu Carrito
              </h1>
              <p className="text-gray-600">
                {cartState.itemCount} {cartState.itemCount === 1 ? 'producto' : 'productos'} en tu carrito
              </p>
            </div>
            
            <button
              onClick={clearCart}
              className="flex items-center space-x-2 bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 font-medium py-3 px-4 rounded-xl transition-all duration-200 border border-red-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              <span>Vaciar Carrito</span>
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          
          <div className="xl:col-span-2 space-y-6">
            {cartState.items
              .filter(item => item && item.id)
              .map(item => (
              <div key={item.id} className="group bg-white rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300 p-6">
                <div className="flex flex-col sm:flex-row gap-6">
                  
                  <div className="flex-shrink-0">
                    <div className="w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl overflow-hidden">
                      {/* 🆕 IMAGEN BASE64 */}
                      <img 
                        src={item.image || 'https://via.placeholder.com/128?text=Producto'} 
                        alt={item.name} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        onError={(e) => {
                          e.currentTarget.src = 'https://via.placeholder.com/128?text=Producto';
                        }}
                      />
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-gray-700 transition-colors">
                          {item.name}
                        </h3>
                        
                        <div className="flex flex-wrap gap-3 mb-4">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                            {getCategoryLabel(item.category)}
                          </span>
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-600">
                            ✓ Disponible
                          </span>
                          {item.stock && item.stock <= 5 && (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-600">
                              Solo {item.stock} disponibles
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-baseline space-x-2 mb-4">
                          <span className="text-2xl font-bold text-gray-900">
                            {formatCOP(item.price)}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end space-y-4">
                        <div className="flex items-center space-x-3 bg-gray-50 rounded-xl p-1">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                            className="w-10 h-10 flex items-center justify-center text-gray-600 hover:text-gray-900 hover:bg-white rounded-lg transition-all duration-200 font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            −
                          </button>
                          <span className="w-12 text-center font-bold text-lg text-gray-900">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            disabled={!!item.stock && item.quantity >= item.stock}
                            className="w-10 h-10 flex items-center justify-center text-gray-600 hover:text-gray-900 hover:bg-white rounded-lg transition-all duration-200 font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            +
                          </button>
                        </div>
                        
                        <div className="text-right">
                          <p className="text-sm text-gray-500">Subtotal</p>
                          <p className="text-xl font-bold text-gray-900">
                            {formatCOP(item.price * item.quantity)}
                          </p>
                        </div>
                        
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="flex items-center space-x-2 text-red-500 hover:text-red-700 font-medium transition-colors duration-200"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          <span className="text-sm">Eliminar</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="xl:col-span-1">
            <div className="bg-white rounded-3xl shadow-lg p-8 sticky top-24">
              
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  📋 Resumen del Pedido
                </h2>
                <p className="text-gray-600">
                  Revisa tu orden antes de proceder
                </p>
              </div>
              
              <div className="space-y-4 mb-8">
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-600">Productos ({cartState.itemCount})</span>
                  <span className="font-semibold text-gray-900">
                    {formatCOP(cartState.total)}
                  </span>
                </div>
                
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-600">Envío</span>
                  <div className="text-right">
                    <span className="font-semibold text-green-600">GRATIS</span>
                    <p className="text-xs text-gray-500">En compras +{formatCOP(100000)}</p>
                  </div>
                </div>
                
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-600">IVA incluido</span>
                  <span className="font-semibold text-gray-600">
                    {formatCOP(cartState.total * 0.19)}
                  </span>
                </div>
                
                <hr className="border-gray-200" />
                
                <div className="flex justify-between items-center py-2">
                  <span className="text-xl font-bold text-gray-900">Total</span>
                  <span className="text-2xl font-bold text-gray-900">
                    {formatCOP(cartState.total)}
                  </span>
                </div>
              </div>
              
              <div className="mb-8">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Código de descuento
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Ingresa tu código"
                    className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-lime-400 focus:border-transparent transition-all duration-200 outline-none"
                  />
                  <button className="bg-gray-900 text-white px-4 py-3 rounded-xl hover:bg-gray-800 transition-all duration-200 font-medium">
                    Aplicar
                  </button>
                </div>
              </div>
              
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                  {error}
                </div>
              )}
              
              <div className="space-y-4">
                <button 
                  onClick={procesarPago}
                  disabled={procesandoPago}
                  className="w-full bg-lime-400 hover:bg-lime-500 text-black font-bold py-4 px-6 rounded-2xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02] flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {procesandoPago ? (
                    <>
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                      </svg>
                      <span>Procesando...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      </svg>
                      <span>Pagar con Mercado Pago</span>
                    </>
                  )}
                </button>
                
                <Link 
                  to="/products"
                  className="block w-full text-center bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-4 px-6 rounded-2xl transition-all duration-200"
                >
                  🛍️ Seguir Comprando
                </Link>
              </div>
              
              <div className="mt-8 pt-6 border-t border-gray-100">
                <div className="space-y-3">
                  {[
                    { icon: '🔒', text: 'Pago 100% seguro' },
                    { icon: '💳', text: 'Mercado Pago protege tus datos' },
                    { icon: '🚚', text: 'Envío gratis en 24-48h' },
                    { icon: '↩️', text: 'Devoluciones fáciles' }
                  ].map(({ icon, text }) => (
                    <div key={text} className="flex items-center space-x-3">
                      <span className="text-lg">{icon}</span>
                      <span className="text-sm text-gray-600">{text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;