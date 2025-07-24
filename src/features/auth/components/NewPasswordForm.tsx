import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Lock, Eye, EyeOff, AlertCircle, CheckCircle, ShieldCheck, RefreshCw } from 'lucide-react'
import { updatePassword, supabase } from '@lib/supabase/auth'
import Aurora from '@shared/components/ui/Aurora'
import FadeContent from '@shared/components/ui/FadeContent'

function NewPasswordForm() {
	const [newPassword, setNewPassword] = useState('')
	const [confirmPassword, setConfirmPassword] = useState('')
	const [showPassword, setShowPassword] = useState(false)
	const [showConfirmPassword, setShowConfirmPassword] = useState(false)
	const [error, setError] = useState('')
	const [message, setMessage] = useState('')
	const [loading, setLoading] = useState(false)
	const [sessionStatus, setSessionStatus] = useState<'checking' | 'valid' | 'invalid'>('checking')
	const navigate = useNavigate()
	const location = useLocation()
	
	// Get recovery data from location state if available
	const recoveryMode = location.state?.recoveryMode
	const recoveryCode = location.state?.recoveryCode

	// Check if user has an active session
	useEffect(() => {
		const checkSession = async () => {
			try {
				console.log('Checking session for password reset...')
				const { data, error } = await supabase.auth.getSession()
				
				if (error) {
					console.error('Session check error:', error)
					setError('Error al verificar la sesión.')
					setSessionStatus('invalid')
					return
				}
				
				if (data.session) {
					console.log('Active session found for password reset')
					setSessionStatus('valid')
					return
				}
				
				// If no session but we have a recovery code, try to exchange it
				if (recoveryMode && recoveryCode) {
					console.log('No session found, but recovery code is available. Attempting to exchange...')
					try {
						const { data: exchangeData, error: exchangeError } = await supabase.auth.exchangeCodeForSession(recoveryCode)
						
						if (exchangeError) {
							console.error('Error exchanging recovery code for session:', exchangeError)
							setError('Error al procesar el código de recuperación. Por favor, solicita un nuevo enlace.')
							setSessionStatus('invalid')
							return
						}
						
						if (exchangeData.session) {
							console.log('Successfully exchanged recovery code for session')
							setSessionStatus('valid')
							return
						}
						
						console.error('No session returned after code exchange')
						setError('No se pudo establecer una sesión. Por favor, solicita un nuevo enlace.')
						setSessionStatus('invalid')
					} catch (err) {
						console.error('Unexpected error exchanging code:', err)
						setError('Error inesperado. Por favor, solicita un nuevo enlace de restablecimiento.')
						setSessionStatus('invalid')
					}
					return
				}
				
				console.log('No active session found and no recovery code available')
				setError('No hay una sesión activa. Por favor, solicita un nuevo enlace de restablecimiento.')
				setSessionStatus('invalid')
			} catch (err) {
				console.error('Unexpected error checking session:', err)
				setError('Error inesperado. Por favor, intenta de nuevo.')
				setSessionStatus('invalid')
			}
		}
		
		checkSession()
	}, [recoveryMode, recoveryCode])

	// Redirect to reset password page if session is invalid
	useEffect(() => {
		if (sessionStatus === 'invalid') {
			const timer = setTimeout(() => {
				navigate('/reset-password', { replace: true })
			}, 3000)
			
			return () => clearTimeout(timer)
		}
	}, [sessionStatus, navigate])

	const handlePasswordUpdate = async (e: React.FormEvent) => {
		e.preventDefault()

		if (sessionStatus !== 'valid') {
			setError('No hay una sesión válida para actualizar la contraseña.')
			return
		}

		if (newPassword !== confirmPassword) {
			setError('Las contraseñas no coinciden.')
			return
		}

		if (newPassword.length < 6) {
			setError('La contraseña debe tener al menos 6 caracteres.')
			return
		}

		try {
			setError('')
			setMessage('')
			setLoading(true)

			console.log('Updating password...')
			const { error } = await updatePassword(newPassword)

			if (error) {
				console.error('Password update error:', error)
				if (error.message.includes('Auth session missing')) {
					setError('La sesión ha expirado. Por favor, solicita un nuevo enlace de restablecimiento.')
					setSessionStatus('invalid')
					return
				}
				setError('Error al actualizar la contraseña. Inténtalo de nuevo.')
				return
			}

			console.log('Password updated successfully')
			setMessage('¡Contraseña actualizada exitosamente! Redirigiendo...')

			// Sign out the user after successful password reset
			setTimeout(async () => {
				await supabase.auth.signOut({ scope: 'global' }).catch((error) => {
					console.error("Error en signOut:", error);
				});
				navigate('/', { replace: true })
			}, 2000)
		} catch (err) {
			console.error('Password update error:', err)
			setError('Error inesperado al actualizar la contraseña.')
		} finally {
			setLoading(false)
		}
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
								<Lock className="text-white size-12" />
							</div>
							<h1 className="text-2xl font-bold text-white mb-2">Nueva Contraseña</h1>
							<p className="text-slate-300 text-center">
								Ingresa tu nueva contraseña para completar el restablecimiento.
							</p>
						</div>

						{sessionStatus === 'checking' ? (
							<div className="w-full flex flex-col items-center justify-center">
								<RefreshCw className="text-primary size-12 animate-spin mb-4" />
								<p className="text-slate-300">Verificando sesión...</p>
							</div>
						) : sessionStatus === 'invalid' ? (
							<div className="w-full">
								<div className="bg-red-900/80 border border-red-700 text-red-200 px-4 py-3 rounded mb-4 flex items-center gap-2">
									<AlertCircle className="size-5 flex-shrink-0" />
									<span>{error || 'No hay una sesión válida. Redirigiendo...'}</span>
								</div>
								<div className="w-full flex justify-center">
									<div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
								</div>
							</div>
						) : (
							<form onSubmit={handlePasswordUpdate} className="w-full">
								<div className="flex flex-col gap-4 mb-4">
									<div>
										<label htmlFor="newPassword" className="block text-sm font-medium text-slate-300 mb-1">
											Nueva Contraseña:
										</label>
										<div className="relative">
											<input
												type={showPassword ? 'text' : 'password'}
												id="newPassword"
												value={newPassword}
												onChange={(e) => setNewPassword(e.target.value)}
												required
												className="w-full border-2 border-slate-600 bg-slate-90ext-white rounded-md p-2 pr-10 focus:outline-none focus:ring-2 focus:ring-primary"
												placeholder="••••••••••••••••••••"
											/>
											<button
												type="button"
												onClick={() => setShowPassword(!showPassword)}
												className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white"
											>
												{showPassword ? <Eye size={20} /> : <EyeOff size={20} />}
											</button>
										</div>
									</div>

									<div>
										<label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-300 mb-1">
											Confirmar Contraseña:
										</label>
										<div className="relative">
											<input
												type={showConfirmPassword ? 'text' : 'password'}
												id="confirmPassword"
												value={confirmPassword}
												onChange={(e) => setConfirmPassword(e.target.value)}
												required
												className="w-full border-2 border-slate-600 bg-slate-900 text-white rounded-md p-2 pr-10 focus:outline-none focus:ring-2 focus:ring-primary"
												placeholder="••••••••••••••••••••"
											/>
											<button
												type="button"
												onClick={() => setShowConfirmPassword(!showConfirmPassword)}
												className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white"
											>
												{showConfirmPassword ? <Eye size={20} /> : <EyeOff size={20} />}
											</button>
										</div>
									</div>
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

								<button
									type="submit"
									disabled={loading}
									className="w-full bg-transparent border border-primary hover:shadow-sm hover:shadow-primary text-white rounded-md p-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg transform hover:scale-[1.02] active:scale-[0.98]"
								>
									{loading ? (
										<>
											<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
											Actualizando...
										</>
									) : (
										'Actualizar Contraseña'
									)}
								</button>
							</form>
						)}

						<div className="mt-4 text-xs text-slate-400">
							<div className="flex items-center gap-2 justify-center">
								<ShieldCheck className="size-4 text-primary" />
								<p>Tu contraseña debe tener al menos 6 caracteres.</p>
							</div>
						</div>
					</div>
				</FadeContent>
			</div>
		</div>
	)
}

export default NewPasswordForm