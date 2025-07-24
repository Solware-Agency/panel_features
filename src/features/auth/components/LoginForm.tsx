import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { Link } from 'react-router-dom'
import { signIn } from '@lib/supabase/auth'
import { useAuth } from '@app/providers/AuthContext'
import { useSecureRedirect } from '@shared/hooks/useSecureRedirect'
import Aurora from '@shared/components/ui/Aurora'
import FadeContent from '@shared/components/ui/FadeContent'
import FavIcon from '@shared/components/icons/FavIcon'

function LoginForm() {
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const [error, setError] = useState('')
	const [loading, setLoading] = useState(false)
	const { refreshUser } = useAuth()
	const [showPassword, setShowPassword] = useState(false)

	// Use secure redirect hook for role-based navigation
	const { isRedirecting } = useSecureRedirect({
		onRedirect: (role, path) => {
			console.log(`User with role "${role}" being redirected to: ${path}`)
		},
	})

	const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault()

		try {
			setError('')
			setLoading(true)

			console.log('Attempting to sign in with:', email)

			const { user, error: signInError } = await signIn(email, password)

			if (signInError) {
				console.error('Sign in error:', signInError)

				// Handle specific Supabase auth errors
				if (signInError.message.includes('Invalid login credentials')) {
					setError('Credenciales inválidas. Verifica tu email y contraseña.')
				} else if (signInError.name === 'EmailNotConfirmed' || signInError.message.includes('Email not confirmed')) {
					console.log('Email not confirmed, redirecting to verification notice')
					// If user exists but email not confirmed, redirect to verification notice
					if (user) {
						await refreshUser()
						// Note: The useSecureRedirect hook will handle the redirect to verification notice
						return
					} else {
						setError('Por favor confirma tu email antes de iniciar sesión.')
					}
				} else if (signInError.message.includes('Too many requests')) {
					setError('Demasiados intentos. Espera un momento antes de intentar de nuevo.')
				} else if (signInError.message.includes('Invalid email')) {
					setError('Correo electrónico inválido.')
				} else {
					setError('Error al iniciar sesión. Verifica tus credenciales.')
				}
				return
			}

			if (!user) {
				setError('Error al iniciar sesión. Inténtalo de nuevo.')
				return
			}

			console.log('User signed in successfully:', user.email)
			console.log('Email confirmed at:', user.email_confirmed_at)

			// CRITICAL: Check if email is verified
			if (!user.email_confirmed_at) {
				console.log('Email not confirmed, will be handled by secure redirect')
				setError('Por favor confirma tu email antes de continuar.')
			}

			// Refresh user data and let the secure redirect handle the navigation
			await refreshUser()

			// No mostrar ningún error ni mensaje aquí. El hook useSecureRedirect se encargará de la redirección.
		} catch (err: any) {
			console.error('Login error:', err)
			setError('Error al iniciar sesión. Verifica tus credenciales o crea una cuenta.')
		} finally {
			// CRITICAL: Always reset loading state
			setLoading(false)
		}
	}

	return (
		<div className="w-screen h-screen relative overflow-hidden bg-gradient-to-br from-black via-black to-black">
			{/* Aurora Background with New Color Palette */}
			<Aurora colorStops={['#ec4699', '#750c41', '#ec4699']} blend={0.7} amplitude={1.3} speed={0.3} />

			{/* Login Form Container with FadeContent Animation */}
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
							<div className="p-4 bg-[#9e1157] rounded-full mb-4 shadow-lg shadow-[0_0_15px_rgba(158,17,87,0.4)] hover:shadow-[0_0_25px_rgba(158,17,87,0.7)] transition-all duration-1000" style={{
								animation: 'slowPulse 3s ease-in-out infinite'
							}}>
								<FavIcon fill="#fff" className="size-16" />
							</div>
							<h1 className="text-2xl font-bold text-white mb-2">Bienvenido, inicia sesión</h1>
							<p className="text-slate-400">Ingresa a tu cuenta para continuar.</p>
						</div>

						<form className="w-full" onSubmit={handleLogin}>
							<div className="flex flex-col gap-2 mb-4 w-full">
								<p className="text-sm text-slate-400">Correo electrónico:</p>
								<input
									type="email"
									name="email"
									placeholder="tu@email.com"
									value={email}
									onChange={(e) => setEmail(e.target.value)}
									required
									disabled={loading || isRedirecting}
									className="border-2 border-slate-600 rounded-md p-2 w-full focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary disabled:opacity-50 disabled:cursor-not-allowed bg-slate-900 text-white placeholder-slate-400 transition-all duration-200"
									autoComplete="email"
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
										disabled={loading || isRedirecting}
										className="border-2 border-slate-600 text-white rounded-md p-2 w-full pr-10 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary disabled:opacity-50 disabled:cursor-not-allowed bg-slate-900 placeholder-slate-400 transition-all duration-200"
										autoComplete="current-password"
									/>
									<button
										type="button"
										onClick={() => setShowPassword(!showPassword)}
										disabled={loading || isRedirecting}
										className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white disabled:opacity-50 transition-colors"
									>
										{showPassword ? <Eye size={20} /> : <EyeOff size={20} />}
									</button>
								</div>
							</div>

							{error && (
								<div className="bg-red-900/80 border border-red-700 text-red-200 px-4 py-3 rounded mb-4 backdrop-blur-sm">
									{error}
								</div>
							)}

							<div className="flex items-center justify-between w-full mb-8">
								<Link
									to="/forgot-password"
									className={`text-sm text-blue-500 hover:text-blue-400 transition-colors ${
										loading || isRedirecting ? 'pointer-events-none opacity-50' : ''
									}`}
								>
									¿Olvidaste tu contraseña?
								</Link>
							</div>

							<button
								type="submit"
								disabled={loading || isRedirecting}
								className="w-full bg-transparent border border-primary hover:shadow-primary text-white rounded-md p-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm transform hover:scale-[1.02] active:scale-[0.98]"
							>
								{loading || isRedirecting ? (
									<>
										<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
										{isRedirecting ? 'Redirigiendo...' : 'Iniciando sesión...'}
									</>
								) : (
									'Iniciar sesión'
								)}
							</button>
						</form>

						{/* Footer */}
						<div className="mt-6 text-center flex flex-col gap-2">
							<p className="text-sm text-slate-400">
								¿No tienes una cuenta?{' '}
								<Link
									to="/register"
									className={`font-medium text-blue-500 hover:text-blue-400 transition-colors ${
										loading || isRedirecting ? 'pointer-events-none opacity-50' : ''
									}`}
								>
									Regístrate aquí
								</Link>
							</p>
							<p className="text-white text-sm">
								Desarrollado por{' '}
								<a href="https://www.solware.agency/" className="text-blue-500">
									Solware
								</a>
							</p>
						</div>
					</div>
				</FadeContent>
			</div>
		</div>
	)
}

export default LoginForm
