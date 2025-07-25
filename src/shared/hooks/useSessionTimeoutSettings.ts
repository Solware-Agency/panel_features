import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@lib/supabase/config'
import type { User } from '@supabase/supabase-js'

export const SESSION_TIMEOUT_OPTIONS = [1, 5, 10, 15, 20, 30, 60] // minutes

interface UseSessionTimeoutSettingsOptions {
	user: User | null
}

export function useSessionTimeoutSettings({ user }: UseSessionTimeoutSettingsOptions) {
	const [sessionTimeout, setSessionTimeout] = useState<number>(30) // minutes
	const [isLoading, setIsLoading] = useState(true)

	// Load user timeout from database
	useEffect(() => {
		if (!user) {
			setIsLoading(false)
			return
		}

		let isMounted = true

		const loadUserTimeout = async () => {
			try {
				const { data, error } = await supabase
					.from('user_settings')
					.select('session_timeout')
					.eq('id', user.id)
					.single()

				if (error && error.code !== 'PGRST116') {
					console.error('Error loading user timeout:', error)
					return
				}

				const timeoutMinutes = data?.session_timeout || 30
				if (isMounted) {
					setSessionTimeout(timeoutMinutes)
				}

				// Also save to localStorage for immediate access
				localStorage.setItem('sessionTimeout', timeoutMinutes.toString())
			} catch (error) {
				console.error('Error loading user timeout:', error)
			} finally {
				if (isMounted) {
					setIsLoading(false)
				}
			}
		}

		// Try to load from localStorage first for immediate access
		const savedTimeout = localStorage.getItem('sessionTimeout')
		if (savedTimeout) {
			const timeoutMinutes = parseInt(savedTimeout, 10)
			if (!isNaN(timeoutMinutes) && SESSION_TIMEOUT_OPTIONS.includes(timeoutMinutes)) {
				setSessionTimeout(timeoutMinutes)
			}
		}

		loadUserTimeout()

		return () => {
			isMounted = false
		}
	}, [user])

	// Update user timeout in database
	const updateUserTimeout = useCallback(
		async (minutes: number): Promise<boolean | undefined> => {
			if (!user) return

			try {
				const { error } = await supabase.from('user_settings').upsert(
					{
						id: user.id,
						session_timeout: minutes,
					},
					{ onConflict: 'id' },
				)

				if (error) {
					console.error('Error updating user timeout:', error)
					return false
				}

				setSessionTimeout(minutes)
				localStorage.setItem('sessionTimeout', minutes.toString())
				return true
			} catch (error) {
				console.error('Error updating user timeout:', error)
				return false
			}
		},
		[user],
	)

	return {
		sessionTimeout,
		updateUserTimeout,
		isLoading,
	}
}
