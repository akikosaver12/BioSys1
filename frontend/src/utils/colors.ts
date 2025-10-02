export const colors = {
  // Colores principales
  primary: {
    lime: '#9EFF00',      // Verde lima vibrante (botón principal)
    limeHover: '#8FE600', // Verde lima hover
    limeDark: '#7DD400',  // Verde lima oscuro
  },
  
  // Colores de fondo
  background: {
    main: '#F5F7FA',      // Gris claro suave (fondo principal)
    card: '#FFFFFF',      // Blanco puro (tarjetas)
    cardHover: '#FAFBFC', // Blanco con tinte gris (hover)
    overlay: 'rgba(0, 0, 0, 0.05)', // Overlay sutil
  },
  
  // Colores de texto
  text: {
    primary: '#1A1D29',   // Negro intenso
    secondary: '#6B7280', // Gris medio
    light: '#9CA3AF',     // Gris claro
    white: '#FFFFFF',     // Blanco puro
  },
  
  // Colores de acento (del diseño)
  accent: {
    blue: '#3B82F6',      // Azul
    orange: '#F97316',    // Naranja
    green: '#10B981',     // Verde
    red: '#EF4444',       // Rojo
    cyan: '#06B6D4',      // Cyan
    purple: '#8B5CF6',    // Púrpura
  },
  
  // Estados y feedback
  state: {
    success: '#10B981',   // Verde éxito
    warning: '#F59E0B',   // Amarillo advertencia
    error: '#EF4444',     // Rojo error
    info: '#3B82F6',      // Azul información
  },
  
  // Bordes y sombras
  border: {
    light: '#E5E7EB',     // Borde claro
    medium: '#D1D5DB',    // Borde medio
    dark: '#9CA3AF',      // Borde oscuro
  },
  
  // Sombras (para usar en box-shadow)
  shadow: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    card: '0 4px 12px rgba(0, 0, 0, 0.08)', // Sombra específica para cards
  }
};

// Clases de Tailwind CSS personalizadas para usar con los colores
export const tailwindClasses = {
  // Botones principales
  primaryButton: 'bg-lime-400 hover:bg-lime-500 text-black font-semibold py-3 px-6 rounded-2xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02]',
  
  // Cards
  card: 'bg-white rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden',
  cardHover: 'hover:bg-gray-50 hover:-translate-y-1',
  
  // Texto
  headingPrimary: 'text-gray-900 font-bold',
  textSecondary: 'text-gray-600',
  textLight: 'text-gray-400',
  
  // Contenedores
  container: 'bg-gray-50 min-h-screen',
  section: 'py-12 px-4',
  
  // Inputs
  input: 'w-full px-4 py-3 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-lime-400 focus:border-transparent transition-all duration-200',
  
  // Badges/Pills
  badge: 'inline-flex items-center px-3 py-1 rounded-full text-sm font-medium',
};

// Función helper para generar gradientes
export const gradients = {
  hero: 'bg-gradient-to-br from-gray-50 via-white to-gray-100',
  card: 'bg-gradient-to-br from-white to-gray-50',
  button: 'bg-gradient-to-r from-lime-400 to-lime-500',
  accent: 'bg-gradient-to-r from-blue-500 via-purple-500 to-cyan-500',
};