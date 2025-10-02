import React from 'react'; 
import { Link } from 'react-router-dom';
import { useProducts } from '../hooks/useProducts';
import ProductCard from '../components/shop/ProductCard';
import Loading from '../components/common/Loading';
import { brandConfig } from '../utils/brandConfig';

const HomePage: React.FC = () => {
  const { products, loading } = useProducts();
  const featuredProducts = products.slice(0, 3);

  return (
    <div className="bg-gray-50">
      
      {/* HERO SECTION */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        
        {/* FONDO ANIMADO */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-white via-gray-50 to-gray-100"></div>
          <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-br from-lime-400/20 to-lime-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-gradient-to-br from-blue-400/20 to-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>
        
        {/* CONTENIDO HERO */}
        <div className="relative z-10 container mx-auto px-6 py-20 text-center">
          <div className="inline-flex items-center space-x-2 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-full px-4 py-2 mb-8 shadow-lg">
            <span className="text-gray-800 font-semibold text-2xl lg:text-3xl">✨ Bienvenido ✨</span>

          </div>
                <h1 className="text-5xl lg:text-7xl font-serif font-extrabold text-gray-900 mb-6 leading-tight tracking-wide">
                 {brandConfig.name}
                </h1>

          <p className="text-lg lg:text-xl text-gray-700 mb-8 leading-relaxed max-w-3xl mx-auto font-serif italic tracking-wide">
             Somos una clínica veterinaria altamente capacitada, dedicada al cuidado integral de tu mascota. 
             Contamos con un equipo profesional, tecnología moderna y un servicio cercano para garantizar salud, 
             bienestar y calidad de vida a tus compañeros de cuatro patas.
          </p>

        </div>
      </section>

      {/* SECCIÓN EQUIPO VETERINARIO */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6 text-center">
       <div className="relative rounded-3xl shadow-2xl mb-6 overflow-hidden aspect-video max-w-xl mx-auto">
  <img 
    src="/img/equipo-veterinario.png" 
    alt="Equipo Veterinario" 
    className="w-full h-full object-cover"
  />
  <div className="absolute inset-0 bg-black/20"></div>
</div>





          <h3 className="text-2xl font-bold text-gray-900 mb-2">Equipo veterinario</h3>
          <p className="text-gray-600 mb-4">Personal altamente capacitado y listo para cuidar de tu mejor amigo</p>
          <div className="flex items-center justify-center space-x-1">
            {[...Array(5)].map((_, i) => (
              <svg key={i} className="w-5 h-5 text-yellow-400 fill-current" viewBox="0 0 20 20">
                <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"/>
              </svg>
            ))}
          </div>
        </div>
      </section>

      {/* SECCIÓN DE PRODUCTOS DESTACADOS */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <div className="inline-flex items-center space-x-2 bg-lime-100 text-lime-800 rounded-full px-4 py-2 mb-6">
              <span className="text-lg">⭐</span>
              <span className="font-medium">Productos Destacados</span>
              <span className="text-lg">⭐</span>
            </div>
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Los más <span className="text-lime-500">populares</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Descubre los productos más vendidos y mejor valorados por nuestra comunidad
            </p>
          </div>
          {loading ? (
            <div className="flex justify-center">
              <Loading message="Cargando productos increíbles..." size="lg" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredProducts.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
          <div className="text-center mt-12">
            <Link 
              to="/products" 
              className="inline-flex items-center space-x-2 bg-gray-900 text-white font-semibold py-4 px-8 rounded-2xl hover:bg-gray-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <span>Ver Todos los Productos</span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
