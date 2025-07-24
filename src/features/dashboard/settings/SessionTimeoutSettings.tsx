import { Card } from '@shared/components/ui/card';
import { Clock, Shield, CheckCircle } from 'lucide-react';
import { useAuth } from '@app/providers/AuthContext'
import { SESSION_TIMEOUT_OPTIONS } from '@shared/hooks/useSessionTimeoutSettings'
import { RadioGroup, RadioGroupItem } from '@shared/components/ui/radio-group'
import { Label } from '@shared/components/ui/label'

export function SessionTimeoutSettings() {
	const { sessionTimeout, updateUserTimeout, isLoadingTimeout } = useAuth()

	const handleTimeoutChange = (value: string) => {
		const minutes = parseInt(value, 10)
		if (!isNaN(minutes)) {
			updateUserTimeout(minutes)
		}
	}

	const formatMinutes = (minutes: number) => {
		if (minutes < 60) return `${minutes} minutos`
		return `${minutes / 60} hora${minutes > 60 ? 's' : ''}`
	}

	return (
		<Card className="w-full mx-auto mt-6">
			<div className="p-6">
				<div className="flex items-center space-x-3 mb-4">
					<Clock className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
					<h3 className="text-lg font-semibold">Tiempo de inactividad</h3>
				</div>
				<div className="flex items-start space-x-3 mb-6">
					<Shield className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
					<div>
						<p className="text-sm text-blue-800 dark:text-blue-300 font-medium mb-1">Configuración de seguridad</p>
						<p className="text-xs text-blue-700 dark:text-blue-400">
							Por su seguridad, su sesión se cerrará automáticamente después del tiempo de inactividad seleccionado. Un
							tiempo más corto proporciona mayor seguridad, mientras que un tiempo más largo ofrece mayor comodidad.
						</p>
					</div>
				</div>
				<h4 className="text-sm font-medium mb-3">Seleccione el tiempo de inactividad:</h4>
				{isLoadingTimeout ? (
					<div className="animate-pulse space-y-2">
						{[1, 2, 3, 4, 5].map((i) => (
							<div key={i} className="h-10 bg-gray-200 dark:bg-gray-700 rounded-md"></div>
						))}
					</div>
				) : (
					<RadioGroup value={sessionTimeout.toString()} onValueChange={handleTimeoutChange} className="space-y-2">
						{SESSION_TIMEOUT_OPTIONS.map((minutes) => (
							<div
								key={minutes}
								className={`flex items-center space-x-2 p-3 rounded-md border ${
									sessionTimeout === minutes ? 'border-primary bg-primary/5' : 'border-gray-200 dark:border-gray-700'
								} hover:border-primary hover:bg-primary/5 transition-colors`}
							>
								<RadioGroupItem value={minutes.toString()} id={`timeout-${minutes}`} />
								<Label htmlFor={`timeout-${minutes}`} className="flex items-center space-x-2 cursor-pointer">
									<span>{formatMinutes(minutes)}</span>
									{sessionTimeout === minutes && <CheckCircle className="h-4 w-4 text-primary" />}
								</Label>
							</div>
						))}
					</RadioGroup>
				)}
				<div className="text-xs text-gray-500 dark:text-gray-400 space-y-1 mt-4">
					<p>
						• Su sesión actual está configurada para expirar después de {formatMinutes(sessionTimeout)} de inactividad.
					</p>
					<p>• Los cambios en esta configuración se aplicarán inmediatamente.</p>
					<p>
						• Si cierra sesión manualmente, deberá iniciar sesión nuevamente independientemente de esta configuración.
					</p>
				</div>
			</div>
		</Card>
	)
}