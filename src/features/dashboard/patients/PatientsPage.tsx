import React, { useState, useCallback, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getMedicalRecords } from '@lib/supabase-service'
import { Search, RefreshCw } from 'lucide-react'
import { Card } from '@shared/components/ui/card'
import { Input } from '@shared/components/ui/input'
import { Button } from '@shared/components/ui/button'
import PatientsList from './PatientsList'

// Tipo base para los datos que vienen de la API
type RawMedicalRecord = {
	id: string
	name: string
	cedula?: string | null
	telefono?: string | null
	email: string | null
	date_of_birth?: string | null
	fecha_nacimiento?: string | null
	full_name?: string | null
	id_number?: string
	phone?: string
	created_at?: string
	date?: string
}

// Tipo normalizado que coincide con el esperado por PatientsList
type NormalizedMedicalRecord = {
	id: string
	full_name: string
	id_number: string
	phone: string
	email: string | null
	date_of_birth: string | null
	created_at: string
	date: string
	[key: string]: unknown
}

type MedicalRecordsQueryResult = {
	data: NormalizedMedicalRecord[]
	error: Error | null
}

const PatientsPage: React.FC = React.memo(() => {
	const [searchTerm, setSearchTerm] = useState('')
	const [isSearching, setIsSearching] = useState(false)

	// Fetch all medical records - optimized to prevent unnecessary refetches
	const {
		data: recordsData,
		isLoading,
		error,
		refetch,
	} = useQuery({
		queryKey: ['all-medical-records'],
		queryFn: () => getMedicalRecords(),
		staleTime: 1000 * 60 * 5, // 5 minutes
		refetchOnWindowFocus: false, // Prevent refetching on window focus
		refetchOnReconnect: false, // Prevent refetching on reconnect
	})

	// Handle search
	const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
		setSearchTerm(e.target.value)
	}, [])

	// Refresh data
	const handleRefresh = useCallback(() => {
		setIsSearching(true)
		refetch().finally(() => setIsSearching(false))
	}, [refetch])

	// Memoize and normalize the records data
	const memoizedRecordsData = useMemo<MedicalRecordsQueryResult | null>(() => {
		if (!recordsData) return null

		const { data, error } = recordsData as unknown as {
			data: RawMedicalRecord[] | null
			error: unknown
		}

		const mappedData: NormalizedMedicalRecord[] = Array.isArray(data)
			? data.map(
					(item: RawMedicalRecord): NormalizedMedicalRecord => {
						// Primero creamos un objeto base con los campos requeridos
						const normalizedRecord: NormalizedMedicalRecord = {
							id: item.id,
							date_of_birth: item.date_of_birth ?? item.fecha_nacimiento ?? null,
							full_name: item.full_name ?? item.name ?? 'Sin nombre',
							id_number: item.id_number ?? 'Sin ID',
							phone: item.phone ?? 'Sin teléfono',
							email: item.email ?? null,
							created_at: item.created_at ?? item.date ?? new Date().toISOString(),
							date: item.date ?? item.created_at ?? new Date().toISOString()
						}

						// Devolvemos el registro normalizado
						return normalizedRecord
					}
			  )
			: []

		return {
			data: mappedData,
			error: error as Error | null,
		}
	}, [recordsData])

	return (
		<div className="p-3 sm:p-4">
			<div className="grid grid-cols-3 mb-4 sm:mb-6">
				<div className="flex flex-col col-span-1">
					<h1 className="text-2xl font-bold">Pacientes</h1>
					<p className="text-sm text-gray-600 dark:text-gray-400 mt-1 sm:mt-2 font-bold">
						Gestiona la información de los pacientes registrados en el sistema
					</p>
				</div>

				<Card className="p-4 col-span-2">
					<div className="flex flex-col sm:flex-row gap-3 sm:items-center">
						<div className="relative flex-1">
							<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
							<Input
								type="text"
								placeholder="Buscar por nombre, cédula, teléfono o email..."
								value={searchTerm}
								onChange={handleSearchChange}
								className="pl-10"
							/>
							{isSearching && (
								<div className="absolute right-3 top-1/2 transform -translate-y-1/2">
									<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
								</div>
							)}
						</div>

						<Button onClick={handleRefresh} variant="outline" className="flex items-center gap-2 whitespace-nowrap">
							<RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
							Actualizar
						</Button>
					</div>
				</Card>
			</div>

			<PatientsList
				searchTerm={searchTerm}
				recordsData={memoizedRecordsData?.data ?? []}
				isLoading={isLoading}
				error={error || memoizedRecordsData?.error || null}
				handleRefresh={handleRefresh}
			/>
		</div>
	)
})

PatientsPage.displayName = 'PatientsPage'

export default PatientsPage
