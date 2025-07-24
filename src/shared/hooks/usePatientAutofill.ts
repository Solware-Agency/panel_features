import { useState } from 'react'
import { supabase } from '@lib/supabase/config'
import { type UseFormSetValue } from 'react-hook-form'
import type { FormValues } from '@features/form/lib/form-schema'

export const usePatientAutofill = (setValue: UseFormSetValue<FormValues>) => {
	const [isLoading, setIsLoading] = useState(false)
	const [lastFilledPatient, setLastFilledPatient] = useState<string | null>(null)

	const fillPatientData = async (idNumber: string, silent: boolean = false) => {
		if (!idNumber || idNumber.length < 6) return // Mínimo 6 dígitos para buscar

		setIsLoading(true)

		try {
			// Buscar el registro más reciente con esta cédula
			const { data, error } = await supabase
				.from('medical_records_clean')
				.select('full_name, phone, edad, email')
				.eq('id_number', idNumber)
				.order('created_at', { ascending: false })
				.limit(1)
				.single()

			if (error) {
				// Si no se encuentra, no hacer nada (no es un error crítico)
				if (error.code === 'PGRST116') {
					console.log('No se encontraron registros previos para esta cédula')
				}
				return
			}

			if (data) {
				// Primero, ocultar todas las sugerencias de autocompletado
				window.dispatchEvent(new CustomEvent('hideAllAutocompleteSuggestions'))

				// Pequeño delay para asegurar que las sugerencias se oculten antes de llenar
				setTimeout(() => {
					// Llenar automáticamente los campos del paciente
					setValue('fullName', data.full_name)
					setValue('phone', data.phone)
					setValue('email', data.email || '')
					
					// Parse edad string to ageValue and ageUnit
					if (data.edad) {
						try {
							// Parse "10 MESES" or "12 AÑOS" format
							const parts = data.edad.split(' ')
							if (parts.length === 2) {
								const ageValue = parseInt(parts[0], 10)
								const ageUnit = parts[1] as 'MESES' | 'AÑOS'
								
								if (!isNaN(ageValue) && (ageUnit === 'MESES' || ageUnit === 'AÑOS')) {
									setValue('ageValue', ageValue)
									setValue('ageUnit', ageUnit)
								}
							}
						} catch (error) {
							console.error('Error parsing edad:', error)
						}
					}

					setLastFilledPatient(data.full_name)

					// Solo mostrar notificación si no es silencioso
					if (!silent) {
						console.log('✅ Datos del paciente cargados automáticamente:', data)
					}
				}, 100)
			}
		} catch (error) {
			console.error('Error al buscar datos del paciente:', error)
		} finally {
			setIsLoading(false)
		}
	}

	return {
		fillPatientData,
		isLoading,
		lastFilledPatient,
	}
}