import { useState } from 'react'
import { Mail, RefreshCw, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react'
import { useAuth } from '@app/providers/AuthContext'
import { resendConfirmation, signOut } from '@lib/supabase/auth'
import { useNavigate } from 'react-router-dom'
import Aurora from '@shared/components/ui/Aurora'
import FadeContent from '@shared/components/ui/FadeContent'

function EmailVerificationNotice() {
	const { user } = useAuth()
	const [checkingVerification] = useState(false)
	const [message, setMessage] = useState('')
	const [error, setError] = useState('')
	const [loading, setLoading] = useState(false)
	const navigate = useNavigate()

	const handleResendVerification = async () => {
		if (!user?.email) return

		try {
			setMessage('')
			setError('')
			setLoading(true)

			console.log('Resending verification email to:', user.email)

			const { error: resendError } = await resendConfirmation(user.email)

			if (resendError) {
				console.error('Resend error:', resendError)
				if (resendError.message.includes('For security purposes') || resendError.message.includes('rate limit')) {
					setError('Demasiados intentos. Espera un momento antes de intentar de nuevo.')
				} else if (resendError.message.includes('already confirmed')) {
					setMessage('Tu email ya está verificado. Intenta iniciar sesión.')
				} else if (resendError.message.includes('Email rate limit exceeded')) {
					setError('Límite de correos alcanzado. Espera un momento antes de intentar de nuevo.')
				} else {
					setError('Error al enviar el correo de verificación. Inténtalo de nuevo.')
				}
				return
			}

			setMessage('Correo de verificación enviado. Revisa tu bandeja de entrada y carpeta de spam.')
		} catch (err: any) {
			console.error('Resend verification error:', err)
			setError('Error al enviar el correo de verificación. Inténtalo de nuevo.')
		} finally {
			// CRITICAL: Always reset loading state
			setLoading(false)
		}
	}

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
							<div className="p-4 bg-[#9e1157] rounded-full mb-4 shadow-lg">
								<Mail className="text-white size-12" />
							</div>
							<h1 className="text-2xl font-bold text-white mb-2">Verifica tu Correo Electrónico</h1>
							<p className="text-slate-300 text-center">
								Por favor verifica tu dirección de correo electrónico para continuar.
							</p>
						</div>

						<div className="w-full mb-6">
							<div className="bg-blue-900/50 border border-blue-700/50 text-blue-200 px-4 py-3 rounded mb-4">
								<p className="text-sm">
									Hemos enviado un correo de verificación a: <br />
									<strong>{user?.email}</strong>
								</p>
							</div>

							{error && (
								<div className="bg-red-900/80 border border-red-700 text-red-200 px-4 py-3 rounded mb-4 flex items-center gap-2">
									<AlertCircle className="size-5 flex-shrink-0" />
									<span>{error}</span>
								</div>
							)}

							{message && (
								<div className="bg-green-900/80 border border-green-700 text-green-200 px-4 py-3 rounded mb-4 flex items-center gap-2">
									<CheckCircle className="size-5 flex-shrink-0" />
									<span>{message}</span>
								</div>
							)}

							<div className="space-y-3">
								<button
									onClick={handleLogout}
									disabled={checkingVerification || loading}
									className="w-full bg-transparent border border-primary hover:shadow-sm hover:shadow-primary text-white rounded-md p-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg transform hover:scale-[1.02] active:scale-[0.98]"
								>
									{checkingVerification ? (
										<>
											<RefreshCw size={16} className="animate-spin" />
											Verificando...
										</>
									) : (
										<>
											<CheckCircle size={16} />
											Ya verifiqué mi email
										</>
									)}
								</button>

								<button
									onClick={handleResendVerification}
									disabled={loading || checkingVerification}
									className="w-full bg-transparent border border-orange-500 hover:shadow-sm hover:shadow-orange-500 text-white rounded-md p-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg transform hover:scale-[1.02] active:scale-[0.98]"
								>
									{loading ? (
										<>
											<RefreshCw size={16} className="animate-spin" />
											Enviando...
										</>
									) : (
										<>
											<RefreshCw size={16} />
											Reenviar Correo de Verificación
										</>
									)}
								</button>
							</div>
						</div>

						<div className="text-center space-y-3">
							<p className="text-sm text-slate-400">¿Problemas con la verificación?</p>
							<button
								onClick={handleLogout}
								disabled={loading || checkingVerification}
								className={`flex items-center justify-center gap-2 text-sm text-purple-400 hover:text-purple-300 transition-colors mx-auto ${
									loading || checkingVerification ? 'opacity-50 cursor-not-allowed' : ''
								}`}
							>
								<ArrowLeft size={16} />
								Cerrar sesión e intentar de nuevo
							</button>
						</div>

						<div className="mt-4 text-xs text-slate-500 text-center space-y-2">
							<p>
								💡 <strong>Consejos:</strong>
							</p>
							<ul className="text-left space-y-1">
								<li>• Revisa tu carpeta de spam/correo no deseado</li>
								<li>• Espera hasta 5 minutos para que llegue el correo</li>
								<li>• Asegúrate de que tu email esté escrito correctamente</li>
								<li>• Después de hacer clic en el enlace del correo, regresa aquí y haz clic en "Ya verifiqué mi email"</li>
							</ul>
						</div>
					</div>
				</FadeContent>
			</div>
		</div>
	)
}

export default EmailVerificationNotice