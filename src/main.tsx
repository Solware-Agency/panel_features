import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from '@app/providers/AuthContext.tsx'
import { SessionTimeoutProvider } from '@app/providers/SessionTimeoutProvider.tsx'
import { SessionTimeoutWarning } from '@shared/components/ui/session-timeout-warning.tsx'

createRoot(document.getElementById('root')!).render(
	<StrictMode>
		<AuthProvider>
			<SessionTimeoutProvider>
				<App />
				<SessionTimeoutWarning />
			</SessionTimeoutProvider>
		</AuthProvider>
	</StrictMode>,
)
