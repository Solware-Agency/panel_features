import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '@lib/supabase/config'
import { useSecureRedirect } from '@shared/hooks/useSecureRedirect'
import { CheckCircle, AlertCircle, RefreshCw } from 'lucide-react'
import Aurora from '@shared/components/ui/Aurora'
import FadeContent from '@shared/components/ui/FadeContent'

function AuthCallback() {
	const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
	const [message, setMessage] = useState('')
	const navigate = useNavigate()
	const [searchParams] = useSearchParams()

	// Use secure redirect for role-based navigation after successful verification
	const { redirectUser } = useSecureRedirect({
		onRedirect: (role, path) => {
			console.log(`Email verified user with role "${role}" being redirected to: ${path}`)
		}
	})

	useEffect(() => {
		const handleAuthCallback = async () => {
			try {
				console.log('Processing auth callback...')
				console.log('Current URL:', window.location.href)
				console.log('Search params:', Object.fromEntries(searchParams.entries()))
				console.log('Hash:', window.location.hash)

				// PRIORITY 1: Check for password recovery first
				const type = searchParams.get('type')
				const code = searchParams.get('code')

				console.log('Callback type:', type)
				console.log('Has code:', !!code)

				// Handle password recovery with highest priority
				if (type === 'recovery' && code) {
					console.log('Password recovery flow detected - handling with priority')
					
					try {
						// Exchange the code for a session
						console.log('Exchanging code for session...')
						const { data, error } = await supabase.auth.exchangeCodeForSession(code)
						
						if (error) {
							console.error('Error exchanging code for session:', error)
							
							// Special handling for PKCE errors
							if (error.message.includes('code verifier') || error.message.includes('PKCE')) {
								console.log('PKCE error detected, redirecting to password reset page anyway')
								// Even with PKCE error, redirect to password reset page
								// The component will handle session validation
								navigate('/new-password', { 
									replace: true,
									state: { 
										recoveryMode: true,
										recoveryCode: code
									}
								})
								return
							}
							
							setStatus('error')
							setMessage('Error al procesar el enlace de recuperación. El enlace puede haber expirado.')
							return
						}
						
						if (data.session) {
							console.log('Session established successfully for password recovery')
							// Redirect to password reset page
							navigate('/new-password', { replace: true })
							return
						} else {
							console.log('No session data returned, but no error either')
							// Still try to redirect to password reset page
							navigate('/new-password', { 
								replace: true,
								state: { 
									recoveryMode: true,
									recoveryCode: code
								}
							})
							return
						}
					} catch (err) {
						console.error('Error in recovery flow:', err)
						setStatus('error')
						setMessage('Error al procesar el enlace de recuperación.')
						return
					}
				}

				// PRIORITY 2: Check for general errors
				const error = searchParams.get('error')
				const errorDescription = searchParams.get('error_description')
				const errorCode = searchParams.get('error_code')

				if (error) {
					console.error('Auth callback error from URL:', { error, errorDescription, errorCode })

					if (error === 'access_denied' && errorCode === 'otp_expired') {
						setStatus('error')
						setMessage(
							'El enlace ha expirado. Por favor, solicita un nuevo enlace de verificación o restablecimiento de contraseña.',
						)
					} else {
						setStatus('error')
						setMessage(`Error de autenticación: ${errorDescription || error}`)
					}
					return
				}

				// PRIORITY 3: Handle email confirmation (only if not password recovery)
				console.log('Not a password recovery, checking for email confirmation...')

				// Check for session from URL hash or query params
				const { data, error: sessionError } = await supabase.auth.getSession()

				if (sessionError) {
					console.error('Auth callback session error:', sessionError)
					setStatus('error')
					setMessage('Error al verificar la sesión. Inténtalo de nuevo.')
					return
				}

				// Handle email confirmation
				if (data.session?.user) {
					const user = data.session.user
					console.log('User authenticated via callback:', user.email)
					console.log('Email confirmed:', user.email_confirmed_at)
					console.log('User metadata:', user.user_metadata)

					if (user.email_confirmed_at) {
						setStatus('success')
						setMessage('¡Email verificado exitosamente! Redirigiendo...')

						// Check if user is approved before redirecting
						try {
							const { data: profileData } = await supabase
								.from('profiles')
								.select('estado')
								.eq('id', user.id)
								.single()

							// FIXED: Only check for explicit "pendiente" status
							if (profileData && profileData.estado === 'pendiente') {
								// User is not approved, redirect to pending approval page
								setTimeout(() => {
									navigate('/pending-approval')
								}, 2000)
							} else {
								// User is approved or estado is null/undefined/anything else, use secure redirect for role-based navigation
								setTimeout(() => {
									redirectUser()
								}, 2000)
							}
						} catch (profileError) {
							console.error('Error checking user approval status:', profileError)
							// Default to secure redirect if we can't check approval status
							setTimeout(() => {
								redirectUser()
							}, 2000)
						}
					} else {
						setStatus('error')
						setMessage('El email aún no está verificado. Revisa tu correo.')
						setTimeout(() => {
							navigate('/email-verification-notice')
						}, 3000)
					}
				} else {
					console.log('No session found, checking if this was a confirmation link')

					// Try to exchange the URL for a session (for email confirmation)
					if (code) {
						const { data: exchangeData, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

						if (exchangeError) {
							console.error('Error exchanging code for session:', exchangeError)
							setStatus('error')
							setMessage('Error al verificar el email. El enlace puede haber expirado.')
							setTimeout(() => {
								navigate('/')
							}, 3000)
							return
						}

						if (exchangeData.session?.user) {
							const user = exchangeData.session.user
							console.log('Email confirmed via code exchange:', user.email)

							setStatus('success')
							setMessage('¡Email verificado exitosamente! Redirigiendo...')

							// Check if user is approved before redirecting
							try {
								const { data: profileData } = await supabase
									.from('profiles')
									.select('estado')
									.eq('id', user.id)
									.single()

								// FIXED: Only check for explicit "pendiente" status
								if (profileData && profileData.estado === 'pendiente') {
									// User is not approved, redirect to pending approval page
									setTimeout(() => {
										navigate('/pending-approval')
									}, 2000)
								} else {
									// User is approved or estado is null/undefined/anything else, use secure redirect for role-based navigation
									setTimeout(() => {
										redirectUser()
									}, 2000)
								}
							} catch (profileError) {
								console.error('Error checking user approval status:', profileError)
								// Default to secure redirect if we can't check approval status
								setTimeout(() => {
									redirectUser()
								}, 2000)
							}
						} else {
							setStatus('error')
							setMessage('No se pudo verificar la sesión. Redirigiendo al login...')
							setTimeout(() => {
								navigate('/')
							}, 3000)
						}
					} else {
						setStatus('error')
						setMessage('No se encontró un código de verificación. Redirigiendo al login...')
						setTimeout(() => {
							navigate('/')
						}, 3000)
					}
				}
			} catch (err) {
				console.error('Unexpected auth callback error:', err)
				setStatus('error')
				setMessage('Error inesperado. Redirigiendo al login...')
				setTimeout(() => {
					navigate('/')
				}, 3000)
			}
		}

		handleAuthCallback()
	}, [navigate, searchParams, redirectUser])

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
							<div
								className={`p-4 rounded-full mb-4 ${
									status === 'loading' ? 'bg-blue-500' : status === 'success' ? 'bg-green-500' : 'bg-red-500'
								}`}
							>
								{status === 'loading' && <RefreshCw className="text-white size-12 animate-spin" />}
								{status === 'success' && <CheckCircle className="text-white size-12" />}
								{status === 'error' && <AlertCircle className="text-white size-12" />}
							</div>

							<h1 className="text-2xl font-bold text-white mb-2">
								{status === 'loading' && 'Verificando...'}
								{status === 'success' && '¡Verificación Exitosa!'}
								{status === 'error' && 'Error de Verificación'}
							</h1>

							<p className="text-slate-300 text-center">{message || 'Procesando verificación...'}</p>
						</div>

						{status === 'loading' && (
							<div className="w-full">
								<div className="bg-blue-900/50 border border-blue-700/50 text-blue-200 px-4 py-3 rounded">
									<p className="text-sm text-center">Por favor espera mientras procesamos tu solicitud...</p>
								</div>
							</div>
						)}

						{status === 'error' && (
							<div className="w-full">
								<button
									onClick={() => navigate('/')}
									className="w-full bg-transparent border border-primary hover:shadow-sm hover:shadow-primary text-white rounded-md p-2 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
								>
									Ir al Login
								</button>
							</div>
						)}
					</div>
				</FadeContent>
			</div>
		</div>
	)
}

export default AuthCallback