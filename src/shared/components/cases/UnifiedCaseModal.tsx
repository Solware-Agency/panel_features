import React, { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
	AlertTriangle,
	Trash2,
	Loader2,
	Edit,
	X,
	Save,
	User,
	FileText,
	DollarSign,
	Microscope,
	PlusCircle,
} from 'lucide-react'
import type { MedicalRecord } from '@lib/supabase-service'
import { updateMedicalRecordWithLog, deleteMedicalRecord, getAgeDisplay } from '@lib/supabase-service'
import { Button } from '@shared/components/ui/button'
import { useToast } from '@shared/hooks/use-toast'
import { useAuth } from '@app/providers/AuthContext'
import { useUserProfile } from '@shared/hooks/useUserProfile'
import { Input } from '@shared/components/ui/input'
import { Textarea } from '@shared/components/ui/textarea'
import { FormDropdown, createDropdownOptions } from '@shared/components/ui/form-dropdown'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import {
	parseDecimalNumber,
	formatNumberForInput,
	isVESPaymentMethod,
	convertVEStoUSD,
	autoCorrectDecimalAmount,
	createCalculatorInputHandlerWithCurrency,
} from '@shared/utils/number-utils'
import { calculatePaymentDetails } from '@features/form/lib/payment/payment-utils'
import { useBodyScrollLock } from '@shared/hooks/useBodyScrollLock'
import { FormField, FormItem, FormLabel, FormControl } from '@shared/components/ui/form'
import { type FormValues } from '@features/form/lib/form-schema'
import { type Control } from 'react-hook-form'

interface UnifiedCaseModalProps {
	case_: MedicalRecord | null
	isOpen: boolean
	onClose: () => void
	onSave?: () => void
	onDelete?: () => void
	control?: Control<FormValues>
	inputStyles?: string
}

const UnifiedCaseModal: React.FC<UnifiedCaseModalProps> = ({
	control,
	inputStyles,
	case_,
	isOpen,
	onClose,
	onSave,
	onDelete,
}) => {
	const [isDeleting, setIsDeleting] = useState(false)
	const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false)
	const [isEditing, setIsEditing] = useState(false)
	const [isSaving, setIsSaving] = useState(false)
	const [formData, setFormData] = useState<Partial<MedicalRecord>>({})
	const { toast } = useToast()
	const { user } = useAuth()
	const { profile } = useUserProfile()
	useBodyScrollLock(isOpen)

	// Estado para los campos de edad cuando no hay control externo
	const [ageValue, setAgeValue] = useState(0)
	const [ageUnit, setAgeUnit] = useState<'MESES' | 'AÑOS'>('AÑOS')

	// Determine if user can edit/delete records (only owners and employees)
	const canEdit = profile?.role === 'owner' || profile?.role === 'employee'
	const canDelete = profile?.role === 'owner' || profile?.role === 'employee'

	// Initialize form data when case changes
	React.useEffect(() => {
		if (case_) {
			setFormData({
				full_name: case_.full_name,
				id_number: case_.id_number,
				phone: case_.phone,
				email: case_.email,
				edad: case_.edad,
				exam_type: case_.exam_type,
				origin: case_.origin,
				treating_doctor: case_.treating_doctor,
				sample_type: case_.sample_type,
				number_of_samples: case_.number_of_samples,
				branch: case_.branch,
				comments: case_.comments,
				// Payment fields
				payment_method_1: case_.payment_method_1,
				payment_amount_1: case_.payment_amount_1,
				payment_reference_1: case_.payment_reference_1,
				payment_method_2: case_.payment_method_2,
				payment_amount_2: case_.payment_amount_2,
				payment_reference_2: case_.payment_reference_2,
				payment_method_3: case_.payment_method_3,
				payment_amount_3: case_.payment_amount_3,
				payment_reference_3: case_.payment_reference_3,
				payment_method_4: case_.payment_method_4,
				payment_amount_4: case_.payment_amount_4,
				payment_reference_4: case_.payment_reference_4,
			})

			// Initialize age values
			setAgeValue(typeof case_.edad === 'number' ? case_.edad : 0)
			setAgeUnit('AÑOS') // Default value, you might want to extract this from case_.edad if available
		}
	}, [case_])

	// Reset editing state when modal closes
	React.useEffect(() => {
		if (!isOpen) {
			setIsEditing(false)
		}
	}, [isOpen])

	// Function to add a new payment method
	const addPaymentMethod = () => {
		// Find the first empty payment method slot
		if (!formData.payment_method_1) {
			setFormData((prev: Partial<MedicalRecord>) => ({
				...prev,
				payment_method_1: '',
				payment_amount_1: 0,
				payment_reference_1: '',
			}))
		} else if (!formData.payment_method_2) {
			setFormData((prev: Partial<MedicalRecord>) => ({
				...prev,
				payment_method_2: '',
				payment_amount_2: 0,
				payment_reference_2: '',
			}))
		} else if (!formData.payment_method_3) {
			setFormData((prev: Partial<MedicalRecord>) => ({
				...prev,
				payment_method_3: '',
				payment_amount_3: 0,
				payment_reference_3: '',
			}))
		} else if (!formData.payment_method_4) {
			setFormData((prev: Partial<MedicalRecord>) => ({
				...prev,
				payment_method_4: '',
				payment_amount_4: 0,
				payment_reference_4: '',
			}))
		} else {
			toast({
				title: 'Límite alcanzado',
				description: 'No se pueden agregar más de 4 métodos de pago.',
				variant: 'destructive',
			})
		}
	}

	// Function to remove a payment method
	const removePaymentMethod = (index: number) => {
		setFormData((prev: Partial<MedicalRecord>) => {
			const updated = { ...prev }
			// Clear the specified payment method
			updated[`payment_method_${index}` as keyof typeof updated] = undefined
			updated[`payment_amount_${index}` as keyof typeof updated] = undefined
			updated[`payment_reference_${index}` as keyof typeof updated] = undefined
			return updated
		})
	}

	const handleInputChange = (field: keyof MedicalRecord, value: string | number | undefined) => {
		setFormData((prev: Partial<MedicalRecord>) => ({
			...prev,
			[field]: value,
		}))
	}

	// Helper function to create calculator input for payment amounts

	const handleSave = async () => {
		if (!case_ || !user) return

		setIsSaving(true)
		try {
			// Prepare changes for logging
			const changes = []

			// Compare each field and add to changes if different
			for (const [key, value] of Object.entries(formData)) {
				const oldValue = case_[key as keyof MedicalRecord]
				if (value !== oldValue) {
					changes.push({
						field: key,
						fieldLabel: getFieldLabel(key),
						oldValue,
						newValue: value,
					})
				}
			}

			if (changes.length === 0) {
				toast({
					title: 'Sin cambios',
					description: 'No se detectaron cambios para guardar.',
					variant: 'default',
				})
				setIsSaving(false)
				setIsEditing(false)
				return
			}

			const { error } = await updateMedicalRecordWithLog(
				case_.id!,
				formData,
				changes,
				user.id,
				user.email || 'unknown@email.com',
			)

			if (error) {
				throw error
			}

			toast({
				title: '✅ Caso actualizado',
				description: 'Los cambios han sido guardados exitosamente.',
				className: 'bg-green-100 border-green-400 text-green-800',
			})

			if (onSave) onSave()
			setIsEditing(false)
		} catch (error) {
			console.error('Error updating case:', error)
			toast({
				title: '❌ Error al guardar',
				description: 'Hubo un problema al guardar los cambios. Inténtalo de nuevo.',
				variant: 'destructive',
			})
		} finally {
			setIsSaving(false)
		}
	}

	const handleDelete = async () => {
		if (!case_ || !user) return

		setIsDeleting(true)
		try {
			const { error } = await deleteMedicalRecord(case_.id!)

			if (error) {
				throw error
			}

			toast({
				title: '✅ Caso eliminado',
				description: 'El caso ha sido eliminado exitosamente.',
				className: 'bg-green-100 border-green-400 text-green-800',
			})

			if (onDelete) onDelete()
			onClose()
		} catch (error) {
			console.error('Error deleting case:', error)
			toast({
				title: '❌ Error al eliminar',
				description: 'Hubo un problema al eliminar el caso. Inténtalo de nuevo.',
				variant: 'destructive',
			})
		} finally {
			setIsDeleting(false)
			setIsConfirmDeleteOpen(false)
		}
	}

	const getFieldLabel = (field: string): string => {
		const labels: Record<string, string> = {
			full_name: 'Nombre Completo',
			id_number: 'Cédula',
			phone: 'Teléfono',
			email: 'Correo Electrónico',
			date_of_birth: 'Fecha de Nacimiento',
			exam_type: 'Tipo de Examen',
			origin: 'Procedencia',
			treating_doctor: 'Médico Tratante',
			sample_type: 'Tipo de Muestra',
			number_of_samples: 'Cantidad de Muestras',
			branch: 'Sede',
			comments: 'Comentarios',
			payment_method_1: 'Método de Pago 1',
			payment_amount_1: 'Monto de Pago 1',
			payment_reference_1: 'Referencia de Pago 1',
			payment_method_2: 'Método de Pago 2',
			payment_amount_2: 'Monto de Pago 2',
			payment_reference_2: 'Referencia de Pago 2',
			payment_method_3: 'Método de Pago 3',
			payment_amount_3: 'Monto de Pago 3',
			payment_reference_3: 'Referencia de Pago 3',
			payment_method_4: 'Método de Pago 4',
			payment_amount_4: 'Monto de Pago 4',
			payment_reference_4: 'Referencia de Pago 4',
		}
		return labels[field] || field
	}

	const getStatusColor = (status: string) => {
		switch (status) {
			case 'Completado':
				return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
			case 'En Proceso':
				return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
			case 'Pendiente':
				return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
			case 'Cancelado':
				return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
			default:
				return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300'
		}
	}

	if (!case_) return null

	// Format date for display
	const formattedDate = case_.date ? format(new Date(case_.date), 'dd/MM/yyyy', { locale: es }) : 'N/A'

	// Get age display from date of birth
	const ageDisplay = case_.edad ? getAgeDisplay(case_.edad) : ''

	// Format date of birth for display

	return (
		<AnimatePresence>
			{isOpen && (
				<>
					{/* Backdrop */}
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						onClick={() => {
							if (!isEditing) {
								onClose()
							}
						}}
						className="fixed inset-0 bg-black/50 z-[99999998]"
					/>

					{/* Main Modal */}
					<motion.div
						initial={{ opacity: 0, scale: 0.95 }}
						animate={{ opacity: 1, scale: 1 }}
						exit={{ opacity: 0, scale: 0.95 }}
						transition={{ type: 'spring', damping: 25, stiffness: 200 }}
						className="fixed inset-0 z-[99999999] flex items-center justify-center p-4"
					>
						<div className="bg-white dark:bg-background rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
							{/* Header */}
							<div className="sticky top-0 bg-white dark:bg-background border-b border-gray-200 dark:border-gray-700 p-4 sm:p-6 z-10">
								<div className="flex items-center justify-between">
									<div>
										<h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
											{isEditing ? 'Editar Caso' : 'Detalles del Caso'}
										</h2>
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
										{!isEditing && canEdit && (
											<button
												onClick={() => setIsEditing(true)}
												className="p-1.5 sm:p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
											>
												<Edit className="w-5 h-5 text-blue-500 dark:text-blue-400" />
											</button>
										)}
										<button
											onClick={onClose}
											className="p-1.5 sm:p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
											disabled={isEditing && isSaving}
										>
											<X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
										</button>
									</div>
								</div>
							</div>

							{/* Content */}
							<div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
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
												{isEditing ? (
													<Input
														value={formData.full_name || ''}
														onChange={(e) => handleInputChange('full_name', e.target.value)}
														className="mt-1"
													/>
												) : (
													<p className="text-sm sm:text-base font-medium">{case_.full_name}</p>
												)}
											</div>
											<div>
												<p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Cédula:</p>
												{isEditing ? (
													<Input
														value={formData.id_number || ''}
														onChange={(e) => handleInputChange('id_number', e.target.value)}
														className="mt-1"
													/>
												) : (
													<p className="text-sm sm:text-base font-medium">{case_.id_number}</p>
												)}
											</div>
										</div>
										<div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
											<div>
												<p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Edad:</p>
												{isEditing ? (
													<div className="mt-1">
														{control ? (
															<>
																<FormField
																	control={control}
																	name="ageValue"
																	render={({ field }) => (
																		<FormItem className="space-y-2 flex flex-col col-span-1">
																			<FormLabel>Edad</FormLabel>
																			<FormControl>
																				<Input
																					type="number"
																					placeholder="0"
																					min="0"
																					max="150"
																					{...field}
																					value={field.value === 0 ? '' : field.value}
																					onChange={(e) => {
																						const value = e.target.value
																						field.onChange(value === '' ? 0 : Number(value))
																					}}
																					className={inputStyles || ''}
																				/>
																			</FormControl>
																		</FormItem>
																	)}
																/>
																<FormField
																	control={control}
																	name="ageUnit"
																	render={({ field }) => (
																		<FormItem className="space-y-2 flex flex-col col-span-1">
																			<FormLabel className="text-transparent">Unidad</FormLabel>
																			<FormControl>
																				<FormDropdown
																					options={createDropdownOptions(['MESES', 'AÑOS'])}
																					value={field.value}
																					onChange={field.onChange}
																					placeholder="Unidad"
																					className={inputStyles || ''}
																				/>
																			</FormControl>
																		</FormItem>
																	)}
																/>
															</>
														) : (
															<>
																<div className="space-y-2 flex flex-col col-span-1">
																	<label className="text-sm font-medium">Edad</label>
																	<Input
																		type="number"
																		placeholder="0"
																		min="0"
																		max="150"
																		value={ageValue === 0 ? '' : ageValue}
																		onChange={(e) => {
																			const value = e.target.value
																			const numValue = value === '' ? 0 : Number(value)
																			setAgeValue(numValue)
																			handleInputChange('edad', numValue)
																		}}
																		className="mt-1"
																	/>
																</div>
																<div className="space-y-2 flex flex-col col-span-1">
																	<label className="text-sm font-medium text-transparent">Unidad</label>
																	<FormDropdown
																		options={createDropdownOptions(['MESES', 'AÑOS'])}
																		value={ageUnit}
																		onChange={(value) => {
																			setAgeUnit(value as 'MESES' | 'AÑOS')
																			// Aquí podrías actualizar el formData si es necesario
																		}}
																		placeholder="Unidad"
																		className="mt-1"
																	/>
																</div>
															</>
														)}
													</div>
												) : (
													<p className="text-sm sm:text-base font-medium">{ageDisplay}</p>
												)}
											</div>
											<div>
												<p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Teléfono:</p>
												{isEditing ? (
													<Input
														value={formData.phone || ''}
														onChange={(e) => handleInputChange('phone', e.target.value)}
														className="mt-1"
													/>
												) : (
													<p className="text-sm sm:text-base font-medium">{case_.phone}</p>
												)}
											</div>
										</div>
										<div>
											<p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Email:</p>
											{isEditing ? (
												<Input
													type="email"
													value={formData.email || ''}
													onChange={(e) => handleInputChange('email', e.target.value)}
													className="mt-1"
												/>
											) : (
												<p className="text-sm sm:text-base font-medium break-words">{case_.email || 'N/A'}</p>
											)}
										</div>
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
												{isEditing ? (
													<FormDropdown
														options={createDropdownOptions([
															{ value: 'inmunohistoquimica', label: 'Inmunohistoquímica' },
															{ value: 'biopsia', label: 'Biopsia' },
															{ value: 'citologia', label: 'Citología' },
														])}
														value={formData.exam_type || ''}
														onChange={(value) => handleInputChange('exam_type', value)}
														placeholder="Seleccione tipo de examen"
														className="mt-1"
													/>
												) : (
													<p className="text-sm sm:text-base font-medium">{case_.exam_type}</p>
												)}
											</div>

											{/* Treating Doctor */}
											<div>
												<p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Médico tratante:</p>
												{isEditing ? (
													<Input
														value={formData.treating_doctor || ''}
														onChange={(e) => handleInputChange('treating_doctor', e.target.value)}
														className="mt-1"
													/>
												) : (
													<p className="text-sm sm:text-base font-medium">{case_.treating_doctor}</p>
												)}
											</div>
										</div>

										<div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
											{/* Origin */}
											<div>
												<p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Procedencia:</p>
												{isEditing ? (
													<Input
														value={formData.origin || ''}
														onChange={(e) => handleInputChange('origin', e.target.value)}
														className="mt-1"
													/>
												) : (
													<p className="text-sm sm:text-base font-medium">{case_.origin}</p>
												)}
											</div>

											{/* Branch */}
											<div>
												<p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Sede:</p>
												{isEditing ? (
													<FormDropdown
														options={createDropdownOptions(['PMG', 'CPC', 'CNX', 'STX', 'MCY'])}
														value={formData.branch || ''}
														onChange={(value) => handleInputChange('branch', value)}
														placeholder="Seleccione sede"
														className="mt-1"
													/>
												) : (
													<p className="text-sm sm:text-base font-medium">{case_.branch}</p>
												)}
											</div>
										</div>

										<div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
											{/* Sample Type */}
											<div>
												<p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Muestra:</p>
												{isEditing ? (
													<Input
														value={formData.sample_type || ''}
														onChange={(e) => handleInputChange('sample_type', e.target.value)}
														className="mt-1"
													/>
												) : (
													<p className="text-sm sm:text-base font-medium">{case_.sample_type}</p>
												)}
											</div>

											{/* Number of Samples */}
											<div>
												<p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Cantidad de muestras:</p>
												{isEditing ? (
													<Input
														type="number"
														value={formData.number_of_samples || 0}
														onChange={(e) => handleInputChange('number_of_samples', parseInt(e.target.value))}
														className="mt-1"
													/>
												) : (
													<p className="text-sm sm:text-base font-medium">{case_.number_of_samples}</p>
												)}
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
										<div className="flex items-center gap-2">
											<DollarSign className="text-purple-500 size-6" />
											<h3 className="text-lg sm:text-xl font-semibold">Información de Pago</h3>
										</div>
										{isEditing && (
											<Button variant="outline" size="sm" onClick={addPaymentMethod} className="ml-auto text-xs">
												<PlusCircle className="w-3 h-3 mr-1" />
												Agregar Método
											</Button>
										)}
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
													<div>
														<p className="text-xs sm:text-sm font-medium text-red-800 dark:text-red-300">
															Monto pendiente: ${case_.remaining.toLocaleString()}
														</p>
														{case_.exchange_rate && (
															<p className="text-xs text-red-700 dark:text-red-400 mt-1">
																Equivalente: Bs {(case_.remaining * case_.exchange_rate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
															</p>
														)}
													</div>
												</div>
											</div>
										)}

										{/* Payment Summary when editing */}
										{isEditing && case_?.exchange_rate && (
											<div className="bg-blue-50 dark:bg-blue-900/20 p-2 sm:p-3 rounded-lg border border-blue-200 dark:border-blue-800">
												<h4 className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-2">Resumen de Pagos</h4>
												<div className="space-y-1 text-xs">
													<div className="flex justify-between">
														<span className="text-blue-700 dark:text-blue-400">Tasa de cambio:</span>
														<span className="font-medium">{case_.exchange_rate.toFixed(2)} Bs/USD</span>
													</div>
													{(() => {
														// Convert formData to payments array format
														const payments = []
														for (let i = 1; i <= 4; i++) {
															const method = formData[`payment_method_${i}` as keyof typeof formData] as string | null
															const amount = formData[`payment_amount_${i}` as keyof typeof formData] as number | null
															const reference = formData[`payment_reference_${i}` as keyof typeof formData] as
																| string
																| null

															if (method && amount && amount > 0) {
																payments.push({
																	method,
																	amount,
																	reference: reference || '',
																})
															}
														}

														// Use the same function that calculates payment status in the form
														const { isPaymentComplete, missingAmount } = calculatePaymentDetails(
															payments,
															case_.total_amount,
															case_.exchange_rate,
														)

														// Generate payment details with auto-correction info
														const paymentDetails = []
														let totalUSD = 0

														for (let i = 1; i <= 4; i++) {
															const method = formData[`payment_method_${i}` as keyof typeof formData] as string | null
															let amount = formData[`payment_amount_${i}` as keyof typeof formData] as number | null

															if (method && amount && amount > 0) {
																// Auto-correct suspicious amounts from database
																const { correctedAmount, wasCorreted, reason } = autoCorrectDecimalAmount(
																	amount,
																	method,
																	case_.exchange_rate,
																)

																if (wasCorreted) {
																	console.warn(`Auto-corrección aplicada en pago ${i}:`, reason)
																	amount = correctedAmount
																}

																if (isVESPaymentMethod(method)) {
																	const usdAmount = convertVEStoUSD(amount, case_.exchange_rate!)
																	totalUSD += usdAmount
																	paymentDetails.push(
																		<div key={i} className="space-y-1">
																			<div className="flex justify-between text-gray-600 dark:text-gray-400">
																				<span>
																					{method}:{' '}
																					{amount.toLocaleString('es-VE', {
																						minimumFractionDigits: 2,
																						maximumFractionDigits: 2,
																					})}{' '}
																					Bs
																				</span>
																				<span>≈ ${usdAmount.toFixed(2)} USD</span>
																			</div>
																			{wasCorreted && (
																				<div className="text-xs text-orange-600 dark:text-orange-400 italic">
																					⚠️ Auto-corregido desde BD
																				</div>
																			)}
																		</div>,
																	)
																} else {
																	totalUSD += amount
																	paymentDetails.push(
																		<div key={i} className="flex justify-between text-gray-600 dark:text-gray-400">
																			<span>
																				{method}: ${amount.toFixed(2)} USD
																			</span>
																			<span>${amount.toFixed(2)} USD</span>
																		</div>,
																	)
																}
															}
														}

														return (
															<>
																{paymentDetails}
																<div className="border-t border-blue-200 dark:border-blue-700 pt-1 mt-2">
																	<div className="flex justify-between font-medium">
																		<span>Total pagado (USD):</span>
																		<span>${totalUSD.toFixed(2)}</span>
																	</div>
																	<div className="flex justify-between">
																		<span>Monto total:</span>
																		<span>${case_.total_amount.toFixed(2)}</span>
																	</div>
																	<div
																		className={`flex justify-between font-bold ${
																			isPaymentComplete
																				? 'text-green-600'
																				: missingAmount > 0
																				? 'text-red-600'
																				: 'text-orange-600'
																		}`}
																	>
																		<span>
																			{isPaymentComplete ? 'Estado:' : missingAmount > 0 ? 'Pendiente:' : 'Exceso:'}
																		</span>
																		<span>
																			{isPaymentComplete ? 'Completado' : `$${Math.abs(missingAmount).toFixed(2)}`}
																		</span>
																	</div>
																</div>
															</>
														)
													})()}
												</div>
											</div>
										)}

										{/* Payment Methods */}
										<div className="space-y-2 sm:space-y-3">
											<p className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">
												Métodos de pago:
											</p>

											{/* Payment Method 1 */}
											{(isEditing || case_.payment_method_1) && (
												<div className="bg-gray-50 dark:bg-gray-800/50 p-2 sm:p-3 rounded-lg">
													{isEditing ? (
														<div className="grid grid-cols-1 md:grid-cols-3 gap-2">
															<div>
																<p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Método:</p>
																<FormDropdown
																	options={createDropdownOptions([
																		'Punto de venta',
																		'Dólares en efectivo',
																		'Zelle',
																		'Pago móvil',
																		'Bs en efectivo',
																	])}
																	value={formData.payment_method_1 || ''}
																	onChange={(value) => handleInputChange('payment_method_1', value)}
																	placeholder="Seleccionar método"
																/>
															</div>
															<div>
																{(() => {
																	const calculatorHandler = createCalculatorInputHandlerWithCurrency(
																		formData.payment_amount_1 || 0,
																		(newValue) => handleInputChange('payment_amount_1', newValue),
																		formData.payment_method_1,
																		case_?.exchange_rate ?? undefined,
																	)

																	return (
																		<>
																			<p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
																				Monto
																				{isVESPaymentMethod(formData.payment_method_1 || undefined) ? ' (Bs)' : ' ($)'}:
																			</p>
																			<Input
																				type="text"
																				inputMode="decimal"
																				placeholder={calculatorHandler.placeholder}
																				value={calculatorHandler.displayValue}
																				onKeyDown={calculatorHandler.handleKeyDown}
																				onPaste={calculatorHandler.handlePaste}
																				onFocus={calculatorHandler.handleFocus}
																				onChange={calculatorHandler.handleChange}
																				className="text-right font-mono"
																				autoComplete="off"
																			/>
																			{calculatorHandler.conversionText && (
																				<p className="text-xs text-green-600 dark:text-green-400 mt-1">
																					{calculatorHandler.conversionText}
																				</p>
																			)}
																		</>
																	)
																})()}
															</div>
															<div className="flex items-end gap-2">
																<div className="flex-1">
																	<p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Referencia:</p>
																	<Input
																		value={formData.payment_reference_1 || ''}
																		onChange={(e) => handleInputChange('payment_reference_1', e.target.value)}
																		placeholder="Referencia"
																	/>
																</div>
																<Button
																	variant="ghost"
																	size="sm"
																	onClick={() => removePaymentMethod(1)}
																	className="text-red-500 hover:text-red-700 hover:bg-red-100"
																>
																	<X className="w-4 h-4" />
																</Button>
															</div>
														</div>
													) : (
														<>
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
														</>
													)}
												</div>
											)}

											{/* Payment Method 2 */}
											{(isEditing || case_.payment_method_2) && (
												<div className="bg-gray-50 dark:bg-gray-800/50 p-2 sm:p-3 rounded-lg">
													{isEditing ? (
														<div className="grid grid-cols-1 md:grid-cols-3 gap-2">
															<div>
																<p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Método:</p>
																<FormDropdown
																	options={createDropdownOptions([
																		'Punto de venta',
																		'Dólares en efectivo',
																		'Zelle',
																		'Pago móvil',
																		'Bs en efectivo',
																	])}
																	value={formData.payment_method_2 || ''}
																	onChange={(value) => handleInputChange('payment_method_2', value)}
																	placeholder="Seleccionar método"
																/>
															</div>
															<div>
																<p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
																	Monto{isVESPaymentMethod(formData.payment_method_2 || undefined) ? ' (Bs)' : ' ($)'}:
																</p>
																<Input
																	type="text"
																	inputMode="decimal"
																	value={formatNumberForInput(formData.payment_amount_2 || 0)}
																	onChange={(e) => {
																		const parsedValue = parseDecimalNumber(e.target.value)
																		handleInputChange('payment_amount_2', parsedValue)
																	}}
																	placeholder="0,00"
																	className="text-right"
																/>
																{isVESPaymentMethod(formData.payment_method_2 || undefined) &&
																	case_?.exchange_rate &&
																	formData.payment_amount_2 && (
																		<p className="text-xs text-green-600 mt-1">
																			≈ ${convertVEStoUSD(formData.payment_amount_2, case_.exchange_rate).toFixed(2)}{' '}
																			USD
																		</p>
																	)}
															</div>
															<div className="flex items-end gap-2">
																<div className="flex-1">
																	<p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Referencia:</p>
																	<Input
																		value={formData.payment_reference_2 || ''}
																		onChange={(e) => handleInputChange('payment_reference_2', e.target.value)}
																		placeholder="Referencia"
																	/>
																</div>
																<Button
																	variant="ghost"
																	size="sm"
																	onClick={() => removePaymentMethod(2)}
																	className="text-red-500 hover:text-red-700 hover:bg-red-100"
																>
																	<X className="w-4 h-4" />
																</Button>
															</div>
														</div>
													) : (
														<>
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
														</>
													)}
												</div>
											)}

											{/* Payment Method 3 */}
											{(isEditing || case_.payment_method_3) && (
												<div className="bg-gray-50 dark:bg-gray-800/50 p-2 sm:p-3 rounded-lg">
													{isEditing ? (
														<div className="grid grid-cols-1 md:grid-cols-3 gap-2">
															<div>
																<p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Método:</p>
																<FormDropdown
																	options={createDropdownOptions([
																		'Punto de venta',
																		'Dólares en efectivo',
																		'Zelle',
																		'Pago móvil',
																		'Bs en efectivo',
																	])}
																	value={formData.payment_method_3 || ''}
																	onChange={(value) => handleInputChange('payment_method_3', value)}
																	placeholder="Seleccionar método"
																/>
															</div>
															<div>
																<p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
																	Monto{isVESPaymentMethod(formData.payment_method_3 || undefined) ? ' (Bs)' : ' ($)'}:
																</p>
																<Input
																	type="text"
																	inputMode="decimal"
																	value={formatNumberForInput(formData.payment_amount_3 || 0)}
																	onChange={(e) => {
																		const parsedValue = parseDecimalNumber(e.target.value)
																		handleInputChange('payment_amount_3', parsedValue)
																	}}
																	placeholder="0,00"
																	className="text-right"
																/>
																{isVESPaymentMethod(formData.payment_method_3 || undefined) &&
																	case_?.exchange_rate &&
																	formData.payment_amount_3 && (
																		<p className="text-xs text-green-600 mt-1">
																			≈ ${convertVEStoUSD(formData.payment_amount_3, case_.exchange_rate).toFixed(2)}{' '}
																			USD
																		</p>
																	)}
															</div>
															<div className="flex items-end gap-2">
																<div className="flex-1">
																	<p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Referencia:</p>
																	<Input
																		value={formData.payment_reference_3 || ''}
																		onChange={(e) => handleInputChange('payment_reference_3', e.target.value)}
																		placeholder="Referencia"
																	/>
																</div>
																<Button
																	variant="ghost"
																	size="sm"
																	onClick={() => removePaymentMethod(3)}
																	className="text-red-500 hover:text-red-700 hover:bg-red-100"
																>
																	<X className="w-4 h-4" />
																</Button>
															</div>
														</div>
													) : (
														<>
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
														</>
													)}
												</div>
											)}

											{/* Payment Method 4 */}
											{(isEditing || case_.payment_method_4) && (
												<div className="bg-gray-50 dark:bg-gray-800/50 p-2 sm:p-3 rounded-lg">
													{isEditing ? (
														<div className="grid grid-cols-1 md:grid-cols-3 gap-2">
															<div>
																<p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Método:</p>
																<FormDropdown
																	options={createDropdownOptions([
																		'Punto de venta',
																		'Dólares en efectivo',
																		'Zelle',
																		'Pago móvil',
																		'Bs en efectivo',
																	])}
																	value={formData.payment_method_4 || ''}
																	onChange={(value) => handleInputChange('payment_method_4', value)}
																	placeholder="Seleccionar método"
																/>
															</div>
															<div>
																<p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
																	Monto{isVESPaymentMethod(formData.payment_method_4 || undefined) ? ' (Bs)' : ' ($)'}:
																</p>
																<Input
																	type="text"
																	inputMode="decimal"
																	value={formatNumberForInput(formData.payment_amount_4 || 0)}
																	onChange={(e) => {
																		const parsedValue = parseDecimalNumber(e.target.value)
																		handleInputChange('payment_amount_4', parsedValue)
																	}}
																	placeholder="0,00"
																	className="text-right"
																/>
																{isVESPaymentMethod(formData.payment_method_4 || undefined) &&
																	case_?.exchange_rate &&
																	formData.payment_amount_4 && (
																		<p className="text-xs text-green-600 mt-1">
																			≈ ${convertVEStoUSD(formData.payment_amount_4, case_.exchange_rate).toFixed(2)}{' '}
																			USD
																		</p>
																	)}
															</div>
															<div className="flex items-end gap-2">
																<div className="flex-1">
																	<p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Referencia:</p>
																	<Input
																		value={formData.payment_reference_4 || ''}
																		onChange={(e) => handleInputChange('payment_reference_4', e.target.value)}
																		placeholder="Referencia"
																	/>
																</div>
																<Button
																	variant="ghost"
																	size="sm"
																	onClick={() => removePaymentMethod(4)}
																	className="text-red-500 hover:text-red-700 hover:bg-red-100"
																>
																	<X className="w-4 h-4" />
																</Button>
															</div>
														</div>
													) : (
														<>
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
														</>
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
										{isEditing ? (
											<div>
												<p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Comentarios:</p>
												<Textarea
													value={formData.comments || ''}
													onChange={(e) => handleInputChange('comments', e.target.value)}
													className="mt-1"
													placeholder="Agregar comentarios..."
												/>
											</div>
										) : (
											case_.comments && (
												<div>
													<p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Comentarios:</p>
													<p className="text-sm sm:text-base">{case_.comments}</p>
												</div>
											)
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

								{/* Action Buttons */}
								{isEditing ? (
									<div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
										<Button
											variant="outline"
											onClick={() => {
												setIsEditing(false)
												// Reset form data to original values
												if (case_) {
													setFormData({
														full_name: case_.full_name,
														id_number: case_.id_number,
														phone: case_.phone,
														edad: case_.edad,
														email: case_.email,
														exam_type: case_.exam_type,
														origin: case_.origin,
														treating_doctor: case_.treating_doctor,
														sample_type: case_.sample_type,
														number_of_samples: case_.number_of_samples,
														branch: case_.branch,
														comments: case_.comments,
														payment_method_1: case_.payment_method_1,
														payment_amount_1: case_.payment_amount_1,
														payment_reference_1: case_.payment_reference_1,
														payment_method_2: case_.payment_method_2,
														payment_amount_2: case_.payment_amount_2,
														payment_reference_2: case_.payment_reference_2,
														payment_method_3: case_.payment_method_3,
														payment_amount_3: case_.payment_amount_3,
														payment_reference_3: case_.payment_reference_3,
														payment_method_4: case_.payment_method_4,
														payment_amount_4: case_.payment_amount_4,
														payment_reference_4: case_.payment_reference_4,
													})
												}
											}}
											className="flex-1"
											disabled={isSaving}
										>
											Cancelar
										</Button>
										<Button onClick={handleSave} className="flex-1 bg-primary hover:bg-primary/80" disabled={isSaving}>
											{isSaving ? (
												<>
													<Loader2 className="w-4 h-4 mr-2 animate-spin" />
													Guardando...
												</>
											) : (
												<>
													<Save className="w-4 h-4 mr-2" />
													Guardar Cambios
												</>
											)}
										</Button>
									</div>
								) : (
									canDelete && (
										<div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
											<Button
												onClick={() => setIsConfirmDeleteOpen(true)}
												variant="destructive"
												className="flex items-center gap-2"
											>
												<Trash2 className="w-4 h-4" />
												Eliminar Caso
											</Button>
										</div>
									)
								)}
							</div>
						</div>
					</motion.div>

					{/* Confirmation Modal for Delete */}
					<AnimatePresence>
						{isConfirmDeleteOpen && (
							<>
								<motion.div
									initial={{ opacity: 0 }}
									animate={{ opacity: 1 }}
									exit={{ opacity: 0 }}
									className="fixed inset-0 bg-black/70 z-[999999999]"
								/>
								<motion.div
									initial={{ opacity: 0, scale: 0.95 }}
									animate={{ opacity: 1, scale: 1 }}
									exit={{ opacity: 0, scale: 0.95 }}
									className="fixed inset-0 flex items-center justify-center z-[999999999] p-4"
								>
									<div className="bg-white dark:bg-background rounded-xl shadow-2xl max-w-md w-full max-h-[80vh] overflow-y-auto">
										<div className="p-6">
											<div className="flex items-center gap-3 mb-4">
												<div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
													<AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
												</div>
												<h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
													Confirmar Eliminación
												</h3>
											</div>

											<p className="text-gray-600 dark:text-gray-400 mb-4">
												¿Estás seguro de que deseas eliminar este caso? Esta acción no se puede deshacer.
											</p>

											<div className="flex gap-3">
												<Button
													variant="outline"
													onClick={() => setIsConfirmDeleteOpen(false)}
													className="flex-1"
													disabled={isDeleting}
												>
													Cancelar
												</Button>
												<Button
													onClick={handleDelete}
													disabled={isDeleting}
													className="flex-1 bg-red-600 hover:bg-red-700 text-white"
												>
													{isDeleting ? (
														<>
															<Loader2 className="w-4 h-4 mr-2 animate-spin" />
															Eliminando...
														</>
													) : (
														<>
															<Trash2 className="w-4 h-4 mr-2" />
															Eliminar
														</>
													)}
												</Button>
											</div>
										</div>
									</div>
								</motion.div>
							</>
						)}
					</AnimatePresence>
				</>
			)}
		</AnimatePresence>
	)
}

export default UnifiedCaseModal
