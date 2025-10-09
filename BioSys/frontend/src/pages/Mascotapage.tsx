
import Mascota from '../components/mascotas/infomacion';

const MascotaPage = () => {
  // component code here
  
  return (
    <section className="bg-gradient-to-br from-white via-gray-50 to-gray-100 py-16">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-4xl mx-auto">
            
           
            
            {/* TÍTULO */}
            <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
              Tu <span className="text-lime-500">Mascota</span>
            </h1>
            
            {/* SUBTÍTULO */}
            <p className="text-xl text-gray-600 leading-relaxed">
              el cuidado y bienestar de tu mascota es nuestra prioridad.
            </p>
          </div>
        </div>
        <Mascota />
      </section>

      
  );
}

export default MascotaPage;