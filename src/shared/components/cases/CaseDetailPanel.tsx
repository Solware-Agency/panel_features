import React from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { X, User, FileText, DollarSign, AlertTriangle, Microscope } from 'lucide-react'
import type { MedicalRecord } from '@lib/supabase-service'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { BranchBadge } from '@shared/components/ui/branch-badge'

interface CaseDetailPanelProps {
	case_: MedicalRecord | null
	isOpen: boolean
	onClose: () => void
	onCaseSelect: (case_: MedicalRecord) => void
}

const CaseDetailPanel: React.FC<CaseDetailPanelProps> = ({ case_, isOpen, onClose }) => {
	if (!case_) return null

	// Format date for display
	const formattedDate = case_.date ? format(new Date(case_.date), 'dd/MM/yyyy', { locale: es }) : 'N/A'

	// Get age display
	const ageDisplay = case_.edad || 'Sin edad'

	// Get payment status color
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

					{/* Main Panel */}
					<motion.div
						initial={{ x: '100%' }}
						animate={{ x: 0 }}
						exit={{ x: '100%' }}
						transition={{ type: 'spring', damping: 25, stiffness: 200 }}
						className="fixed right-0 top-0 h-full w-full sm:w-2/3 lg:w-1/2 xl:w-2/5 bg-white dark:bg-background shadow-2xl z-[99999999] overflow-y-auto rounded-lg border-l border-input flex flex-col"
					>
						{/* Header */}
						<div className="sticky top-0 bg-white dark:bg-background border-b border-gray-200 dark:border-gray-700 p-3 sm:p-6 z-10">
							<div className="flex items-center justify-between">
								<div>
									<h2 className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-gray-100">Detalles del Caso</h2>
									<div className="flex items-center gap-1.5 sm:gap-2 mt-1 sm:mt-2">
										{case_.code && (
											<span className="inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">
												{case_.code}
											</span>
										)}
										<span
											className={`inline-flex px-1.5 sm:px-2 py-0.5 sm:py-1 text-xs font-semibold rounded-full ${getStatusColor(
												case_.payment_status,
											)}`}
										>
											{case_.payment_status}
										</span>
									</div>
								</div>
								<div className="flex items-center gap-2">
									<button
										onClick={onClose}
										className="p-1.5 sm:p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
									>
										<X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
									</button>
								</div>
							</div>
						</div>

						{/* Content */}
						<div className="p-3 sm:p-6 space-y-4 sm:space-y-6 overflow-y-auto flex-1">
							{/* Patient Information */}
							<div className="bg-white dark:bg-background rounded-lg p-3 sm:p-4 border border-input">
								<div className="flex items-center gap-1.5 sm:gap-2 mb-3 sm:mb-4">
									<User className="text-blue-500 size-6" />
									<h3 className="text-lg sm:text-xl font-semibold">Información del Paciente</h3>
								</div>
								<div className="space-y-3 sm:space-y-4">
									<div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
										<div>
											<p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Nombre completo:</p>
											<p className="text-sm sm:text-base font-medium">{case_.full_name}</p>
										</div>
										<div>
											<p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Cédula:</p>
											<p className="text-sm sm:text-base font-medium">{case_.id_number}</p>
										</div>
									</div>
									<div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
										<div>
											<p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Edad:</p>
											<p className="text-sm sm:text-base font-medium">
												{ageDisplay}
											</p>
										</div>
										<div>
											<p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Teléfono:</p>
											<p className="text-sm sm:text-base font-medium">{case_.phone}</p>
										</div>
									</div>
									{case_.email && (
										<div>
											<p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Email:</p>
											<p className="text-sm sm:text-base font-medium break-words">{case_.email}</p>
										</div>
									)}
								</div>
							</div>

							{/* Medical Information */}
							<div className="bg-white dark:bg-background rounded-lg p-3 sm:p-4 border border-input">
								<div className="flex items-center justify-between gap-1.5 sm:gap-2 mb-3 sm:mb-4">
									<div className="flex items-center gap-2">
										<Microscope className="text-primary size-6" />
										<h3 className="text-lg sm:text-xl font-semibold">Información Médica</h3>
									</div>
								</div>
								<div className="space-y-3 sm:space-y-4">
									<div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
										{/* Exam Type */}
										<div>
											<p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Estudio:</p>
											<p className="text-sm sm:text-base font-medium">{case_.exam_type}</p>
										</div>

										{/* Treating Doctor */}
										<div>
											<p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Médico tratante:</p>
											<p className="text-sm sm:text-base font-medium">{case_.treating_doctor}</p>
										</div>
									</div>

									<div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
										{/* Origin */}
										<div>
											<p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Procedencia:</p>
											<p className="text-sm sm:text-base font-medium">{case_.origin}</p>
										</div>

										{/* Branch */}
										<div className="flex flex-col">
											<p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Sede:</p>
											<div className="mt-1">
												<BranchBadge branch={case_.branch} />
											</div>
										</div>
									</div>

									<div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
										{/* Sample Type */}
										<div>
											<p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Muestra:</p>
											<p className="text-sm sm:text-base font-medium">{case_.sample_type}</p>
										</div>

										{/* Number of Samples */}
										<div>
											<p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Cantidad de muestras:</p>
											<p className="text-sm sm:text-base font-medium">{case_.number_of_samples}</p>
										</div>
									</div>

									{/* Registration Date */}
									<div>
										<p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Fecha de registro:</p>
										<p className="text-sm sm:text-base font-medium">{formattedDate}</p>
									</div>
								</div>
							</div>

							{/* Biopsy Information (only for biopsy cases) */}
							{case_.exam_type?.toLowerCase() === 'biopsia' && (
								<div className="bg-white dark:bg-background rounded-lg p-3 sm:p-4 border border-input">
									<div className="flex items-center gap-1.5 sm:gap-2 mb-3 sm:mb-4">
										<FileText className="text-green-500 size-6" />
										<h3 className="text-lg sm:text-xl font-semibold">Información de Biopsia</h3>
									</div>
									<div className="space-y-3 sm:space-y-4">
										{/* Material Remitido */}
										<div>
											<p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Material Remitido:</p>
											<p className="text-sm sm:text-base">{case_.material_remitido || 'No especificado'}</p>
										</div>

										{/* Información Clínica */}
										<div>
											<p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Información Clínica:</p>
											<p className="text-sm sm:text-base">{case_.informacion_clinica || 'No especificado'}</p>
										</div>

										{/* Descripción Macroscópica */}
										<div>
											<p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Descripción Macroscópica:</p>
											<p className="text-sm sm:text-base">{case_.descripcion_macroscopica || 'No especificado'}</p>
										</div>

										{/* Diagnóstico */}
										<div>
											<p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Diagnóstico:</p>
											<p className="text-sm sm:text-base">{case_.diagnostico || 'No especificado'}</p>
										</div>

										{/* Comentario */}
										<div>
											<p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Comentario:</p>
											<p className="text-sm sm:text-base">{case_.comentario || 'No especificado'}</p>
										</div>
									</div>
								</div>
							)}

							{/* Payment Information */}
							<div className="bg-white dark:bg-background rounded-lg p-3 sm:p-4 border border-input">
								<div className="flex items-center gap-1.5 sm:gap-2 mb-3 sm:mb-4">
									<DollarSign className="text-purple-500 size-6" />
									<h3 className="text-lg sm:text-xl font-semibold">Información de Pago</h3>
								</div>
								<div className="space-y-3 sm:space-y-4">
									<div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
										<div>
											<p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Monto total:</p>
											<p className="text-sm sm:text-base font-medium">${case_.total_amount.toLocaleString()}</p>
										</div>
										<div>
											<p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Estatus:</p>
											<div
												className={`inline-flex px-1.5 sm:px-2 py-0.5 sm:py-1 text-xs sm:text-sm font-semibold rounded-full ${getStatusColor(
													case_.payment_status,
												)}`}
											>
												{case_.payment_status}
											</div>
										</div>
									</div>

									{case_.remaining > 0 && (
										<div className="bg-red-50 dark:bg-red-900/20 p-2 sm:p-3 rounded-lg border border-red-200 dark:border-red-800">
											<div className="flex items-center gap-1.5 sm:gap-2">
												<AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
												<p className="text-xs sm:text-sm font-medium text-red-800 dark:text-red-300">
													Monto pendiente: ${case_.remaining.toLocaleString()}
												</p>
											</div>
										</div>
									)}

									{/* Payment Methods */}
									<div className="space-y-2 sm:space-y-3">
										<p className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">Métodos de pago:</p>
										{case_.payment_method_1 && (
											<div className="bg-gray-50 dark:bg-gray-800/50 p-2 sm:p-3 rounded-lg">
												<div className="flex justify-between items-center">
													<p className="text-xs sm:text-sm font-medium">{case_.payment_method_1}</p>
													<p className="text-xs sm:text-sm font-medium">
														${case_.payment_amount_1?.toLocaleString() || 0}
													</p>
												</div>
												{case_.payment_reference_1 && (
													<p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 mt-0.5 sm:mt-1">
														Ref: {case_.payment_reference_1}
													</p>
												)}
											</div>
										)}
										{case_.payment_method_2 && (
											<div className="bg-gray-50 dark:bg-gray-800/50 p-2 sm:p-3 rounded-lg">
												<div className="flex justify-between items-center">
													<p className="text-xs sm:text-sm font-medium">{case_.payment_method_2}</p>
													<p className="text-xs sm:text-sm font-medium">
														${case_.payment_amount_2?.toLocaleString() || 0}
													</p>
												</div>
												{case_.payment_reference_2 && (
													<p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 mt-0.5 sm:mt-1">
														Ref: {case_.payment_reference_2}
													</p>
												)}
											</div>
										)}
										{case_.payment_method_3 && (
											<div className="bg-gray-50 dark:bg-gray-800/50 p-2 sm:p-3 rounded-lg">
												<div className="flex justify-between items-center">
													<p className="text-xs sm:text-sm font-medium">{case_.payment_method_3}</p>
													<p className="text-xs sm:text-sm font-medium">
														${case_.payment_amount_3?.toLocaleString() || 0}
													</p>
												</div>
												{case_.payment_reference_3 && (
													<p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 mt-0.5 sm:mt-1">
														Ref: {case_.payment_reference_3}
													</p>
												)}
											</div>
										)}
										{case_.payment_method_4 && (
											<div className="bg-gray-50 dark:bg-gray-800/50 p-2 sm:p-3 rounded-lg">
												<div className="flex justify-between items-center">
													<p className="text-xs sm:text-sm font-medium">{case_.payment_method_4}</p>
													<p className="text-xs sm:text-sm font-medium">
														${case_.payment_amount_4?.toLocaleString() || 0}
													</p>
												</div>
												{case_.payment_reference_4 && (
													<p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 mt-0.5 sm:mt-1">
														Ref: {case_.payment_reference_4}
													</p>
												)}
											</div>
										)}
									</div>
								</div>
							</div>

							{/* Additional Information */}
							<div className="bg-white dark:bg-background rounded-lg p-3 sm:p-4 border border-input">
								<div className="flex items-center gap-1.5 sm:gap-2 mb-3 sm:mb-4">
									<FileText className="text-blue-500 size-6" />
									<h3 className="text-lg sm:text-xl font-semibold">Información Adicional</h3>
								</div>
								<div className="space-y-3 sm:space-y-4">
									{case_.comments && (
										<div>
											<p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Comentarios:</p>
											<p className="text-sm sm:text-base">{case_.comments}</p>
										</div>
									)}
									<div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
										<div>
											<p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Fecha de creación:</p>
											<p className="text-sm sm:text-base">
												{case_.created_at
													? format(new Date(case_.created_at), 'dd/MM/yyyy HH:mm', { locale: es })
													: 'N/A'}
											</p>
										</div>
										{case_.created_by_display_name && (
											<div>
												<p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Creado por:</p>
												<p className="text-sm sm:text-base">{case_.created_by_display_name}</p>
											</div>
										)}
									</div>
								</div>
							</div>
						</div>
					</motion.div>
				</>
			)}
		</AnimatePresence>
	)
}

export default CaseDetailPanel
