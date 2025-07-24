import { Clock, ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { signOut } from '@lib/supabase/auth'
import Aurora from '@shared/components/ui/Aurora'
import FadeContent from '@shared/components/ui/FadeContent'

function PendingApprovalPage() {
  const navigate = useNavigate()

  const handleLogout = async () => {
    await signOut()
    navigate('/')
  }

  return (
    <div className="w-screen h-screen relative overflow-hidden bg-gradient-to-br from-black via-black to-black">
      {/* Aurora Background with New Color Palette */}
      <Aurora colorStops={['#ec4699', '#750c41', '#ec4699']} blend={0.7} amplitude={1.3} speed={0.3} />

      {/* Content Container with FadeContent Animation */}
      <div className="relative z-10 w-screen h-screen bg-gradient-to-br from-black/20 via-transparent to-black/30 flex items-center justify-center">
        <FadeContent
          blur={true}
          duration={1000}
          easing="ease-out"
          initialOpacity={0}
          delay={200}
          className="w-full h-full flex items-center justify-center"
        >
          <div className="flex flex-col items-center justify-center dark:bg-background bg-slate-950 p-8 rounded-none md:rounded-xl w-screen h-screen md:h-auto md:w-full md:max-w-md shadow-2xl border border-slate-700/50">
            <div className="text-center mb-6 flex flex-col items-center justify-center">
              <div className="p-4 bg-orange-500 rounded-full mb-4 shadow-lg">
                <Clock className="text-white size-12" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">Cuenta Pendiente de Aprobación</h1>
              <p className="text-slate-300 text-center">
                Tu cuenta está pendiente de aprobación por un administrador.
              </p>
            </div>

            <div className="w-full mb-6">
              <div className="bg-orange-900/50 border border-orange-700/50 text-orange-200 px-4 py-3 rounded mb-4">
                <p className="text-sm">
                  Aunque hayas verificado tu correo electrónico, necesitas la aprobación de un administrador para acceder al sistema.
                </p>
              </div>

              <div className="space-y-4 text-slate-300 text-sm">
                <p>
                  <strong>¿Qué significa esto?</strong>
                </p>
                <ul className="list-disc list-inside space-y-2">
                  <li>Tu cuenta ha sido creada correctamente</li>
                  <li>Un administrador debe aprobar tu acceso al sistema</li>
                  <li>Recibirás acceso una vez que tu cuenta sea aprobada</li>
                  <li>Puedes contactar al administrador para acelerar el proceso</li>
                </ul>
              </div>
            </div>

            <div className="text-center space-y-3">
              <button
                onClick={handleLogout}
                className="flex items-center justify-center gap-2 text-sm text-purple-400 hover:text-purple-300 transition-colors mx-auto"
              >
                <ArrowLeft size={16} />
                Cerrar sesión e intentar más tarde
              </button>
            </div>
          </div>
        </FadeContent>
      </div>
    </div>
  )
}

export default PendingApprovalPage