import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@lib/supabase/config'
import { signOut as authSignOut } from '@lib/supabase/auth' // Rename to avoid conflicts
import { useSessionTimeoutSettings } from '@shared/hooks/useSessionTimeoutSettings'
import type { ReactNode } from 'react'
import type { User, Session } from '@supabase/supabase-js'

interface AuthContextType {
	user: User | null
	session: Session | null
	loading: boolean
	signOut: () => Promise<void>
	refreshUser: () => Promise<void>
	sessionTimeout: number
	updateUserTimeout: (minutes: number) => Promise<boolean | undefined>
	isLoadingTimeout: boolean
}

const AuthContext = createContext<AuthContextType>({
	user: null,
	session: null,
	loading: true,
	signOut: async () => {},
	refreshUser: async () => {},
	sessionTimeout: 30,
	updateUserTimeout: async () => undefined,
	isLoadingTimeout: false,
})

export const useAuth = () => {
	const context = useContext(AuthContext)
	if (!context) {
		throw new Error('useAuth must be used within an AuthProvider')
	}
	return context
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
	const [user, setUser] = useState<User | null>(null)
	const [session, setSession] = useState<Session | null>(null)
	const [loading, setLoading] = useState(true)

	// Handle session timeout
	const handleSessionTimeout = async () => {
		try {
			const {
				data: { session: currentSession },
				error,
			} = await supabase.auth.getSession()

			if (!currentSession || error) {
				console.warn('No active session found or error fetching session during timeout.', error)
				window.location.replace('/')
				return
			}

			const { error: signOutError } = await authSignOut()
			if (signOutError) {
				console.error('Error during timeout sign out:', signOutError)
			}
		} catch (err) {
			console.error('Unexpected error during session timeout:', err)
		} finally {
			setUser(null)
			setSession(null)
			window.location.replace('/')
		}
	}

	// Use the simplified hook that only manages settings
	const {
		sessionTimeout,
		updateUserTimeout,
		isLoading: isLoadingTimeout,
	} = useSessionTimeoutSettings({
		user,
	})

	// Listen for session timeout events from the SessionTimeoutProvider
	useEffect(() => {
		const handleTimeout = () => {
			handleSessionTimeout()
		}

		window.addEventListener('sessionTimeout', handleTimeout)
		return () => window.removeEventListener('sessionTimeout', handleTimeout)
	}, [])

	const refreshUser = async () => {
		try {
			const {
				data: { user: currentUser },
			} = await supabase.auth.getUser()
			setUser(currentUser)
		} catch (error) {
			console.error('Error refreshing user:', error)
			setUser(null)
		}
	}

	useEffect(() => {
		// Get initial session
		const getInitialSession = async () => {
			try {
				const {
					data: { session: initialSession },
				} = await supabase.auth.getSession()
				setSession(initialSession)
				setUser(initialSession?.user ?? null)
			} catch (error) {
				console.error('Error getting initial session:', error)
				await supabase.auth.signOut({ scope: 'global' }).catch((error) => {
					console.error("Error en signOut:", error);
				});
				setSession(null)
				setUser(null)
			} finally {
				setLoading(false)
			}
		}

		getInitialSession()

		// Listen for auth changes
		const {
			data: { subscription },
		} = supabase.auth.onAuthStateChange(async (_event, currentSession) => {
			setSession(currentSession)
			setUser(currentSession?.user ?? null)
			setLoading(false)
		})

		return () => {
			subscription.unsubscribe()
		}
	}, [])

	return (
		<AuthContext.Provider
			value={{
				user,
				session,
				loading,
				signOut: async () => {
					try {
						const { error } = await authSignOut()
						if (error) {
							console.error('Error during manual sign out:', error)
							return
						}

						// Solo actualizamos el estado y redirigimos después de un cierre de sesión exitoso
						setUser(null)
						setSession(null)

						// Pequeña pausa para asegurar que los estados se actualicen
						await new Promise((resolve) => setTimeout(resolve, 100))

						window.location.replace('/')
					} catch (err) {
						console.error('Unexpected error during sign out:', err)
					}
				},
				refreshUser,
				sessionTimeout,
				updateUserTimeout,
				isLoadingTimeout,
			}}
		>
			{children}
		</AuthContext.Provider>
	)
}
