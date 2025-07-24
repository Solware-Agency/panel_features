import React, { useState, useCallback, useMemo } from 'react'
import CasesTable from '@shared/components/cases/CasesTable'
import { Users, MapPin, Microscope, FileText, Activity, Download, Search } from 'lucide-react'
import { Card, CardContent } from '@shared/components/ui/card'
import { type MedicalRecord } from '@lib/supabase-service'
import { useUserProfile } from '@shared/hooks/useUserProfile'

interface RecordsSectionProps {
	cases: MedicalRecord[]
	isLoading: boolean
	error: unknown
	refetch: () => void
	isFullscreen: boolean
	setIsFullscreen: (value: boolean) => void
	onSearch?: (term: string) => void
}

export const RecordsSection: React.FC<RecordsSectionProps> = ({
	cases,
	isLoading,
	error,
	refetch,
	isFullscreen,
	setIsFullscreen,
	onSearch,
}) => {
	const [searchTerm] = useState('')
	const { profile } = useUserProfile()
	const [showPendingOnly, setShowPendingOnly] = useState(false)
	const [selectedExamType, setSelectedExamType] = useState<string | null>(null)
	const [showPdfReadyOnly, setShowPdfReadyOnly] = useState(false)

	// Filter cases by assigned branch if user has an assigned branch
	const filteredCases = useMemo(() => {
		if (!cases || cases.length === 0) return []

		let filtered = [...cases]

		// If user is an employee with assigned branch, filter cases
		if (profile?.role === 'employee' && profile?.assigned_branch) {
			filtered = filtered.filter((c) => c.branch === profile.assigned_branch)
		}

		// If user is an admin with assigned branch, filter cases
		if (profile?.role === 'admin' && profile?.assigned_branch) {
			filtered = filtered.filter((c) => c.branch === profile.assigned_branch)
		}

		// If showPendingOnly is true, filter to show only incomplete cases
		if (showPendingOnly) {
			filtered = filtered.filter((c) => c.payment_status !== 'Completado')
		}

		// If an exam type is selected, filter by that type
		if (selectedExamType) {
			filtered = filtered.filter((c) => {
				if (!c.exam_type) return false

				const type = c.exam_type.toLowerCase().trim()

				// Normalizar el tipo de examen usando la misma lógica
				let normalizedType = type
				if (type.includes('inmuno')) {
					normalizedType = 'inmunohistoquimica'
				} else if (type.includes('citolog')) {
					normalizedType = 'citologia'
				} else if (type.includes('biops')) {
					normalizedType = 'biopsia'
				}

				return normalizedType === selectedExamType.toLowerCase()
			})
		}

		// If showPdfReadyOnly is true, filter to show only cases with PDF ready
		if (showPdfReadyOnly) {
			filtered = filtered.filter((c) => {
				const examType = c.exam_type?.toLowerCase().trim() || ''
				const isGeneratableCase = examType.includes('biops') || examType.includes('inmuno') || examType.includes('citolog')
				const hasDownloadableContent = isGeneratableCase && (
					!!c.diagnostico || 
					!!c.conclusion_diagnostica || 
					(examType.includes('citolog') && !!c.descripcion_macroscopica)
				)
				return hasDownloadableContent
			})
		}

		return filtered
	}, [cases, profile, showPendingOnly, selectedExamType, showPdfReadyOnly])

	// Calculate statistics
	const stats = useMemo(() => {
		if (!filteredCases || filteredCases.length === 0) {
			return { total: 0, totalAmount: 0, completed: 0, examTypes: {} }
		}

		const total = filteredCases.length
		const totalAmount = filteredCases.reduce(
			(sum: number, record: MedicalRecord) => sum + (record.total_amount || 0),
			0,
		)
		const completed = filteredCases.filter((record: MedicalRecord) => record.payment_status === 'Completado').length

		// Count cases by exam type
		const examTypes: Record<string, number> = {}
		filteredCases.forEach((record: MedicalRecord) => {
			if (!record.exam_type) return
			const type = record.exam_type.toLowerCase()
			examTypes[type] = (examTypes[type] || 0) + 1
		})

		return { total, totalAmount, completed, examTypes }
	}, [filteredCases])

	// Toggle pending cases filter
	const handleTogglePendingFilter = useCallback(() => {
		setShowPendingOnly(!showPendingOnly)
		setSelectedExamType(null) // Clear exam type filter when toggling pending filter
		setShowPdfReadyOnly(false) // Clear PDF filter when toggling pending filter
	}, [showPendingOnly])

	// Toggle exam type filter
	const handleExamTypeFilter = useCallback(
		(examType: string) => {
			if (selectedExamType === examType.toLowerCase()) {
				setSelectedExamType(null) // Clear filter if already selected
			} else {
				setSelectedExamType(examType.toLowerCase())
				setShowPendingOnly(false) // Clear pending filter when selecting exam type
				setShowPdfReadyOnly(false) // Clear PDF filter when selecting exam type
			}
		},
		[selectedExamType],
	)

	// Toggle PDF ready filter
	const handleTogglePdfFilter = useCallback(() => {
		setShowPdfReadyOnly(!showPdfReadyOnly)
		setShowPendingOnly(false) // Clear pending filter when toggling PDF filter
		setSelectedExamType(null) // Clear exam type filter when toggling PDF filter
	}, [showPdfReadyOnly])

	// Get exam type counts from all cases (SOLO PENDIENTES)
	const examTypeCounts = useMemo(() => {
		const counts: Record<string, number> = {
			biopsia: 0,
			citologia: 0,
			inmunohistoquimica: 0,
		}

		if (cases) {
			// Debug: log all unique exam types
			const uniqueTypes = new Set<string>()
			cases.forEach((record) => {
				if (record.exam_type) {
					uniqueTypes.add(record.exam_type)
				}
			})
			console.log('📊 Tipos de examen únicos en la BD:', Array.from(uniqueTypes))

			cases.forEach((record) => {
				if (record.exam_type) {
					// Solo contar casos pendientes (no completados)
					const isPending = record.payment_status?.toLowerCase().trim() !== 'completado'
					if (!isPending) return

					const originalType = record.exam_type
					const type = record.exam_type.toLowerCase().trim()

					// Mapear variaciones comunes
					let normalizedType = type
					if (type.includes('inmuno')) {
						normalizedType = 'inmunohistoquimica'
					} else if (type.includes('citolog')) {
						normalizedType = 'citologia'
					} else if (type.includes('biops')) {
						normalizedType = 'biopsia'
					}

					if (counts[normalizedType] !== undefined) {
						counts[normalizedType]++
					} else {
						console.warn('⚠️ Tipo de examen no reconocido:', originalType, '-> normalizado:', normalizedType)
					}
				}
			})
		}

		console.log('📊 Conteos pendientes finales:', counts)
		return counts
	}, [cases])

	// Count PDF-pending cases (biopsias sin diagnóstico)
	const pdfReadyCases = useMemo(() => {
		return (
			cases?.filter((c) => {
				const type = c.exam_type?.toLowerCase().trim()
				const isGeneratableCase = type?.includes('biops') || type?.includes('inmuno') || type?.includes('citolog')
				const hasContent = c.diagnostico || c.conclusion_diagnostica || 
					(type?.includes('citolog') && c.descripcion_macroscopica)

				// Contar casos generables con contenido (PDF disponibles)
				return isGeneratableCase && hasContent
			}).length || 0
		)
	}, [cases])

	// Get exam type icon
	const getExamTypeIcon = useCallback((examType: string | null) => {
		if (!examType) return <FileText className="h-4 w-4" />
		
		switch (examType.toLowerCase()) {
			case 'biopsia':
				return <Activity className="h-4 w-4" />
			case 'citologia':
				return <FileText className="h-4 w-4" />
			case 'inmunohistoquimica':
				return <Microscope className="h-4 w-4" />
			default:
				return <FileText className="h-4 w-4" />
		}
	}, [])

	return (
		<div>
			{/* Title Section */}
			<div className="mb-4 sm:mb-6">
				<h2 className="text-xl sm:text-2xl font-semibold text-foreground mb-1 sm:mb-2">Casos de Laboratorio</h2>
				<div className="w-16 sm:w-24 h-1 bg-primary mt-2 rounded-full" />
			</div>

			{/* Statistics cards */}
			<div className="grid grid-cols-1 md:grid-cols-3 gap-5 w-full mb-4 sm:mb-6">
				{/* Combined Pending Cases and PDF Card */}
				<Card className="hover:border-primary hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/20 group transition-all duration-300">
					<CardContent className="p-4">
						{/* Pending Cases Button */}
						<button
							className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all duration-200 cursor-pointer hover:scale-[1.02] hover:shadow-md ${
								showPendingOnly
									? 'border-primary bg-primary/10 shadow-md shadow-primary/20'
									: 'border-border hover:border-orange-300 hover:bg-orange-50 dark:hover:bg-orange-900/20'
							}`}
							onClick={handleTogglePendingFilter}
						>
							<div className="flex items-center gap-3">
								<div className={`p-2 rounded-lg transition-colors duration-200 ${
									showPendingOnly 
										? 'bg-primary/20' 
										: 'bg-orange-100 dark:bg-orange-900/30 hover:bg-orange-200 dark:hover:bg-orange-800/40'
								}`}>
									<Users
										className={`h-5 w-5 transition-colors duration-200 ${
											showPendingOnly 
												? 'text-primary' 
												: 'text-orange-600 dark:text-orange-400'
										}`}
									/>
								</div>
								<div>
									<p className="text-xs font-medium text-muted-foreground">Casos Pendientes</p>
									<p className="text-xl font-bold">
										{stats.total > 0 ? Math.round(((stats.total - stats.completed) / stats.total) * 100) : 0}%
									</p>
								</div>
							</div>
							<div className="text-right">
								<p className="text-xs text-muted-foreground">
									{stats.total - stats.completed} de {stats.total} casos
								</p>
							</div>
						</button>

						{/* PDF Ready Button */}
						<button
							className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all duration-200 cursor-pointer hover:scale-[1.02] hover:shadow-md mt-3 ${
								showPdfReadyOnly
									? 'border-primary bg-primary/10 shadow-md shadow-primary/20'
									: 'border-border hover:border-green-300 hover:bg-green-50 dark:hover:bg-green-900/20'
							}`}
							onClick={handleTogglePdfFilter}
						>
							<div className="flex items-center gap-3">
								<div className={`p-2 rounded-lg transition-colors duration-200 ${
									showPdfReadyOnly 
										? 'bg-primary/20' 
										: 'bg-green-100 dark:bg-green-900/30 hover:bg-green-200 dark:hover:bg-green-800/40'
								}`}>
									<Download
										className={`h-5 w-5 transition-colors duration-200 ${
											showPdfReadyOnly 
												? 'text-primary' 
												: 'text-green-600 dark:text-green-400'
										}`}
									/>
								</div>
								<div>
									<p className="text-xs font-medium text-muted-foreground">PDF Pendientes</p>
									<p className="text-xl font-bold">{pdfReadyCases}</p>
								</div>
							</div>
							<div className="text-right">
								<p className="text-xs text-muted-foreground">
									pendientes por generar
								</p>
							</div>
						</button>

						{/* Status indicators */}
						<div className="mt-3 pt-3 border-t border-border">
							{showPendingOnly && (
								<p className="text-xs text-primary font-medium">Mostrando casos pendientes</p>
							)}
							{showPdfReadyOnly && (
								<p className="text-xs text-primary font-medium">Mostrando PDF disponibles</p>
							)}
							{!showPendingOnly && !showPdfReadyOnly && (
								<p className="text-xs text-muted-foreground">Haz clic en un botón para filtrar</p>
							)}
						</div>
					</CardContent>
				</Card>

				{/* Exam Types Card - Rediseñada más compacta */}
				<Card className="hover:border-primary hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/20 group transition-all duration-300">
					<CardContent className="p-4">
						<div className="flex items-center gap-3 mb-3">
							<div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
								<Activity className="h-5 w-5 text-blue-600 dark:text-blue-400" />
							</div>
							<div>
								<p className="text-xs font-medium text-muted-foreground">Tipos de Examen</p>
								<p className="text-xs text-muted-foreground">Pendientes por tipo</p>
							</div>
						</div>

						<div className="space-y-2">
							{/* Biopsia */}
							<div
								className={`flex items-center justify-between p-2 rounded-lg border transition-all duration-200 cursor-pointer hover:bg-accent ${
									selectedExamType === 'biopsia'
										? 'border-primary bg-primary/10'
										: 'border-border hover:border-primary/50'
								}`}
								onClick={() => handleExamTypeFilter('biopsia')}
							>
								<div className="flex items-center gap-2">
									<Activity className="h-3 w-3 text-red-500" />
									<span className="text-xs font-medium">Biopsia</span>
								</div>
								<span className="text-sm font-bold">{examTypeCounts['biopsia'] || 0}</span>
							</div>

							{/* Citología */}
							<div
								className={`flex items-center justify-between p-2 rounded-lg border transition-all duration-200 cursor-pointer hover:bg-accent ${
									selectedExamType === 'citologia'
										? 'border-primary bg-primary/10'
										: 'border-border hover:border-primary/50'
								}`}
								onClick={() => handleExamTypeFilter('citologia')}
							>
								<div className="flex items-center gap-2">
									<FileText className="h-3 w-3 text-blue-500" />
									<span className="text-xs font-medium">Citología</span>
								</div>
								<span className="text-sm font-bold">{examTypeCounts['citologia'] || 0}</span>
							</div>

							{/* Inmunohistoquímica */}
							<div
								className={`flex items-center justify-between p-2 rounded-lg border transition-all duration-200 cursor-pointer hover:bg-accent ${
									selectedExamType === 'inmunohistoquimica'
										? 'border-primary bg-primary/10'
										: 'border-border hover:border-primary/50'
								}`}
								onClick={() => handleExamTypeFilter('inmunohistoquimica')}
							>
								<div className="flex items-center gap-2">
									<Microscope className="h-3 w-3 text-purple-500" />
									<span className="text-xs font-medium">Inmuno</span>
								</div>
								<span className="text-sm font-bold">{examTypeCounts['inmunohistoquimica'] || 0}</span>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Branch Info */}
			<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-4">
				<div>
					<div className="flex items-center gap-2 sm:gap-3">
						{profile?.assigned_branch && (
							<div className="flex items-center gap-1.5 sm:gap-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg px-2 sm:px-3 py-0.5 sm:py-1">
								<MapPin className="w-4 h-4 text-blue-600 dark:text-blue-400" />
								<span className="text-xs sm:text-sm font-medium text-blue-800 dark:text-blue-300">
									Sede: {profile.assigned_branch}
								</span>
							</div>
						)}
					</div>
				</div>
			</div>

			{/* Active filters indicators */}
			<div className="flex flex-wrap gap-1.5 sm:gap-2 mb-3 sm:mb-4">
				{showPendingOnly && (
					<div className="px-2 sm:px-4 py-1 sm:py-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg inline-block">
						<span className="text-xs sm:text-sm font-medium text-blue-800 dark:text-blue-300 flex items-center gap-1.5 sm:gap-2">
							<Users className="w-3 h-3 sm:w-4 sm:h-4" />
							Mostrando solo casos pendientes
						</span>
					</div>
				)}

				{showPdfReadyOnly && (
					<div className="px-2 sm:px-4 py-1 sm:py-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg inline-block">
						<span className="text-xs sm:text-sm font-medium text-green-800 dark:text-green-300 flex items-center gap-1.5 sm:gap-2">
							<Download className="w-3 h-3 sm:w-4 sm:h-4" />
							Mostrando solo casos con PDF disponible
						</span>
					</div>
				)}

				{selectedExamType && (
					<div className="px-2 sm:px-4 py-1 sm:py-2 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg inline-block">
						<span className="text-xs sm:text-sm font-medium text-purple-800 dark:text-purple-300 flex items-center gap-1.5 sm:gap-2">
							{getExamTypeIcon(selectedExamType)}
							Filtrando por: {selectedExamType.charAt(0).toUpperCase() + selectedExamType.slice(1)}
						</span>
					</div>
				)}

				{searchTerm && (
					<div className="px-2 sm:px-4 py-1 sm:py-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg inline-block">
						<span className="text-xs sm:text-sm font-medium text-blue-800 dark:text-blue-300 flex items-center gap-1.5 sm:gap-2">
							<Search className="w-3 h-3 sm:w-4 sm:h-4" />
							Resultados para: "{searchTerm}"
						</span>
					</div>
				)}
			</div>

			{/* Cases Table */}
			<CasesTable
				cases={filteredCases}
				isLoading={isLoading}
				error={error}
				refetch={refetch}
				isFullscreen={isFullscreen}
				setIsFullscreen={setIsFullscreen}
				onSearch={onSearch}
			/>
		</div>
	)
}
