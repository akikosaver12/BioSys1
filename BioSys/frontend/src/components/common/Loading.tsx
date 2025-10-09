import React from 'react';

interface LoadingProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
}

const Loading: React.FC<LoadingProps> = ({ 
  message = "Cargando...", 
  size = 'md' 
}) => {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-12 w-12',
    lg: 'h-16 w-16'
  };

  const containerClasses = {
    sm: 'p-4',
    md: 'p-8',
    lg: 'p-12'
  };

  return (
    <div className={`flex flex-col items-center justify-center ${containerClasses[size]}`}>
      {/* Spinner moderno con múltiples círculos */}
      <div className="relative">
        {/* Círculo exterior */}
        <div className={`${sizeClasses[size]} border-4 border-gray-200 rounded-full`}></div>
        
        {/* Círculo animado */}
        <div className={`absolute top-0 left-0 ${sizeClasses[size]} border-4 border-lime-400 border-t-transparent rounded-full animate-spin`}></div>
        
        {/* Círculo interior decorativo */}
        <div className={`absolute top-2 left-2 ${size === 'lg' ? 'h-12 w-12' : size === 'md' ? 'h-8 w-8' : 'h-4 w-4'} border-2 border-gray-300 border-b-transparent rounded-full animate-spin`} 
             style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}>
        </div>
      </div>
      
      {/* Mensaje de carga */}
      <p className="mt-4 text-gray-600 font-medium animate-pulse">
        {message}
      </p>
      
      {/* Dots animados */}
      <div className="flex space-x-1 mt-2">
        <div className="w-2 h-2 bg-lime-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
        <div className="w-2 h-2 bg-lime-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
        <div className="w-2 h-2 bg-lime-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
      </div>
    </div>
  );
};

export default Loading;