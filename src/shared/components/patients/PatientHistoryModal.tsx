import React, { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { X, User, FileText, Calendar, Phone, Mail, Cake, Search, RefreshCw } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@lib/supabase/config'
import { BranchBadge } from '@shared/components/ui/branch-badge'
import type { MedicalRecord } from '@lib/supabase-service'
import { Button } from '@shared/components/ui/button'
import { Input } from '@shared/components/ui/input'
import { useBodyScrollLock } from '@shared/hooks/useBodyScrollLock'

interface PatientHistoryModalProps {
  isOpen: boolean
  onClose: () => void
  patient: {
    id_number: string
    full_name: string
	phone: string
	email: string | null
	date_of_birth: string | null
		edad?: string | null
  } | null
}

const PatientHistoryModal: React.FC<PatientHistoryModalProps> = ({ isOpen, onClose, patient }) => {
  const [searchTerm, setSearchTerm] = useState('')
	useBodyScrollLock(isOpen)
  
  // Fetch patient's medical records
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['patient-history', patient?.id_number],
    queryFn: async () => {
      if (!patient?.id_number) return { data: [] }
      
      const { data, error } = await supabase
        .from('medical_records_clean')
        .select('*')
        .eq('id_number', patient.id_number)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return { data: data || [] }
    },
    enabled: isOpen && !!patient?.id_number,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })

  // Filter cases based on search term
  const filteredCases = React.useMemo(() => {
    if (!data?.data) return []
    
    if (!searchTerm) return data.data
    
    const searchLower = searchTerm.toLowerCase()
    return data.data.filter((caseItem: MedicalRecord) => 
      (caseItem.code?.toLowerCase() || '').includes(searchLower) ||
      (caseItem.exam_type?.toLowerCase() || '').includes(searchLower) ||
      (caseItem.treating_doctor?.toLowerCase() || '').includes(searchLower) ||
      (caseItem.branch?.toLowerCase() || '').includes(searchLower) ||
      (caseItem.payment_status?.toLowerCase() || '').includes(searchLower)
    )
  }, [data?.data, searchTerm])

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completado':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
      case 'Pendiente':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
      default:
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300'
    }
  }

  if (!patient) return null

  return (
		<AnimatePresence>
			{isOpen && (
				<>
					{/* Backdrop */}
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						onClick={onClose}
						className="fixed inset-0 bg-black/50 z-[99999998]"
					/>

					{/* Modal */}
					<motion.div
						initial={{ opacity: 0, scale: 0.95 }}
						animate={{ opacity: 1, scale: 1 }}
						exit={{ opacity: 0, scale: 0.95 }}
						transition={{ type: 'spring', damping: 25, stiffness: 200 }}
						className="fixed inset-0 z-[99999999] flex items-center justify-center p-4"
						onClick={onClose}
					>
						<div 
							className="bg-white dark:bg-background rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
							onClick={(e) => e.stopPropagation()}
						>
							{/* Header */}
							<div className="sticky top-0 bg-white dark:bg-background border-b border-gray-200 dark:border-gray-700 p-4 sm:p-6 z-10">
								<div className="flex items-center justify-between">
									<div>
										<h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
											Historial del Paciente
										</h2>
										<p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
											Todos los casos registrados para este paciente
										</p>
									</div>
									<button
										onClick={onClose}
										className="p-1.5 sm:p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
									>
										<X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
									</button>
								</div>
							</div>

							{/* Content */}
							<div className="flex-1 overflow-hidden flex flex-col">
								{/* Patient Info */}
								<div className="p-4 sm:p-6 bg-gray-50 dark:bg-gray-800/50">
									<div className="flex flex-col sm:flex-row sm:items-center gap-4">
										<div className="flex items-center gap-3">
											<div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full">
												<User className="h-6 w-6 text-blue-600 dark:text-blue-400" />
											</div>
											<div>
												<h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{patient.full_name}</h3>
												<p className="text-sm text-gray-600 dark:text-gray-400">Cédula: {patient.id_number}</p>
											</div>
										</div>

										<div className="flex flex-wrap gap-3 sm:ml-auto">
											<div className="flex items-center gap-1 text-sm">
												<button
													onClick={() => {
														const phoneNumber = patient.phone.replace(/\D/g, '')
														const message = encodeURIComponent(
															'Hola, me comunico desde el sistema médico. ¿Cómo está usted?',
														)
														const whatsappUrl = `https://api.whatsapp.com/send/?phone=${phoneNumber}&text=${message}&type=phone_number&app_absent=0`
														window.open(whatsappUrl, '_blank')
													}}
													className="flex items-center gap-1 hover:text-green-600 transition-colors cursor-pointer"
													title="Enviar mensaje por WhatsApp"
												>
													<Phone className="h-4 w-4 text-gray-500 hover:text-green-600 transition-colors" />
													<span>{patient.phone}</span>
												</button>
											</div>

											{patient.email && (
												<div className="flex items-center gap-1 text-sm">
													<Mail className="h-4 w-4 text-gray-500" />
													<span>{patient.email}</span>
												</div>
											)}

											{patient.edad && (
												<div className="flex items-center gap-1 text-sm">
													<Cake className="h-4 w-4 text-gray-500" />
													<span>{patient.edad}</span>
												</div>
											)}
										</div>
									</div>
								</div>

								{/* Search and Filters */}
								<div className="p-4 border-b border-gray-200 dark:border-gray-700">
									<div className="flex gap-3">
										<div className="relative flex-1">
											<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
											<Input
												type="text"
												placeholder="Buscar por código, tipo, médico..."
												value={searchTerm}
												onChange={(e) => setSearchTerm(e.target.value)}
												className="pl-10"
											/>
										</div>

										<Button
											onClick={() => refetch()}
											variant="outline"
											className="flex items-center gap-2"
											disabled={isLoading}
										>
											<RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
											Actualizar
										</Button>
									</div>
								</div>

								{/* Cases List */}
								<div className="flex-1 overflow-y-auto p-4">
									{isLoading ? (
										<div className="flex items-center justify-center py-12">
											<div className="flex items-center gap-3">
												<div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
												<span className="text-lg text-gray-700 dark:text-gray-300">Cargando casos...</span>
											</div>
										</div>
									) : error ? (
										<div className="text-center py-12">
											<div className="text-red-500 dark:text-red-400">
												<p className="text-lg font-medium">Error al cargar los casos</p>
												<p className="text-sm mt-2">Verifica tu conexión a internet o contacta al administrador</p>
											</div>
											{searchTerm && (
												<Button onClick={() => setSearchTerm('')} variant="outline" className="mt-4">
													Limpiar búsqueda
												</Button>
											)}
										</div>
									) : filteredCases.length === 0 ? (
										<div className="text-center py-12">
											<div className="text-gray-500 dark:text-gray-400">
												<FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
												<p className="text-lg font-medium">No se encontraron casos</p>
												<p className="text-sm mt-2">
													{searchTerm ? 'No hay casos que coincidan con tu búsqueda' : 'Este paciente no tiene casos registrados'}
												</p>
											</div>
											{searchTerm && (
												<Button onClick={() => setSearchTerm('')} variant="outline" className="mt-4">
													Limpiar búsqueda
												</Button>
											)}
										</div>
									) : (
										<div className="space-y-4">
											{filteredCases.map((caseItem: MedicalRecord) => (
												<div
													key={caseItem.id}
													className="bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow"
												>
													<div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-3">
														<div className="flex items-center gap-2">
															{caseItem.code && (
																<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">
																	{caseItem.code}
																</span>
															)}
															<span
																className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
																	caseItem.payment_status,
																)}`}
															>
																{caseItem.payment_status}
															</span>
														</div>

														<div className="sm:ml-auto text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
															<Calendar className="h-4 w-4" />
															{format(new Date(caseItem.created_at || caseItem.date), 'dd/MM/yyyy', { locale: es })}
														</div>
													</div>

													<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
														<div>
															<p className="text-xs text-gray-500 dark:text-gray-400">Tipo de Examen</p>
															<p className="text-sm font-medium">{caseItem.exam_type}</p>
														</div>

														<div>
															<p className="text-xs text-gray-500 dark:text-gray-400">Médico Tratante</p>
															<p className="text-sm font-medium">{caseItem.treating_doctor}</p>
														</div>

														<div>
															<p className="text-xs text-gray-500 dark:text-gray-400">Sede</p>
															<div className="mt-1">
																<BranchBadge branch={caseItem.branch} />
															</div>
														</div>

														<div>
															<p className="text-xs text-gray-500 dark:text-gray-400">Monto Total</p>
															<p className="text-sm font-medium">${caseItem.total_amount.toLocaleString()}</p>
														</div>

														<div>
															<p className="text-xs text-gray-500 dark:text-gray-400">Tipo de Muestra</p>
															<p className="text-sm font-medium">{caseItem.sample_type}</p>
														</div>

														<div>
															<p className="text-xs text-gray-500 dark:text-gray-400">Procedencia</p>
															<p className="text-sm font-medium">{caseItem.origin}</p>
														</div>
													</div>

													{caseItem.diagnostico && (
														<div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
															<p className="text-xs text-gray-500 dark:text-gray-400">Diagnóstico</p>
															<p className="text-sm mt-1">{caseItem.diagnostico}</p>
														</div>
													)}
												</div>
											))}
										</div>
									)}
								</div>
							</div>
						</div>
					</motion.div>
				</>
			)}
		</AnimatePresence>
	)
}

export default PatientHistoryModal