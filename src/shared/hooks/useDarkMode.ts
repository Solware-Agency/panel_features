import { useState, useEffect } from 'react'

export const useDarkMode = () => {
	const [isDark, setIsDark] = useState(() => {
		if (typeof window === 'undefined') return false

		const savedTheme = localStorage.getItem('theme')
		const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches

		return savedTheme === 'dark' || (!savedTheme && prefersDark)
	})

	useEffect(() => {
		const root = window.document.documentElement

		// Eliminar todas las clases de tema primero
		root.classList.remove('light', 'dark')

		// Aplicar la clase apropiada
		if (isDark) {
			root.classList.add('dark')
			localStorage.setItem('theme', 'dark')
		} else {
			root.classList.add('light')
			localStorage.setItem('theme', 'light')
		}
	}, [isDark])

	// Escuchar cambios en las preferencias del sistema
	useEffect(() => {
		const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

		const handleChange = (e: MediaQueryListEvent) => {
			// Solo cambiar si no hay tema guardado en localStorage
			const savedTheme = localStorage.getItem('theme')
			if (!savedTheme) {
				setIsDark(e.matches)
			}
		}

		mediaQuery.addEventListener('change', handleChange)
		return () => mediaQuery.removeEventListener('change', handleChange)
	}, [])

	const toggleDarkMode = () => {
		setIsDark((prev) => !prev)
	}

	return { isDark, setIsDark, toggleDarkMode }
}
