import React from 'react';
import Header from './Header';
import Footer from './Footer';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* HEADER: Siempre arriba con sombra sutil */}
      <Header />
      
      {/* CONTENIDO PRINCIPAL: Fondo moderno y espaciado */}
      <main className="flex-1 relative">
        {/* Patrón de fondo sutil */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute inset-0" 
               style={{
                 backgroundImage: `radial-gradient(circle at 25% 25%, rgba(159, 255, 0, 0.1) 0%, transparent 50%),
                                  radial-gradient(circle at 75% 75%, rgba(59, 130, 246, 0.1) 0%, transparent 50%)`
               }}>
          </div>
        </div>
        
        {/* Contenido real */}
        <div className="relative z-10">
          {children}
        </div>
      </main>
      
      {/* FOOTER: Siempre abajo */}
      <Footer />
    </div>
  );
};

export default Layout;