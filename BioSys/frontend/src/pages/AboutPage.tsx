import React from 'react'; 
import { Link } from 'react-router-dom';
import { brandConfig } from '../utils/brandConfig';

const AboutPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      
      {/* HERO DE ABOUT */}
      <section className="bg-gradient-to-br from-white via-gray-50 to-gray-100 py-16">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-4xl mx-auto">
            
            {/* BADGE */}
            <div className="inline-flex items-center space-x-2 bg-lime-100 text-lime-800 rounded-full px-4 py-2 mb-6">
              <span className="text-lg">🏢</span>
              <span className="font-medium">Nuestra Historia</span>
            </div>
            
            {/* TÍTULO */}
            <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
              Acerca de <span className="text-[TU_COLOR_PRINCIPAL]">{brandConfig.name}</span>
            </h1>
            
            {/* SUBTÍTULO */}
            <p className="text-xl text-gray-600 leading-relaxed">
              En nuestra veterinaria nos apasiona el cuidado y bienestar de cada mascota. Contamos con un equipo de profesionales comprometidos que brindan atención médica de calidad, acompañamiento personalizado y todo el cariño que tus compañeros de vida merecen.
              <br /><br />
              Ofrecemos servicios de consulta general, vacunación, desparasitación, cirugías, estética animal y asesoría en nutrición, siempre con la más alta dedicación y tecnología para garantizar la salud y felicidad de tu mejor amigo.
              <br /><br />
              Nuestra misión es ser más que una clínica: queremos ser un aliado de confianza para ti y tu mascota, construyendo juntos una vida llena de salud, amor y compañía. 🐾
            </p>
          </div>
        </div>
      </section>

      {/* NUESTRA HISTORIA */}
      <section className="py-16">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            
            <div className="bg-white rounded-3xl shadow-xl p-12">
              <div className="flex items-center space-x-3 mb-8">
                <div className="w-12 h-12 bg-lime-100 rounded-2xl flex items-center justify-center">
                  <span className="text-2xl">📖</span>
                </div>
                <h2 className="text-3xl font-bold text-gray-900">Nuestra Historia</h2>
              </div>
              
              <div className="prose prose-lg text-gray-600 max-w-none">
                <p className="mb-6 text-lg leading-relaxed">
                  Nuestra historia comenzó con un sueño: ofrecer un lugar en el que las mascotas recibieran no solo atención médica, sino también cariño y respeto. Iniciamos como un pequeño consultorio impulsado por la vocación y el amor hacia los animales, y poco a poco fuimos creciendo gracias a la confianza de cada familia que nos ha acompañado en el camino.
                  <br /><br />
                  Con dedicación y esfuerzo, hemos consolidado un equipo profesional comprometido con el bienestar animal y ampliado nuestros servicios para brindar una atención más completa. Hoy seguimos trabajando con la misma pasión del primer día, convencidos de que cada mascota merece vivir sana, feliz y rodeada de cuidado.
                </p>
                
                <p className="text-lg leading-relaxed">
                  Nuestro crecimiento se ha basado en tres pilares fundamentales: la confianza de nuestros clientes, la calidad de nuestros servicios y la constante innovación en el cuidado animal. Gracias al compromiso de nuestro equipo y a la implementación de nuevas tecnologías veterinarias, hemos logrado evolucionar sin perder la cercanía y el trato humano que nos caracteriza. Cada paso que damos está inspirado en el amor por las mascotas y en el deseo de ofrecerles siempre lo mejor.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CALL TO ACTION FINAL */}
      <section className="py-16 bg-gradient-to-br from-lime-400 via-lime-500 to-green-500 text-black">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            
            <div className="mb-8">
              <h2 className="text-4xl lg:text-5xl font-bold mb-4">
                Explora nuestro catalogo de productos
              </h2>
              
              <p className="text-xl leading-relaxed opacity-90">
                En nuestra veterinaria ofrecemos una amplia gama de productos diseñados para garantizar la salud, el bienestar y la felicidad de tus mascotas. Contamos con alimentos balanceados de alta calidad, suplementos nutricionales, productos de higiene y cuidado, juguetes interactivos y accesorios que se adaptan a las necesidades de cada etapa de vida.
                Cada producto es cuidadosamente seleccionado para asegurar que cumpla con los más altos estándares de calidad y confianza, porque sabemos que tu mascota es parte de tu familia.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                to="/products" 
                className="group bg-black text-white px-8 py-4 rounded-2xl font-bold hover:bg-gray-800 transition-all duration-200 shadow-xl hover:shadow-2xl transform hover:scale-105 flex items-center justify-center space-x-2"
              >
                <span>🛍️ Explorar Productos</span>
                <svg className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
              
              <Link 
                to="/contact" 
                className="bg-white text-black px-8 py-4 rounded-2xl font-bold hover:bg-gray-100 transition-all duration-200 shadow-xl hover:shadow-2xl transform hover:scale-105 flex items-center justify-center space-x-2"
              >
                <span>💬 Contáctanos</span>
              </Link>
            </div>
            
            <div className="mt-8 text-sm opacity-75">
              <p>🔒 Compra 100% segura • 🚚 Envío gratis • ↩️ Devoluciones fáciles</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;
