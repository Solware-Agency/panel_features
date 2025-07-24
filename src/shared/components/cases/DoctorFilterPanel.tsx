import React, { useState, useEffect, useMemo } from 'react'
import { Stethoscope, Search, X } from 'lucide-react'
import { Card } from '@shared/components/ui/card'
import { Checkbox } from '@shared/components/ui/checkbox'
import { Label } from '@shared/components/ui/label'
import { Input } from '@shared/components/ui/input'
import { Button } from '@shared/components/ui/button'
import type { MedicalRecord } from '@lib/supabase-service'

interface DoctorFilterPanelProps {
	cases: MedicalRecord[]
	onFilterChange: (selectedDoctors: string[]) => void
	className?: string
}

const DoctorFilterPanel: React.FC<DoctorFilterPanelProps> = ({ cases, onFilterChange, className }) => {
	const [selectedDoctors, setSelectedDoctors] = useState<string[]>([])
	const [searchTerm, setSearchTerm] = useState('')

	// Extract unique doctors from cases
	const uniqueDoctors = useMemo(() => {
		if (!cases || cases.length === 0) return []

		// Get all unique doctor names
		const doctorsSet = new Set<string>()
		cases.forEach((caseItem) => {
			if (caseItem.treating_doctor && caseItem.treating_doctor.trim()) {
				doctorsSet.add(caseItem.treating_doctor.trim())
			}
		})

		// Convert to array and sort alphabetically
		return Array.from(doctorsSet).sort((a, b) => a.localeCompare(b))
	}, [cases])

	// Filter doctors based on search term
	const filteredDoctors = useMemo(() => {
		if (!searchTerm) return uniqueDoctors

		return uniqueDoctors.filter((doctor) => doctor.toLowerCase().includes(searchTerm.toLowerCase()))
	}, [uniqueDoctors, searchTerm])

	// Handle doctor selection
	const handleDoctorToggle = (doctor: string) => {
		setSelectedDoctors((prev) => {
			if (prev.includes(doctor)) {
				return prev.filter((d) => d !== doctor)
			} else {
				return [...prev, doctor]
			}
		})
	}

	// Clear all filters
	const handleClearFilters = () => {
		setSelectedDoctors([])
		setSearchTerm('')
	}

	// Select all visible doctors
	const handleSelectAll = () => {
		setSelectedDoctors(filteredDoctors)
	}

	// Update parent component when selection changes
	useEffect(() => {
		onFilterChange(selectedDoctors)
	}, [selectedDoctors, onFilterChange])

	return (
		<Card className={`p-3 sm:p-4 ${className} mt-4`}>
			<div className="flex items-center justify-between mb-3 sm:mb-4">
				<div className="flex items-center gap-2">
					<Stethoscope className="h-5 w-5 text-primary" />
					<h3 className="font-medium text-base sm:text-lg">Filtrar por Médico</h3>
				</div>
				{selectedDoctors.length > 0 && (
					<Button variant="ghost" size="sm" onClick={handleClearFilters} className="text-xs">
						<X className="h-3 w-3 mr-1" />
						Limpiar filtros
					</Button>
				)}
			</div>

			<div className="relative mb-4">
				<Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
				<Input
					placeholder="Buscar médico..."
					value={searchTerm}
					onChange={(e) => setSearchTerm(e.target.value)}
					className="pl-8"
				/>
			</div>

			<div className="flex justify-between items-center mb-2 text-sm text-gray-500 dark:text-gray-400">
				<span>{filteredDoctors.length} médicos encontrados</span>
				<Button
					variant="ghost"
					size="sm"
					onClick={handleSelectAll}
					className="text-xs"
					disabled={filteredDoctors.length === 0}
				>
					Seleccionar todos
				</Button>
			</div>

			<div className="max-h-[300px] sm:max-h-[400px] overflow-y-auto pr-2 space-y-1 sm:space-y-2 scrollbar-hide">
				{filteredDoctors.length > 0 ? (
					filteredDoctors.map((doctor) => (
						<div
							key={doctor}
							className="flex items-center space-x-2 py-1 hover:bg-gray-50 dark:hover:bg-gray-800/50 px-2 rounded-md transition-colors text-sm"
						>
							<Checkbox
								id={`doctor-${doctor}`}
								checked={selectedDoctors.includes(doctor)}
								onCheckedChange={() => handleDoctorToggle(doctor)}
							/>
							<Label htmlFor={`doctor-${doctor}`} className="flex-1 cursor-pointer text-sm">
								{doctor}
							</Label>
							<span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">
								{cases.filter((c) => c.treating_doctor === doctor).length}
							</span>
						</div>
					))
				) : (
					<div className="text-center py-4 text-gray-500 dark:text-gray-400">
						{searchTerm ? 'No se encontraron médicos con ese nombre' : 'No hay médicos disponibles'}
					</div>
				)}
			</div>

			{selectedDoctors.length > 0 && (
				<div className="mt-3 sm:mt-4 pt-2 sm:pt-3 border-t border-gray-200 dark:border-gray-700">
					<div className="flex items-center justify-between">
						<span className="text-sm font-medium">Médicos seleccionados:</span>
						<span className="text-sm font-bold text-primary">{selectedDoctors.length}</span>
					</div>
					<div className="mt-2 flex flex-wrap gap-1 sm:gap-2">
						{selectedDoctors.map((doctor) => (
							<div
								key={`selected-${doctor}`}
								className="bg-primary/10 text-primary text-xs px-2 py-0.5 sm:py-1 rounded-full flex items-center gap-1"
							>
								<span className="max-w-[120px] sm:max-w-none truncate">{doctor}</span>
								<button onClick={() => handleDoctorToggle(doctor)} className="hover:text-primary/80">
									<X className="h-3 w-3" />
								</button>
							</div>
						))}
					</div>
				</div>
			)}
		</Card>
	)
}

export default DoctorFilterPanel
