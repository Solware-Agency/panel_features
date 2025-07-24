import { UserRound, Eye, EyeOff, Clock, AlertCircle, CheckCircle } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { signUp } from '@lib/supabase/auth'
import Aurora from '@shared/components/ui/Aurora'
import FadeContent from '@shared/components/ui/FadeContent'

function RegisterForm() {
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const [confirmPassword, setConfirmPassword] = useState('')
	const [displayName, setDisplayName] = useState('')
	const [showPassword, setShowPassword] = useState(false)
	const [showConfirmPassword, setShowConfirmPassword] = useState(false)
	const [error, setError] = useState('')
	const [message, setMessage] = useState('')
	const [loading, setLoading] = useState(false)
	const [rateLimitError, setRateLimitError] = useState(false)
	const [retryCountdown, setRetryCountdown] = useState(0)
	const navigate = useNavigate()

	const startRetryCountdown = (seconds: number) => {
		setRetryCountdown(seconds)
		const interval = setInterval(() => {
			setRetryCountdown((prev) => {
				if (prev <= 1) {
					clearInterval(interval)
					setRateLimitError(false)
					return 0
				}
				return prev - 1
			})
		}, 1000)
	}

	const handleRegister = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault()

		// Reset previous states
		setError('')
		setMessage('')
		setRateLimitError(false)

		if (password !== confirmPassword) {
			setError('Las contraseñas no coinciden.')
			return
		}

		if (password.length < 6) {
			setError('La contraseña debe tener al menos 6 caracteres.')
			return
		}

		try {
			setLoading(true)

			console.log('Attempting to register user:', email)

			const { user, error: signUpError } = await signUp(email, password, displayName)

			if (signUpError) {
				console.error('Registration error:', signUpError)

				// Handle Supabase auth errors
				if (signUpError.message.includes('User already registered')) {
					setError('Ya existe una cuenta con este correo electrónico.')
				} else if (signUpError.message.includes('Password should be at least')) {
					setError('La contraseña es muy débil.')
				} else if (
					signUpError.message.includes('Unable to validate email address') ||
					signUpError.message.includes('Invalid email')
				) {
					setError('Correo electrónico inválido.')
				} else if (signUpError.message.includes('Signup is disabled')) {
					setError('El registro está temporalmente deshabilitado. Contacta al administrador.')
				} else if (
					signUpError.message.includes('email rate limit exceeded') ||
					signUpError.message.includes('over_email_send_rate_limit')
				) {
					setRateLimitError(true)
					setError(
						'Se ha alcanzado el límite de envío de correos electrónicos. Este es un límite temporal del servicio de email.',
					)
					startRetryCountdown(300) // 5 minutes countdown
				} else {
					setError('Error al crear la cuenta. Inténtalo de nuevo.')
				}
				return
			}

			if (user) {
				console.log('User registered successfully:', user.email)
				console.log('Email confirmed at registration:', user.email_confirmed_at)
				console.log('Confirmation sent at:', user.confirmation_sent_at)

				// CRITICAL: Always redirect to email verification notice
				// New users should NEVER be automatically verified
				setMessage(
					'¡Cuenta creada exitosamente! Se ha enviado un correo de verificación a tu email. Revisa tu bandeja de entrada y carpeta de spam.',
				)

				// Always redirect to email verification notice
				setTimeout(() => {
					navigate('/email-verification-notice')
				}, 2000)
			}
		} catch (err: any) {
			console.error('Registration error:', err)

			// Check if the error is related to rate limiting
			if (
				err.message &&
				(err.message.includes('email rate limit exceeded') || err.message.includes('over_email_send_rate_limit'))
			) {
				setRateLimitError(true)
				setError(
					'Se ha alcanzado el límite de envío de correos electrónicos. Este es un límite temporal del servicio de email.',
				)
				startRetryCountdown(300) // 5 minutes countdown
			} else {
				setError('Error al crear la cuenta. Inténtalo de nuevo.')
			}
		} finally {
			// CRITICAL: Always reset loading state
			setLoading(false)
		}
	}

	const formatTime = (seconds: number) => {
		const minutes = Math.floor(seconds / 60)
		const remainingSeconds = seconds % 60
		return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
	}

	return (
		<div className="w-screen h-screen relative overflow-hidden bg-gradient-to-br from-black via-black to-black">
			{/* Aurora Background with New Color Palette */}
			<Aurora colorStops={['#ec4699', '#750c41', '#ec4699']} blend={0.7} amplitude={1.3} speed={0.3} />

			{/* Register Form Container with FadeContent Animation */}
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
						<div className="text-center mb-4 flex flex-col items-center justify-center">
							<div className="p-4 bg-[#9e1157] rounded-full mb-4 shadow-lg">
								<UserRound className="text-white size-16" />
							</div>
							<h1 className="text-2xl font-bold text-white mb-2">Bienvenido a Conspat, Regístrate</h1>
							<p className="text-slate-300">Crea una cuenta para continuar</p>
						</div>

						<form className="w-full" onSubmit={handleRegister}>
							<div className="flex flex-col gap-2 mb-4 w-full">
								<p className="text-sm text-slate-400">Correo electrónico:</p>
								<input
									type="email"
									name="email"
									placeholder="tu@email.com"
									value={email}
									onChange={(e) => setEmail(e.target.value)}
									required
									disabled={loading || rateLimitError}
									className="border-2 border-slate-600 rounded-md p-2 w-full focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary disabled:opacity-50 disabled:cursor-not-allowed bg-slate-900 text-white placeholder-slate-400 transition-all duration-200"
									autoComplete="email"
								/>

								<p className="text-sm text-slate-400">Nombre para mostrar:</p>
								<input
									type="text"
									name="displayName"
									placeholder="Tu nombre"
									value={displayName}
									onChange={(e) => setDisplayName(e.target.value)}
									required
									disabled={loading || rateLimitError}
									className="border-2 border-slate-600 rounded-md p-2 w-full focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary disabled:opacity-50 disabled:cursor-not-allowed bg-slate-900 text-white placeholder-slate-400 transition-all duration-200"
									autoComplete="name"
								/>

								<p className="text-sm text-slate-400">Contraseña:</p>
								<div className="relative">
									<input
										type={showPassword ? 'text' : 'password'}
										name="password"
										placeholder="••••••••••••••"
										value={password}
										onChange={(e) => setPassword(e.target.value)}
										required
										disabled={loading || rateLimitError}
										className="border-2 border-slate-600 rounded-md p-2 w-full pr-10 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary disabled:opacity-50 disabled:cursor-not-allowed bg-slate-900 text-white placeholder-slate-400 transition-all duration-200"
										autoComplete="new-password"
									/>
									<button
										type="button"
										onClick={() => setShowPassword(!showPassword)}
										disabled={loading || rateLimitError}
										className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white disabled:opacity-50"
									>
										{showPassword ? <Eye size={20} /> : <EyeOff size={20} />}
									</button>
								</div>

								<p className="text-sm text-slate-400">Confirmar contraseña:</p>
								<div className="relative">
									<input
										type={showConfirmPassword ? 'text' : 'password'}
										name="confirmPassword"
										placeholder="••••••••••••••"
										value={confirmPassword}
										onChange={(e) => setConfirmPassword(e.target.value)}
										required
										disabled={loading || rateLimitError}
										className="border-2 border-slate-600 rounded-md p-2 w-full pr-10 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary disabled:opacity-50 disabled:cursor-not-allowed bg-slate-900 text-white placeholder-slate-400 transition-all duration-200"
										autoComplete="new-password"
									/>
									<button
										type="button"
										onClick={() => setShowConfirmPassword(!showConfirmPassword)}
										disabled={loading || rateLimitError}
										className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white disabled:opacity-50"
									>
										{showConfirmPassword ? <Eye size={20} /> : <EyeOff size={20} />}
									</button>
								</div>
							</div>

							{error && (
								<div
									className={`border px-4 py-3 rounded mb-4 flex items-start gap-2 ${
										rateLimitError
											? 'bg-yellow-900/80 border-yellow-700 text-yellow-200'
											: 'bg-red-900/80 border-red-700 text-red-200'
									}`}
								>
									{rateLimitError ? <Clock className="w-5 h-5 mt-0.5 flex-shrink-0" /> : <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />}
									<div className="flex-1">
										<p className="font-medium">{error}</p>
										{rateLimitError && (
											<div className="mt-2 text-sm">
												<p>Esto puede suceder cuando:</p>
												<ul className="list-disc list-inside mt-1 space-y-1">
													<li>Se han enviado muchos correos en poco tiempo</li>
													<li>El servicio de email está temporalmente limitado</li>
												</ul>
												<p className="mt-2 font-medium">Soluciones recomendadas:</p>
												<ul className="list-disc list-inside mt-1 space-y-1">
													<li>Espera unos minutos e intenta de nuevo</li>
													<li>Verifica si ya recibiste un correo de confirmación</li>
													<li>Contacta al administrador si el problema persiste</li>
												</ul>
												{retryCountdown > 0 && (
													<p className="mt-3 font-medium text-yellow-200">
														Podrás intentar de nuevo en: {formatTime(retryCountdown)}
													</p>
												)}
											</div>
										)}
									</div>
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
								disabled={loading || rateLimitError}
								className="w-full bg-transparent border border-primary hover:shadow-sm hover:shadow-primary text-white rounded-md p-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg transform hover:scale-[1.02] active:scale-[0.98]"
							>
								{loading ? (
									<>
										<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
										Creando cuenta...
									</>
								) : rateLimitError ? (
									<>
										<Clock className="w-4 h-4" />
										{retryCountdown > 0 ? `Espera ${formatTime(retryCountdown)}` : 'Límite de email alcanzado'}
									</>
								) : (
									'Registrarse'
								)}
							</button>
						</form>

						{/* Footer */}
						<div className="mt-6 text-center">
							<p className="text-sm text-slate-400">
								¿Ya tienes una cuenta?{' '}
								<Link
									to="/"
									className={`font-medium text-blue-500 hover:text-blue-400 transition-colors ${loading || rateLimitError ? 'pointer-events-none opacity-50' : ''}`}
								>
									Inicia sesión aquí
								</Link>
							</p>
						</div>
					</div>
				</FadeContent>
			</div>
		</div>
	)
}

export default RegisterForm