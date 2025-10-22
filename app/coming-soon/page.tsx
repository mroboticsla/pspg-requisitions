import Image from 'next/image'

export default function ComingSoon() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-dark via-[#003558] to-[#004670] flex items-center justify-center px-4">
      <div className="max-w-4xl w-full text-center">
        {/* Logo */}
        <div className="mb-12 flex justify-center">
          <div className="relative">
            <Image 
              src="/images/logo-web-dark.png" 
              alt="PSP Group logo" 
              width={360} 
              height={120} 
              className="h-20 sm:h-24 w-auto object-contain filter brightness-0 invert" 
              priority
              quality={100}
              unoptimized
            />
          </div>
        </div>

        {/* Mensaje principal */}
        <div className="mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Próximamente
          </h2>
          <p className="text-xl md:text-2xl text-gray-200 mb-4">
            Estamos trabajando en algo increíble
          </p>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto">
            Nuestra nueva plataforma de gestión de requisiciones estará disponible muy pronto.
            Estamos poniendo los toques finales para ofrecerte la mejor experiencia.
          </p>
        </div>

        {/* Iconos decorativos */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 max-w-2xl mx-auto mb-12">
          <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-white/20 hover:bg-white/15 transition-all duration-300">
            <div className="text-4xl mb-3">🚀</div>
            <h3 className="text-white font-semibold mb-2">Innovación</h3>
            <p className="text-gray-300 text-sm">Tecnología de vanguardia</p>
          </div>
          <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-white/20 hover:bg-white/15 transition-all duration-300">
            <div className="text-4xl mb-3">⚡</div>
            <h3 className="text-white font-semibold mb-2">Rapidez</h3>
            <p className="text-gray-300 text-sm">Procesos optimizados</p>
          </div>
          <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-white/20 hover:bg-white/15 transition-all duration-300">
            <div className="text-4xl mb-3">🎯</div>
            <h3 className="text-white font-semibold mb-2">Precisión</h3>
            <p className="text-gray-300 text-sm">Gestión eficiente</p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-gray-300 text-sm">
          <p>© 2025 PSP Group. Todos los derechos reservados.</p>
        </div>
      </div>
    </div>
  )
}
