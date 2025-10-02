import React from 'react';
import { Link } from 'react-router-dom';
import { brandConfig } from '../../utils/brandConfig';

const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-gray-100">
      <div className="container mx-auto px-6 py-12">
        
        {/* CONTENIDO PRINCIPAL DEL FOOTER */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          
          {/* COLUMNA 1: INFORMACIÓN DE LA EMPRESA */}
          <div className="md:col-span-2">
  <div className="flex items-center space-x-3 mb-6">
    <div className="w-10 h-10 bg-gradient-to-br from-[TU_COLOR_PRINCIPAL] to-[TU_COLOR_HOVER] rounded-2xl flex items-center justify-center shadow-lg">
      <span className="text-xl font-bold text-white">{brandConfig.logo.icon}</span>
    </div>
    <div>
      <h3 className="text-xl font-bold text-gray-900">{brandConfig.name}</h3>
      <p className="text-sm text-gray-500">{brandConfig.slogan}</p>
    </div>
  </div>
  <p className="text-gray-600 leading-relaxed mb-6 max-w-md">
    {brandConfig.company.description}
  </p>
  
  {/* REDES SOCIALES ACTUALIZADAS */}
  <div className="flex space-x-4">
    <a href={brandConfig.social.facebook} className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-gray-600 hover:text-white transition-all duration-200 hover:bg-blue-500 transform hover:scale-105">
      <span className="text-lg">📘</span>
    </a>
    <a href={brandConfig.social.instagram} className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-gray-600 hover:text-white transition-all duration-200 hover:bg-pink-500 transform hover:scale-105">
      <span className="text-lg">📷</span>
    </a>
    <a href={brandConfig.social.twitter} className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-gray-600 hover:text-white transition-all duration-200 hover:bg-blue-400 transform hover:scale-105">
      <span className="text-lg">🐦</span>
    </a>
  </div>
</div>
          
          {/* COLUMNA 2: ENLACES RÁPIDOS */}
          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-6">Enlaces Rápidos</h4>
            <ul className="space-y-3">
              {[
                { to: '/', label: 'Inicio' },
                { to: '/products', label: 'Productos' },
                { to: '/about', label: 'Nosotros' },
                { to: '/contact', label: 'Contacto' }
              ].map(({ to, label }) => (
                <li key={to}>
                  <Link 
                    to={to} 
                    className="text-gray-600 hover:text-lime-500 transition-colors duration-200 hover:translate-x-1 transform inline-block"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
            
            {/* ENLACES ADICIONALES */}
            <h5 className="text-md font-semibold text-gray-900 mt-8 mb-4">Soporte</h5>
            <ul className="space-y-2">
              {['Centro de Ayuda', 'Términos de Servicio', 'Política de Privacidad'].map((item) => (
                <li key={item}>
                  <a href="#" className="text-gray-600 hover:text-lime-500 transition-colors duration-200 text-sm">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          
          {/* COLUMNA 3: INFORMACIÓN DE CONTACTO */}
          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-6">Contacto</h4>
            
            <div className="space-y-4">
              {[
                { icon: '📍', title: 'Dirección', content: 'Calle Principal #123\nCentro, Ciudad 12345' },
                { icon: '📞', title: 'Teléfono', content: '+1 (555) 123-4567' },
                { icon: '✉️', title: 'Email', content: 'info@mitienda.com' },
                { icon: '🕒', title: 'Horarios', content: 'Lun - Vie: 9AM - 6PM\nSáb: 10AM - 4PM' }
              ].map(({ icon, title, content }) => (
                <div key={title} className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-sm">{icon}</span>
                  </div>
                  <div>
                    <h6 className="font-medium text-gray-900 text-sm">{title}</h6>
                    <p className="text-gray-600 text-sm whitespace-pre-line">{content}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* LÍNEA SEPARADORA */}
        <div className="border-t border-gray-100 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            
            {/* COPYRIGHT */}
            <div className="text-center md:text-left">
              <p className="text-gray-600 text-sm">
                &copy; 2025 Mi Tienda Online. Todos los derechos reservados.
              </p>
              <p className="text-gray-500 text-xs mt-1">
                Desarrollado con ❤️ usando React + TypeScript + TailwindCSS
              </p>
            </div>
            
            {/* BADGES DE CONFIANZA */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 bg-gray-50 px-3 py-2 rounded-lg">
                <span className="text-green-500">🔒</span>
                <span className="text-xs font-medium text-gray-700">Compra Segura</span>
              </div>
              <div className="flex items-center space-x-2 bg-gray-50 px-3 py-2 rounded-lg">
                <span className="text-blue-500">🚚</span>
                <span className="text-xs font-medium text-gray-700">Envío Gratis</span>
              </div>
              <div className="flex items-center space-x-2 bg-gray-50 px-3 py-2 rounded-lg">
                <span className="text-lime-500">⭐</span>
                <span className="text-xs font-medium text-gray-700">99.8% Satisfacción</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;