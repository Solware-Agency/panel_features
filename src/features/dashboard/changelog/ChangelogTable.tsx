import React, { useState } from 'react'
import {
	History,
	Search,
	Filter,
	Calendar,
	User,
	FileText,
	RefreshCw,
	ArrowUpDown,
	Eye,
	Trash2,
	AlertCircle,
} from 'lucide-react'
import { Card } from '@shared/components/ui/card'
import { Input } from '@shared/components/ui/input'
import { Button } from '@shared/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@shared/components/ui/select'
import { useQuery } from '@tanstack/react-query'
import { getAllChangeLogs } from '@lib/supabase-service'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { useToast } from '@shared/hooks/use-toast'
import { useUserProfile } from '@shared/hooks/useUserProfile'
import { supabase } from '@lib/supabase/config'
import { Popover, PopoverContent, PopoverTrigger } from '@shared/components/ui/popover'
import { Calendar as CalendarComponent } from '@shared/components/ui/calendar'

interface ChangeLogEntry {
	id: string
	medical_record_id: string
	user_id: string
	user_email: string
	field_name: string
	field_label: string
	old_value: string | null
	new_value: string | null
	changed_at: string
	created_at: string | null
	medical_records_clean: {
		id: string
		full_name: string
		code: string | null
	} | null
}

const ChangelogTable: React.FC = () => {
	const { toast } = useToast()
	useUserProfile()
	const [searchTerm, setSearchTerm] = useState('')
	const [actionFilter, setActionFilter] = useState<string>('all')
	const [dateFilter, setDateFilter] = useState<Date | undefined>(undefined)
	const [isDatePickerOpen, setIsDatePickerOpen] = useState(false)
	const [page, setPage] = useState(0)
	const [rowsPerPage, setRowsPerPage] = useState(20)
	const [isDeleting, setIsDeleting] = useState<string | null>(null)
	const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false)
	const [logToDelete, setLogToDelete] = useState<string | null>(null)

	// Check if user is owner (only owners can delete logs)

	// Query to fetch change logs
	const {
		data: logsData,
		isLoading,
		error,
		refetch,
	} = useQuery({
		queryKey: ['change-logs', page, rowsPerPage],
		queryFn: () => getAllChangeLogs(rowsPerPage, page * rowsPerPage),
		staleTime: 1000 * 60 * 5, // 5 minutes
	})

	// Filter logs based on search term, action type, and date
	const filteredLogs = React.useMemo(() => {
		if (!logsData?.data) return []

		return logsData.data.filter((log: any) => {
			// Search filter
			const matchesSearch =
				log.user_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
				log.field_label.toLowerCase().includes(searchTerm.toLowerCase()) ||
				(log.medical_records_clean?.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
				(log.medical_records_clean?.code || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
				(log.old_value || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
				(log.new_value || '').toLowerCase().includes(searchTerm.toLowerCase())

			// Action type filter
			let matchesAction = true
			if (actionFilter === 'created') {
				matchesAction = log.field_name === 'created_record'
			} else if (actionFilter === 'deleted') {
				matchesAction = log.field_name === 'deleted_record'
			} else if (actionFilter === 'edited') {
				matchesAction = log.field_name !== 'created_record' && log.field_name !== 'deleted_record'
			}

			// Date filter
			let matchesDate = true
			if (dateFilter) {
				const logDate = new Date(log.changed_at)
				matchesDate =
					logDate.getDate() === dateFilter.getDate() &&
					logDate.getMonth() === dateFilter.getMonth() &&
					logDate.getFullYear() === dateFilter.getFullYear()
			}

			return matchesSearch && matchesAction && matchesDate
		})
	}, [logsData?.data, searchTerm, actionFilter, dateFilter])

	// Function to delete a change log entry (only for owners)

	// Function to confirm deletion
	const confirmDelete = async () => {
		if (!logToDelete) return

		setIsDeleting(logToDelete)
		try {
			const { error } = await supabase.from('change_logs').delete().eq('id', logToDelete)

			if (error) {
				throw error
			}

			toast({
				title: '✅ Registro eliminado',
				description: 'El registro del historial ha sido eliminado exitosamente.',
				className: 'bg-green-100 border-green-400 text-green-800',
			})

			// Refresh data
			refetch()
		} catch (error) {
			console.error('Error deleting change log:', error)
			toast({
				title: '❌ Error al eliminar',
				description: 'Hubo un problema al eliminar el registro. Inténtalo de nuevo.',
				variant: 'destructive',
			})
		} finally {
			setIsDeleting(null)
			setIsConfirmDeleteOpen(false)
			setLogToDelete(null)
		}
	}

	// Function to view the case details

	// Function to clear filters
	const clearFilters = () => {
		setSearchTerm('')
		setActionFilter('all')
		setDateFilter(undefined)
	}

	// Get action type display text and icon
	const getActionTypeInfo = (log: ChangeLogEntry) => {
		if (log.field_name === 'created_record') {
			return {
				text: 'Creación',
				icon: <FileText className="w-4 h-4 text-green-600 dark:text-green-400" />,
				bgColor: 'bg-green-100 dark:bg-green-900/30',
				textColor: 'text-green-800 dark:text-green-300',
			}
		} else if (log.field_name === 'deleted_record') {
			return {
				text: 'Eliminación',
				icon: <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />,
				bgColor: 'bg-red-100 dark:bg-red-900/30',
				textColor: 'text-red-800 dark:text-red-300',
			}
		} else {
			return {
				text: 'Edición',
				icon: <Eye className="w-4 h-4 text-blue-600 dark:text-blue-400" />,
				bgColor: 'bg-blue-100 dark:bg-blue-900/30',
				textColor: 'text-blue-800 dark:text-blue-300',
			}
		}
	}

	if (error) {
		return (
			<div className="p-3 sm:p-6">
				<Card className="p-6 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
					<div className="flex items-center gap-3 mb-4">
						<AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
						<h2 className="text-xl font-bold text-red-800 dark:text-red-300">Error al cargar el historial</h2>
					</div>
					<p className="text-red-700 dark:text-red-400 mb-4">
						No se pudo cargar el historial de cambios. Por favor, intenta de nuevo más tarde.
					</p>
					<Button onClick={() => refetch()} className="bg-red-600 hover:bg-red-700">
						<RefreshCw className="w-4 h-4 mr-2" />
						Reintentar
					</Button>
				</Card>
			</div>
		)
	}

	return (
		<div className="p-3 sm:p-6">
			<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
				<div>
					<h1 className="text-2xl font-bold flex items-center gap-2">
						<History className="text-primary" />
						Historial de Cambios
					</h1>
					<p className="text-muted-foreground">Registro de todas las acciones realizadas en el sistema</p>
				</div>
				<Button onClick={() => refetch()} variant="outline" className="flex items-center gap-2">
					<RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
					Actualizar
				</Button>
			</div>

			{/* Filters */}
			<Card className="mb-6 p-4">
				<div className="flex flex-col sm:flex-row gap-4">
					{/* Search */}
					<div className="flex-1 relative">
						<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
						<Input
							type="text"
							placeholder="Buscar por usuario, caso, acción..."
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
							className="pl-10"
						/>
					</div>

					{/* Action Type Filter */}
					<div className="flex items-center gap-2">
						<Filter className="w-4 h-4 text-gray-400" />
						<Select value={actionFilter} onValueChange={setActionFilter}>
							<SelectTrigger className="w-40">
								<SelectValue placeholder="Tipo de acción" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">Todas las acciones</SelectItem>
								<SelectItem value="created">Creaciones</SelectItem>
								<SelectItem value="edited">Ediciones</SelectItem>
								<SelectItem value="deleted">Eliminaciones</SelectItem>
							</SelectContent>
						</Select>
					</div>

					{/* Date Filter */}
					<div className="flex items-center gap-2">
						<Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
							<PopoverTrigger asChild>
								<Button variant="outline" className="flex items-center gap-2">
									<Calendar className="w-4 h-4 text-gray-400" />
									{dateFilter ? format(dateFilter, 'PPP', { locale: es }) : 'Filtrar por fecha'}
								</Button>
							</PopoverTrigger>
							<PopoverContent className="w-auto p-0">
								<CalendarComponent
									mode="single"
									selected={dateFilter}
									onSelect={(date) => {
										setDateFilter(date)
										setIsDatePickerOpen(false)
									}}
									initialFocus
									locale={es}
								/>
							</PopoverContent>
						</Popover>
					</div>

					{/* Clear Filters */}
					{(searchTerm || actionFilter !== 'all' || dateFilter) && (
						<Button variant="ghost" onClick={clearFilters} className="text-sm">
							Limpiar filtros
						</Button>
					)}
				</div>
			</Card>

			{/* Changelog Table */}
			<Card className="overflow-hidden">
				<div className="overflow-x-auto">
					{isLoading ? (
						<div className="flex items-center justify-center p-8">
							<div className="flex items-center gap-3">
								<div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
								<p className="text-lg">Cargando historial...</p>
							</div>
						</div>
					) : filteredLogs.length === 0 ? (
						<div className="flex flex-col items-center justify-center p-8">
							<History className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" />
							<p className="text-lg font-medium text-gray-500 dark:text-gray-400">No se encontraron registros</p>
							<p className="text-sm text-gray-400 dark:text-gray-500">
								{searchTerm || actionFilter !== 'all' || dateFilter
									? 'Intenta ajustar los filtros de búsqueda'
									: 'Aún no hay registros en el historial de cambios'}
							</p>
						</div>
					) : (
						<>
							{/* Desktop view */}
							<div className="hidden lg:block">
								<table className="w-full">
									<thead className="bg-gray-50/50 dark:bg-background/50 backdrop-blur-[10px] sticky top-0 z-10">
										<tr>
											<th className="px-4 py-3 text-left">
												<div className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
													Fecha
													<ArrowUpDown className="w-3 h-3" />
												</div>
											</th>
											<th className="px-4 py-3 text-left">
												<div className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
													Usuario
												</div>
											</th>
											<th className="px-4 py-3 text-left">
												<div className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
													Caso
												</div>
											</th>
											<th className="px-4 py-3 text-left">
												<div className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
													Acción
												</div>
											</th>
											<th className="px-4 py-3 text-left">
												<div className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
													Detalles
												</div>
											</th>
										</tr>
									</thead>
									<tbody className="divide-y divide-gray-200 dark:divide-gray-700">
										{filteredLogs.map((log: any) => {
											const actionInfo = getActionTypeInfo(log)

											return (
												<tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
													{/* Date */}
													<td className="px-4 py-4 text-sm text-gray-900 dark:text-gray-100">
														<div className="flex flex-col">
															<span>{format(new Date(log.changed_at), 'dd/MM/yyyy', { locale: es })}</span>
															<span className="text-xs text-gray-500 dark:text-gray-400">
																{format(new Date(log.changed_at), 'HH:mm:ss', { locale: es })}
															</span>
														</div>
													</td>

													{/* User */}
													<td className="px-4 py-4">
														<div className="flex items-center gap-2">
															<User className="w-4 h-4 text-gray-500 dark:text-gray-400" />
															<span className="text-sm text-gray-900 dark:text-gray-100">{log.user_email}</span>
														</div>
													</td>

													{/* Case */}
													<td className="px-4 py-4">
														<div className="flex flex-col">
															<span className="text-sm font-medium text-gray-900 dark:text-gray-100">
																{log.medical_records_clean?.full_name || 'Caso eliminado'}
															</span>
															{log.medical_records_clean?.code && (
																<span className="text-xs text-gray-500 dark:text-gray-400">
																	{log.medical_records_clean.code}
																</span>
															)}
														</div>
													</td>

													{/* Action Type */}
													<td className="px-4 py-4">
														<div
															className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${actionInfo.bgColor} ${actionInfo.textColor}`}
														>
															{actionInfo.icon}
															<span>{actionInfo.text}</span>
														</div>
													</td>

													{/* Details */}
													<td className="px-4 py-4">
														<div className="max-w-xs">
															{log.field_name === 'created_record' ? (
																<span className="text-sm text-gray-900 dark:text-gray-100">
																	Creación de nuevo registro médico
																</span>
															) : log.field_name === 'deleted_record' ? (
																<span className="text-sm text-gray-900 dark:text-gray-100">
																	Eliminación del registro: {log.old_value}
																</span>
															) : (
																<div className="text-sm">
																	<p className="font-medium text-gray-900 dark:text-gray-100">{log.field_label}</p>
																	<div className="flex items-center gap-2 mt-1">
																		<span className="line-through text-gray-500 dark:text-gray-400">
																			{log.old_value || '(vacío)'}
																		</span>
																		<span className="text-xs">→</span>
																		<span className="text-green-600 dark:text-green-400">{log.new_value || '(vacío)'}</span>
																	</div>
																</div>
															)}
														</div>
													</td>
												</tr>
											)
										})}
									</tbody>
								</table>
							</div>
							
							{/* Mobile view - Card layout */}
							<div className="lg:hidden">
								<div className="space-y-4 p-3">
									{filteredLogs.map((log: any) => {
										const actionInfo = getActionTypeInfo(log);
										const logDate = format(new Date(log.changed_at), 'dd/MM/yyyy', { locale: es });
										const logTime = format(new Date(log.changed_at), 'HH:mm:ss', { locale: es });
										
										return (
											<div key={log.id} className="bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg p-3 shadow-sm">
												{/* Header with date and action type */}
												<div className="flex items-center justify-between mb-2">
													<div className="flex flex-col">
														<span className="text-xs font-medium">{logDate}</span>
														<span className="text-xs text-gray-500">{logTime}</span>
													</div>
													<div className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${actionInfo.bgColor} ${actionInfo.textColor}`}>
														{actionInfo.icon}
														<span>{actionInfo.text}</span>
													</div>
												</div>
												
												{/* User */}
												<div className="flex items-center gap-2 mb-2 border-t border-gray-100 dark:border-gray-700 pt-2">
													<User className="w-4 h-4 text-gray-500 dark:text-gray-400" />
													<span className="text-xs text-gray-900 dark:text-gray-100 truncate">{log.user_email}</span>
												</div>
												
												{/* Case */}
												<div className="mb-2">
													<span className="text-xs text-gray-500 dark:text-gray-400">Caso:</span>
													<div className="flex flex-col">
														<span className="text-sm font-medium text-gray-900 dark:text-gray-100">
															{log.medical_records_clean?.full_name || 'Caso eliminado'}
														</span>
														{log.medical_records_clean?.code && (
															<span className="text-xs text-gray-500 dark:text-gray-400">
																{log.medical_records_clean.code}
															</span>
														)}
													</div>
												</div>
												
												{/* Details */}
												<div className="border-t border-gray-100 dark:border-gray-700 pt-2">
													<span className="text-xs text-gray-500 dark:text-gray-400">Detalles:</span>
													<div className="mt-1">
														{log.field_name === 'created_record' ? (
															<span className="text-sm text-gray-900 dark:text-gray-100">
																Creación de nuevo registro médico
															</span>
														) : log.field_name === 'deleted_record' ? (
															<span className="text-sm text-gray-900 dark:text-gray-100">
																Eliminación del registro: {log.old_value}
															</span>
														) : (
															<div className="text-sm">
																<p className="font-medium text-gray-900 dark:text-gray-100">{log.field_label}</p>
																<div className="flex flex-wrap items-center gap-1 mt-1">
																	<span className="line-through text-gray-500 dark:text-gray-400 text-xs">
																		{log.old_value || '(vacío)'}
																	</span>
																	<span className="text-xs">→</span>
																	<span className="text-green-600 dark:text-green-400 text-xs">{log.new_value || '(vacío)'}</span>
																</div>
															</div>
														)}
													</div>
												</div>
											</div>
										);
									})}
								</div>
							</div>
						</>
					)}
				</div>

				{/* Pagination */}
				{!isLoading && filteredLogs.length > 0 && (
					<div className="flex items-center justify-between p-4 border-t border-gray-200 dark:border-gray-700">
						<div className="text-sm text-gray-500 dark:text-gray-400">
							Mostrando {filteredLogs.length} de {logsData?.data?.length || 0} registros
						</div>
						<div className="flex items-center gap-2">
							<Select
								value={rowsPerPage.toString()}
								onValueChange={(value) => {
									setRowsPerPage(parseInt(value))
									setPage(0) // Reset to first page when changing rows per page
								}}
							>
								<SelectTrigger className="w-32">
									<SelectValue placeholder="Filas por página" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="10">10 por página</SelectItem>
									<SelectItem value="20">20 por página</SelectItem>
									<SelectItem value="50">50 por página</SelectItem>
									<SelectItem value="100">100 por página</SelectItem>
								</SelectContent>
							</Select>
							<Button variant="outline" onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0}>
								Anterior
							</Button>
							<span className="text-sm">Página {page + 1}</span>
							<Button variant="outline" onClick={() => setPage(page + 1)} disabled={filteredLogs.length < rowsPerPage}>
								Siguiente
							</Button>
						</div>
					</div>
				)}
			</Card>

			{/* Confirm Delete Modal */}
			{isConfirmDeleteOpen && (
				<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
					<div className="bg-white dark:bg-background rounded-lg p-6 max-w-md w-full mx-4">
						<h3 className="text-lg font-bold mb-4">Confirmar eliminación</h3>
						<p className="mb-6">
							¿Estás seguro de que quieres eliminar este registro del historial? Esta acción no se puede deshacer.
						</p>
						<div className="flex justify-end gap-3">
							<Button
								variant="outline"
								onClick={() => {
									setIsConfirmDeleteOpen(false)
									setLogToDelete(null)
								}}
							>
								Cancelar
							</Button>
							<Button variant="destructive" onClick={confirmDelete} disabled={isDeleting !== null}>
								{isDeleting ? (
									<>
										<RefreshCw className="w-4 h-4 mr-2 animate-spin" />
										Eliminando...
									</>
								) : (
									'Eliminar'
								)}
							</Button>
						</div>
					</div>
				</div>
			)}
		</div>
	)
}

export default ChangelogTable
