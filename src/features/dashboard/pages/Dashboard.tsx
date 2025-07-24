import React, { createContext } from 'react'
import type { ReactNode } from 'react'

interface ThemeContextProps {
	theme: 'light' | 'dark'
	toggleTheme: () => void
}
const ThemeContext = createContext<ThemeContextProps | undefined>(undefined)

const ThemeProvider = ({ children }: { children: ReactNode }) => {
	const [theme, setTheme] = React.useState<'light' | 'dark'>('light')

	const toggleTheme = () => {
		setTheme((prev) => {
			const next = prev === 'light' ? 'dark' : 'light'
			if (next === 'dark') {
				document.documentElement.classList.add('dark')
			} else {
				document.documentElement.classList.remove('dark')
			}
			return next
		})
	}

	return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>
}

// This component is kept for backward compatibility but is no longer the main dashboard
// The main dashboard functionality has been moved to Layout.tsx
const Dashboard: React.FC = () => {
	return (
		<ThemeProvider>
			<div>Dashboard component - This should be replaced by the new routing structure</div>
		</ThemeProvider>
	)
}

export default Dashboard
