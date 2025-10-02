export const brandConfig = {
  // INFORMACIÓN BÁSICA DE LA MARCA
  name: 'Tus mascota',           // Reemplazar con tu nombre
  slogan: 'la salud de tu mascota es nuestra pioridada',         // Reemplazar con tu slogan
  
  // LOGO E IMÁGENES
  logo: {
    icon: '🛍️',                     // Emoji temporal (puedes cambiarlo)
    url: '/logo.png',               // Si tienes logo, poner ruta aquí
    alt: 'TU_NOMBRE_AQUÍ Logo'      // Texto alternativo
  },
  
  // INFORMACIÓN DE CONTACTO
  contact: {
    email: 'info@tunombre.com',     // Tu email (real o simulado)
    phone: '+1 (555) 123-4567',     // Tu teléfono (real o simulado)
    whatsapp: '+1555123467',        // WhatsApp sin espacios ni símbolos
    address: {
      street: 'Calle Principal #123',
      city: 'Tu Ciudad',
      country: 'Tu País',
      zipCode: '12345'
    }
  },
  
  // REDES SOCIALES
  social: {
    facebook: 'https://facebook.com/tunombre',
    instagram: 'https://instagram.com/tunombre',
    twitter: 'https://twitter.com/tunombre',
    linkedin: 'https://linkedin.com/company/tunombre'
  },
  
  // INFORMACIÓN EMPRESARIAL 
company: {
  description: '“Somos una clínica veterinaria altamente capacitada, dedicada al cuidado integral de tu mascota. Contamos con un equipo profesional, tecnología moderna y un servicio cercano para garantizar salud, bienestar y calidad de vida a tus compañeros de cuatro patas”',
  mission: 'cuidar',
  vision: 'Siempre mantener a familias unidas',
},

  
  // CONFIGURACIÓN DE NEGOCIO
  business: {
    currency: 'USD',
    freeShippingThreshold: 100,     // Envío gratis desde este monto
    returnDays: 30,                 // Días para devoluciones
    warrantyYears: 2,               // Años de garantía
    supportHours: 'Lun - Vie: 9AM - 6PM'
  }
};