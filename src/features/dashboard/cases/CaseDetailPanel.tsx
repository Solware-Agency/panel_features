import React, { useState, useEffect } from 'react'
import {
	X,
	User,
	Stethoscope,
	CreditCard,
	FileText,
	CheckCircle,
	Hash,
	UserCheck,
	Edit,
	Trash2,
	Loader2,
	AlertCircle,
	Save,
	XCircle,
	Plus,
	DollarSign,
	History,
	Eye,
} from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import type { MedicalRecord } from '@lib/supabase-service'
import {
	deleteMedicalRecord,
	updateMedicalRecordWithLog,
	getChangeLogsForRecord,
} from '@lib/supabase-service'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@lib/supabase/config'
import { useToast } from '@shared/hooks/use-toast'
import { Button } from '@shared/components/ui/button'
import { Input } from '@shared/components/ui/input'
import { Textarea } from '@shared/components/ui/textarea'
import { FormDropdown, createDropdownOptions } from '@shared/components/ui/form-dropdown'
import { useAuth } from '@app/providers/AuthContext'
import {
	parseDecimalNumber,
	formatNumberForInput,
	createNumberInputHandler,
	isVESPaymentMethod,
	convertVEStoUSD,
} from '@shared/utils/number-utils'

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
}

interface CaseDetailPanelProps {
	case_: MedicalRecord | null
	isOpen: boolean
	onClose: () => void
	onCaseUpdated?: () => void
}

const CaseDetailPanel: React.FC<CaseDetailPanelProps> = ({ case_, isOpen, onClose, onCaseUpdated }) => {
	const { toast } = useToast()
	const { user } = useAuth()
	const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
	const [isDeleting, setIsDeleting] = useState(false)
	const [isEditing, setIsEditing] = useState(false)
	const [isSaving, setIsSaving] = useState(false)
	const [editedCase, setEditedCase] = useState<Partial<MedicalRecord>>({})
	const [isAddPaymentModalOpen, setIsAddPaymentModalOpen] = useState(false)
	const [newPayment, setNewPayment] = useState({
		method: '',
		amount: '',
		reference: '',
	})
	const [isChangelogOpen, setIsChangelogOpen] = useState(false)

	// Query to get the user who created the record
	const { data: creatorData } = useQuery({
		queryKey: ['record-creator', case_?.id],
		queryFn: async () => {
			if (!case_) return null

			// First try to get creator info from the record itself (for new records)
			if (case_.created_by && case_.created_by_display_name) {
				return {
					id: case_.created_by,
					email: '', // We don't have the email in the record
					displayName: case_.created_by_display_name,
				}
			}

			// If not available, try to get from change logs
			if (!case_.id) return null

			const { data, error } = await supabase
				.from('change_logs')
				.select('user_id, user_email')
				.eq('medical_record_id', case_.id)
				.order('changed_at', { ascending: true })
				.limit(1)

			if (error) {
				console.error('Error fetching record creator:', error)
				return null
			}

			if (data && data.length > 0) {
				// Get the user profile to get the display name
				const { data: profileData } = await supabase
					.from('profiles')
					.select('display_name')
					.eq('id', data[0].user_id)
					.single()

				return {
					id: data[0].user_id,
					email: data[0].user_email,
					displayName: profileData?.display_name || null,
				}
			}

			return null
		},
		enabled: !!case_?.id && isOpen,
	})

	// Query to get change logs for this record
	const {
		data: changelogsData,
		isLoading: isLoadingChangelogs,
		refetch: refetchChangelogs,
	} = useQuery({
		queryKey: ['record-changelogs', case_?.id],
		queryFn: async () => {
			if (!case_?.id) return { data: [] }
			return getChangeLogsForRecord(case_.id)
		},
		enabled: !!case_?.id && isOpen && isChangelogOpen,
	})

	// Initialize edited case when case_ changes or when entering edit mode
	useEffect(() => {
		if (case_ && isEditing) {
			setEditedCase({
				full_name: case_.full_name,
				id_number: case_.id_number,
				phone: case_.phone,
				email: case_.email,
				edad: case_.edad,
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
		} else {
			setEditedCase({})
		}
	}, [case_, isEditing])

	const handleEditClick = () => {
		if (!case_) return
		setIsEditing(true)
	}

	const handleCancelEdit = () => {
		setIsEditing(false)
		setEditedCase({})
	}

	const handleDeleteClick = () => {
		if (!case_) return
		setIsDeleteModalOpen(true)
	}

	const handleConfirmDelete = async () => {
		if (!case_ || !user) return

		setIsDeleting(true)
		try {
			const { error } = await deleteMedicalRecord(case_.id!)

			if (error) {
				throw error
			}

			toast({
				title: '✅ Caso eliminado exitosamente',
				description: `El caso ${case_.code || case_.id} ha sido eliminado.`,
				className: 'bg-green-100 border-green-400 text-green-800',
			})

			// Close modals and panel
			setIsDeleteModalOpen(false)
			onClose()

			// Refresh data if callback provided
			if (onCaseUpdated) {
				onCaseUpdated()
			}
		} catch (error) {
			console.error('Error deleting case:', error)
			toast({
				title: '❌ Error al eliminar',
				description: 'Hubo un problema al eliminar el caso. Inténtalo de nuevo.',
				variant: 'destructive',
			})
		} finally {
			setIsDeleting(false)
		}
	}

	const handleInputChange = (field: string, value: unknown) => {
		setEditedCase((prev: Partial<MedicalRecord>) => ({
			...prev,
			[field]: value,
		}))
	}

	const handleSaveChanges = async () => {
		if (!case_ || !user) return

		setIsSaving(true)
		try {
			// Detect changes
			const changes = []
			for (const [key, value] of Object.entries(editedCase)) {
				// Skip if value hasn't changed
				if (value === case_[key as keyof MedicalRecord]) continue

				// Add to changes array
				changes.push({
					field: key,
					fieldLabel: getFieldLabel(key),
					oldValue: case_[key as keyof MedicalRecord],
					newValue: value,
				})
			}

			if (changes.length === 0) {
				toast({
					title: 'Sin cambios',
					description: 'No se detectaron cambios para guardar.',
					variant: 'default',
				})
				setIsEditing(false)
				setIsSaving(false)
				return
			}

			// Update record with changes
			const { error } = await updateMedicalRecordWithLog(
				case_.id!,
				editedCase,
				changes,
				user.id,
				user.email || 'unknown@email.com',
			)

			if (error) {
				throw error
			}

			toast({
				title: '✅ Caso actualizado exitosamente',
				description: `Se han guardado los cambios al caso ${case_.code || case_.id}.`,
				className: 'bg-green-100 border-green-400 text-green-800',
			})

			// Exit edit mode
			setIsEditing(false)

			// Refresh data if callback provided
			if (onCaseUpdated) {
				onCaseUpdated()
			}
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

	const handleAddPayment = () => {
		if (!case_ || !editedCase) return

		// Find the first empty payment slot
		let paymentSlot = 0
		for (let i = 1; i <= 4; i++) {
			const methodKey = `payment_method_${i}` as keyof MedicalRecord
			if (!editedCase[methodKey]) {
				paymentSlot = i
				break
			}
		}

		if (paymentSlot === 0) {
			toast({
				title: '❌ Límite alcanzado',
				description: 'Ya has agregado el máximo de 4 métodos de pago.',
				variant: 'destructive',
			})
			return
		}

		// Add the new payment
		setEditedCase((prev: Partial<MedicalRecord>) => ({
			...prev,
			[`payment_method_${paymentSlot}`]: newPayment.method,
			[`payment_amount_${paymentSlot}`]: parseFloat(newPayment.amount),
			[`payment_reference_${paymentSlot}`]: newPayment.reference,
		}))

		// Reset form and close modal
		setNewPayment({
			method: '',
			amount: '',
			reference: '',
		})
		setIsAddPaymentModalOpen(false)
	}

	const handleRemovePayment = (index: number) => {
		if (!case_ || !editedCase) return

		// Remove the payment
		setEditedCase((prev: Partial<MedicalRecord>) => ({
			...prev,
			[`payment_method_${index}`]: null,
			[`payment_amount_${index}`]: null,
			[`payment_reference_${index}`]: null,
		}))
	}

	const toggleChangelog = () => {
		setIsChangelogOpen(!isChangelogOpen)
		if (!isChangelogOpen && case_?.id) {
			refetchChangelogs()
		}
	}

	if (!case_) return null

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

	const getFieldLabel = (field: string): string => {
		const labels: Record<string, string> = {
			full_name: 'Nombre Completo',
			id_number: 'Cédula',
			phone: 'Teléfono',
			email: 'Correo Electrónico',
			edad: 'Edad',
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

	const InfoSection = ({
		title,
		icon: Icon,
		children,
	}: {
		title: string
		icon: React.ComponentType<{ className?: string }>
		children: React.ReactNode
	}) => (
		<div className="bg-white dark:bg-background rounded-lg p-4 border border-input">
			<div className="flex items-center gap-2 mb-3">
				<Icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
				<h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
			</div>
			{children}
		</div>
	)

	const InfoRow = ({
		label,
		value,
		field,
		editable = true,
		type = 'text',
	}: {
		label: string
		value: string | number | undefined
		field?: string
		editable?: boolean
		type?: 'text' | 'number' | 'email'
	}) => {
		const isEditableField = isEditing && editable && field
		const fieldValue = field ? editedCase[field as keyof MedicalRecord] ?? value : value

		return (
			<div className="flex flex-col sm:flex-row sm:justify-between py-2 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
				<span className="text-sm font-medium text-gray-600 dark:text-gray-400">{label}:</span>
				{isEditableField ? (
					<div className="sm:w-1/2">
						<Input
							type={type}
							value={String(fieldValue || '')}
							onChange={(e) => handleInputChange(field!, e.target.value)}
							className="text-sm border-dashed focus:border-primary focus:ring-primary bg-gray-50 dark:bg-gray-800/50"
						/>
					</div>
				) : (
					<span className="text-sm text-gray-900 dark:text-gray-100 sm:text-right">{fieldValue || 'N/A'}</span>
				)}
			</div>
		)
	}

	// Función auxiliar para mostrar el símbolo correcto según el método
	const getPaymentSymbol = (method?: string | null) => {
		if (!method) return ''
		return isVESPaymentMethod(method) ? 'Bs' : '$'
	}

	// Helper para crear inputs de pago con parsing correcto
	const createPaymentAmountInput = (field: string, value: number | null | undefined, paymentMethod?: string | null) => {
		return (
			<>
				<label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">
					Monto{isVESPaymentMethod(paymentMethod) ? ' (Bs)' : ' ($)'}
				</label>
				<Input
					type="text"
					inputMode="decimal"
					placeholder="0,00"
					value={formatNumberForInput(value || 0)}
					onChange={createNumberInputHandler((parsedValue) => handleInputChange(field, parsedValue))}
					className="text-sm border-dashed focus:border-primary focus:ring-primary bg-gray-50 dark:bg-gray-800/50 text-right"
				/>
				{isVESPaymentMethod(paymentMethod) && case_?.exchange_rate && value && value > 0 && (
					<p className="text-xs text-green-600 mt-1">≈ ${convertVEStoUSD(value, case_.exchange_rate).toFixed(2)} USD</p>
				)}
			</>
		)
	}

	// Get action type display text and icon for changelog
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

	return (
		<>
			<AnimatePresence>
				{isOpen && (
					<>
						{/* Backdrop */}
						<motion.div
							viewport={{ margin: '0px' }}
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							onClick={isEditing ? undefined : onClose}
							className="fixed inset-0 bg-black/50 z-[99999998]"
						/>

						{/* Panel */}
						<motion.div
							viewport={{ margin: '0px' }}
							initial={{ x: '100%' }}
							animate={{ x: 0 }}
							exit={{ x: '100%' }}
							transition={{ type: 'spring', damping: 25, stiffness: 200 }}
							className="fixed right-0 top-0 h-full w-full sm:w-2/3 lg:w-1/2 xl:w-2/5 bg-white dark:bg-background shadow-2xl z-[99999999] overflow-y-auto rounded-lg border-l border-input"
						>
							{/* Header */}
							<div className="sticky top-0 bg-white dark:bg-background border-b border-gray-200 dark:border-gray-700 p-4 sm:p-6 z-10">
								<div className="flex items-center justify-between">
									<div>
										{isEditing ? (
											<Input
												value={editedCase.full_name || case_.full_name}
												onChange={(e) => handleInputChange('full_name', e.target.value)}
												className="text-xl sm:text-2xl font-bold border-dashed focus:border-primary focus:ring-primary bg-gray-50 dark:bg-gray-800/50"
											/>
										) : (
											<h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
												{case_.full_name}
											</h2>
										)}
									</div>
									<button
										onClick={isEditing ? handleCancelEdit : onClose}
										className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
									>
										<X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
									</button>
								</div>

								{/* Status badges */}
								<div className="flex flex-wrap gap-2 mt-4">
									<span
										className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(
											case_.payment_status,
										)}`}
									>
										{case_.payment_status}
									</span>
									<span className="inline-flex items-center gap-1 px-3 py-1 text-sm font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
										<CheckCircle size={16} />
										{case_.branch}
									</span>
									{case_.code && (
										<span className="inline-flex items-center gap-1 px-3 py-1 text-sm font-semibold rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">
											{case_.code}
										</span>
									)}
								</div>

								{/* Action Buttons */}
								<div className="flex gap-2 mt-4">
									{isEditing ? (
										<>
											<Button
												onClick={handleSaveChanges}
												disabled={isSaving}
												className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white"
											>
												{isSaving ? (
													<>
														<Loader2 className="w-4 h-4 animate-spin" />
														Guardando...
													</>
												) : (
													<>
														<Save className="w-4 h-4" />
														Guardar Cambios
													</>
												)}
											</Button>
											<Button
												onClick={handleCancelEdit}
												variant="outline"
												className="flex items-center gap-2"
												disabled={isSaving}
											>
												<XCircle className="w-4 h-4" />
												Cancelar
											</Button>
										</>
									) : (
										<>
											<Button
												onClick={handleEditClick}
												className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
											>
												<Edit className="w-4 h-4" />
												Editar Caso
											</Button>
											<Button onClick={handleDeleteClick} variant="destructive" className="flex items-center gap-2">
												<Trash2 className="w-4 h-4" />
												Eliminar Caso
											</Button>
											<Button onClick={toggleChangelog} variant="outline" className="flex items-center gap-2">
												<History className="w-4 h-4" />
												{isChangelogOpen ? 'Ocultar Historial' : 'Ver Historial'}
											</Button>
										</>
									)}
								</div>
							</div>

							{/* Content */}
							<div className="p-4 sm:p-6 space-y-6">
								{/* Changelog Section */}
								{isChangelogOpen && !isEditing && (
									<InfoSection title="Historial de Cambios" icon={History}>
										{isLoadingChangelogs ? (
											<div className="flex items-center justify-center p-4">
												<Loader2 className="w-6 h-6 animate-spin text-primary mr-2" />
												<span>Cargando historial...</span>
											</div>
										) : !changelogsData?.data || changelogsData.data.length === 0 ? (
											<div className="text-center p-4">
												<p className="text-gray-500 dark:text-gray-400">No hay registros de cambios para este caso.</p>
											</div>
										) : (
											<div className="space-y-4 max-h-80 overflow-y-auto">
												{changelogsData.data.map((log: ChangeLogEntry) => {
													const actionInfo = getActionTypeInfo(log)
													return (
														<div
															key={log.id}
															className="border-b border-gray-200 dark:border-gray-700 pb-3 last:border-0"
														>
															<div className="flex justify-between items-start mb-2">
																<div
																	className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${actionInfo.bgColor} ${actionInfo.textColor}`}
																>
																	{actionInfo.icon}
																	<span>{actionInfo.text}</span>
																</div>
																<div className="text-xs text-gray-500 dark:text-gray-400">
																	{format(new Date(log.changed_at), 'dd/MM/yyyy HH:mm', { locale: es })}
																</div>
															</div>
															<div className="flex items-center gap-2 mb-2">
																<span className="text-sm">{log.user_email}</span>
															</div>
															{log.field_name === 'created_record' ? (
																<p className="text-sm">Creación de nuevo registro médico</p>
															) : log.field_name === 'deleted_record' ? (
																<p className="text-sm">Eliminación del registro: {log.old_value}</p>
															) : (
																<div>
																	<p className="text-sm font-medium">{log.field_label}</p>
																	<div className="flex items-center gap-2 mt-1 text-sm">
																		<span className="line-through text-gray-500 dark:text-gray-400">
																			{log.old_value || '(vacío)'}
																		</span>
																		<span className="text-xs">→</span>
																		<span className="text-green-600 dark:text-green-400">
																			{log.new_value || '(vacío)'}
																		</span>
																	</div>
																</div>
															)}
														</div>
													)
												})}
											</div>
										)}
									</InfoSection>
								)}

								{/* Registered By Section */}
								{(creatorData || case_.created_by_display_name) && (
									<InfoSection title="Registrado por" icon={UserCheck}>
										<div className="space-y-1">
											<InfoRow
												label="Nombre"
												value={creatorData?.displayName || case_.created_by_display_name || 'Usuario del sistema'}
												editable={false}
											/>
											{creatorData?.email && <InfoRow label="Email" value={creatorData.email} editable={false} />}
											<InfoRow
												label="Fecha de registro"
												value={
													case_.created_at
														? format(new Date(case_.created_at), 'dd/MM/yyyy HH:mm', { locale: es })
														: 'N/A'
												}
												editable={false}
											/>
										</div>
									</InfoSection>
								)}

								{/* Case Code Section */}
								{case_.code && (
									<InfoSection title="Código del Caso" icon={Hash}>
										<div className="space-y-1">
											<InfoRow label="Código" value={case_.code} editable={false} />
											<div className="text-xs text-gray-500 dark:text-gray-400 mt-2 p-2 bg-gray-50 dark:bg-gray-800 rounded">
												<p>
													<strong>Formato:</strong> [Tipo][Año][Contador][Mes]
												</p>
												<p>
													<strong>Ejemplo:</strong> 1 = Citología, 25 = 2025, 001 = Primer caso, A = Enero
												</p>
											</div>
										</div>
									</InfoSection>
								)}

								{/* Patient Information */}
								<InfoSection title="Información del Paciente" icon={User}>
									<div className="space-y-1">
										<InfoRow label="Nombre completo" value={case_.full_name} field="full_name" />
										<InfoRow label="Cédula" value={case_.id_number} field="id_number" />
										<InfoRow label="Edad" value={case_.edad || 'Sin edad'} field="edad" />
										<InfoRow label="Teléfono" value={case_.phone} field="phone" />
										<InfoRow label="Email" value={case_.email || 'N/A'} field="email" type="email" />
										<InfoRow label="Relación" value={case_.relationship || 'N/A'} editable={false} />
									</div>
								</InfoSection>

								{/* Medical Information */}
								<InfoSection title="Información Médica" icon={Stethoscope}>
									<div className="space-y-1">
										<InfoRow label="Estudio" value={case_.exam_type} editable={false} />
										<InfoRow label="Médico tratante" value={case_.treating_doctor} editable={false} />
										<InfoRow label="Procedencia" value={case_.origin} editable={false} />
										<InfoRow label="Sede" value={case_.branch} editable={false} />
										<InfoRow label="Muestra" value={case_.sample_type} editable={false} />
										<InfoRow label="Cantidad de muestras" value={case_.number_of_samples} editable={false} />
										<InfoRow
											label="Fecha de registro"
											value={new Date(case_.date || '').toLocaleDateString('es-ES')}
											editable={false}
										/>
									</div>
								</InfoSection>

								{/* Financial Information */}
								<InfoSection title="Información Financiera" icon={CreditCard}>
									<div className="space-y-1">
										<InfoRow label="Monto total" value={`$${case_.total_amount.toLocaleString()}`} editable={false} />
										<InfoRow label="Monto faltante" value={`$${case_.remaining.toLocaleString()}`} editable={false} />
										<InfoRow label="Tasa de cambio" value={case_.exchange_rate?.toFixed(2)} editable={false} />
									</div>

									{/* Payment Methods */}
									<div className="mt-4">
										<div className="flex items-center justify-between mb-2">
											<h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Formas de Pago:</h4>
											{isEditing && (
												<Button
													size="sm"
													variant="outline"
													onClick={() => setIsAddPaymentModalOpen(true)}
													className="text-xs flex items-center gap-1"
													disabled={
														!!editedCase.payment_method_1 &&
														!!editedCase.payment_method_2 &&
														!!editedCase.payment_method_3 &&
														!!editedCase.payment_method_4
													}
												>
													<Plus className="w-3 h-3" />
													Agregar Método
												</Button>
											)}
										</div>
										<div className="space-y-2">
											{/* Payment Method 1 */}
											{(case_.payment_method_1 || (isEditing && editedCase.payment_method_1)) && (
												<div className="bg-white dark:bg-background p-3 rounded border border-gray-200 dark:border-gray-700 relative transition-all hover:border-gray-300 dark:hover:border-gray-600">
													{isEditing ? (
														<>
															<div className="grid grid-cols-1 md:grid-cols-3 gap-2">
																<div>
																	<label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Método</label>
																	<FormDropdown
																		options={createDropdownOptions([
																			'Punto de venta',
																			'Dólares en efectivo',
																			'Zelle',
																			'Pago móvil',
																			'Bs en efectivo',
																		])}
																		value={editedCase.payment_method_1 || ''}
																		onChange={(value) => handleInputChange('payment_method_1', value)}
																		placeholder="Seleccionar método"
																		className="text-sm border-dashed focus:border-primary focus:ring-primary bg-gray-50 dark:bg-gray-800/50"
																	/>
																</div>
																<div>
																	{createPaymentAmountInput(
																		'payment_amount_1',
																		editedCase.payment_amount_1,
																		editedCase.payment_method_1,
																	)}
																</div>
																<div>
																	<label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">
																		Referencia
																	</label>
																	<Input
																		value={editedCase.payment_reference_1 || ''}
																		onChange={(e) => handleInputChange('payment_reference_1', e.target.value)}
																		className="text-sm border-dashed focus:border-primary focus:ring-primary bg-gray-50 dark:bg-gray-800/50"
																	/>
																</div>
															</div>
															<button
																onClick={() => handleRemovePayment(1)}
																className="absolute -top-2 -right-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-1 rounded-full hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
															>
																<XCircle className="w-4 h-4" />
															</button>
														</>
													) : (
														<div className="flex justify-between items-center">
															<span className="text-sm font-medium">{case_.payment_method_1}</span>
															<span className="text-sm">
																{getPaymentSymbol(case_.payment_method_1)} {case_.payment_amount_1?.toLocaleString()}
															</span>
														</div>
													)}
													{(case_.payment_reference_1 || (isEditing && editedCase.payment_reference_1)) &&
														!isEditing && (
															<div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
																Ref: {editedCase.payment_reference_1 || case_.payment_reference_1}
															</div>
														)}
												</div>
											)}

											{/* Payment Method 2 */}
											{(case_.payment_method_2 || (isEditing && editedCase.payment_method_2)) && (
												<div className="bg-white dark:bg-background p-3 rounded border border-gray-200 dark:border-gray-700 relative transition-all hover:border-gray-300 dark:hover:border-gray-600">
													{isEditing ? (
														<>
															<div className="grid grid-cols-1 md:grid-cols-3 gap-2">
																<div>
																	<label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Método</label>
																	<FormDropdown
																		options={createDropdownOptions([
																			'Punto de venta',
																			'Dólares en efectivo',
																			'Zelle',
																			'Pago móvil',
																			'Bs en efectivo',
																		])}
																		value={editedCase.payment_method_2 || ''}
																		onChange={(value) => handleInputChange('payment_method_2', value)}
																		placeholder="Seleccionar método"
																		className="text-sm border-dashed focus:border-primary focus:ring-primary bg-gray-50 dark:bg-gray-800/50"
																	/>
																</div>
																<div>
																	{createPaymentAmountInput(
																		'payment_amount_2',
																		editedCase.payment_amount_2,
																		editedCase.payment_method_2,
																	)}
																</div>
																<div>
																	<label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">
																		Referencia
																	</label>
																	<Input
																		value={editedCase.payment_reference_2 || ''}
																		onChange={(e) => handleInputChange('payment_reference_2', e.target.value)}
																		className="text-sm border-dashed focus:border-primary focus:ring-primary bg-gray-50 dark:bg-gray-800/50"
																	/>
																</div>
															</div>
															<button
																onClick={() => handleRemovePayment(2)}
																className="absolute -top-2 -right-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-1 rounded-full hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
															>
																<XCircle className="w-4 h-4" />
															</button>
														</>
													) : (
														<div className="flex justify-between items-center">
															<span className="text-sm font-medium">{case_.payment_method_2}</span>
															<span className="text-sm">
																{getPaymentSymbol(case_.payment_method_2)} {case_.payment_amount_2?.toLocaleString()}
															</span>
														</div>
													)}
													{(case_.payment_reference_2 || (isEditing && editedCase.payment_reference_2)) &&
														!isEditing && (
															<div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
																Ref: {editedCase.payment_reference_2 || case_.payment_reference_2}
															</div>
														)}
												</div>
											)}

											{/* Payment Method 3 */}
											{(case_.payment_method_3 || (isEditing && editedCase.payment_method_3)) && (
												<div className="bg-white dark:bg-background p-3 rounded border border-gray-200 dark:border-gray-700 relative transition-all hover:border-gray-300 dark:hover:border-gray-600">
													{isEditing ? (
														<>
															<div className="grid grid-cols-1 md:grid-cols-3 gap-2">
																<div>
																	<label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Método</label>
																	<FormDropdown
																		options={createDropdownOptions([
																			'Punto de venta',
																			'Dólares en efectivo',
																			'Zelle',
																			'Pago móvil',
																			'Bs en efectivo',
																		])}
																		value={editedCase.payment_method_3 || ''}
																		onChange={(value) => handleInputChange('payment_method_3', value)}
																		placeholder="Seleccionar método"
																		className="text-sm border-dashed focus:border-primary focus:ring-primary bg-gray-50 dark:bg-gray-800/50"
																	/>
																</div>
																<div>
																	{createPaymentAmountInput(
																		'payment_amount_3',
																		editedCase.payment_amount_3,
																		editedCase.payment_method_3,
																	)}
																</div>
																<div>
																	<label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">
																		Referencia
																	</label>
																	<Input
																		value={editedCase.payment_reference_3 || ''}
																		onChange={(e) => handleInputChange('payment_reference_3', e.target.value)}
																		className="text-sm border-dashed focus:border-primary focus:ring-primary bg-gray-50 dark:bg-gray-800/50"
																	/>
																</div>
															</div>
															<button
																onClick={() => handleRemovePayment(3)}
																className="absolute -top-2 -right-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-1 rounded-full hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
															>
																<XCircle className="w-4 h-4" />
															</button>
														</>
													) : (
														<div className="flex justify-between items-center">
															<span className="text-sm font-medium">{case_.payment_method_3}</span>
															<span className="text-sm">
																{getPaymentSymbol(case_.payment_method_3)} {case_.payment_amount_3?.toLocaleString()}
															</span>
														</div>
													)}
													{(case_.payment_reference_3 || (isEditing && editedCase.payment_reference_3)) &&
														!isEditing && (
															<div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
																Ref: {editedCase.payment_reference_3 || case_.payment_reference_3}
															</div>
														)}
												</div>
											)}

											{/* Payment Method 4 */}
											{(case_.payment_method_4 || (isEditing && editedCase.payment_method_4)) && (
												<div className="bg-white dark:bg-background p-3 rounded border border-gray-200 dark:border-gray-700 relative transition-all hover:border-gray-300 dark:hover:border-gray-600">
													{isEditing ? (
														<>
															<div className="grid grid-cols-1 md:grid-cols-3 gap-2">
																<div>
																	<label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Método</label>
																	<FormDropdown
																		options={createDropdownOptions([
																			'Punto de venta',
																			'Dólares en efectivo',
																			'Zelle',
																			'Pago móvil',
																			'Bs en efectivo',
																		])}
																		value={editedCase.payment_method_4 || ''}
																		onChange={(value) => handleInputChange('payment_method_4', value)}
																		placeholder="Seleccionar método"
																		className="text-sm border-dashed focus:border-primary focus:ring-primary bg-gray-50 dark:bg-gray-800/50"
																	/>
																</div>
																<div>
																	{createPaymentAmountInput(
																		'payment_amount_4',
																		editedCase.payment_amount_4,
																		editedCase.payment_method_4,
																	)}
																</div>
																<div>
																	<label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">
																		Referencia
																	</label>
																	<Input
																		value={editedCase.payment_reference_4 || ''}
																		onChange={(e) => handleInputChange('payment_reference_4', e.target.value)}
																		className="text-sm border-dashed focus:border-primary focus:ring-primary bg-gray-50 dark:bg-gray-800/50"
																	/>
																</div>
															</div>
															<button
																onClick={() => handleRemovePayment(4)}
																className="absolute -top-2 -right-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-1 rounded-full hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
															>
																<XCircle className="w-4 h-4" />
															</button>
														</>
													) : (
														<div className="flex justify-between items-center">
															<span className="text-sm font-medium">{case_.payment_method_4}</span>
															<span className="text-sm">
																{getPaymentSymbol(case_.payment_method_4)} {case_.payment_amount_4?.toLocaleString()}
															</span>
														</div>
													)}
													{(case_.payment_reference_4 || (isEditing && editedCase.payment_reference_4)) &&
														!isEditing && (
															<div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
																Ref: {editedCase.payment_reference_4 || case_.payment_reference_4}
															</div>
														)}
												</div>
											)}
										</div>
									</div>
								</InfoSection>

								{/* Additional Information */}
								<InfoSection title="Información Adicional" icon={FileText}>
									<div className="space-y-1">
										<InfoRow
											label="Fecha de creación"
											value={new Date(case_.created_at || '').toLocaleDateString('es-ES')}
											editable={false}
										/>
										<InfoRow
											label="Última actualización"
											value={new Date(case_.updated_at || '').toLocaleDateString('es-ES')}
											editable={false}
										/>
										<div className="py-2">
											<span className="text-sm font-medium text-gray-600 dark:text-gray-400">Comentarios:</span>
											{isEditing ? (
												<Textarea
													value={editedCase.comments || ''}
													onChange={(e) => handleInputChange('comments', e.target.value)}
													className="mt-1 w-full min-h-[100px] text-sm border-dashed focus:border-primary focus:ring-primary bg-gray-50 dark:bg-gray-800/50"
													placeholder="Agregar comentarios adicionales..."
												/>
											) : (
												<p className="text-sm text-gray-900 dark:text-gray-100 mt-1 p-3 bg-white dark:bg-background rounded border">
													{case_.comments || 'Sin comentarios'}
												</p>
											)}
										</div>
									</div>
								</InfoSection>

								{/* Bottom Action Buttons */}
								<div className="flex gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
									{isEditing ? (
										<>
											<Button
												onClick={handleSaveChanges}
												disabled={isSaving}
												className="flex-1 flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white"
											>
												{isSaving ? (
													<>
														<Loader2 className="w-4 h-4 animate-spin" />
														Guardando...
													</>
												) : (
													<>
														<Save className="w-4 h-4" />
														Guardar Cambios
													</>
												)}
											</Button>
											<Button
												onClick={handleCancelEdit}
												variant="outline"
												className="flex-1 flex items-center gap-2"
												disabled={isSaving}
											>
												<XCircle className="w-4 h-4" />
												Cancelar
											</Button>
										</>
									) : (
										<>
											<Button
												onClick={handleEditClick}
												className="flex-1 flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
											>
												<Edit className="w-4 h-4" />
												Editar Caso
											</Button>
											<Button
												onClick={handleDeleteClick}
												variant="destructive"
												className="flex-1 flex items-center gap-2"
											>
												<Trash2 className="w-4 h-4" />
												Eliminar Caso
											</Button>
										</>
									)}
								</div>
							</div>
						</motion.div>
					</>
				)}
			</AnimatePresence>

			{/* Delete Confirmation Modal */}
			{isDeleteModalOpen && (
				<div className="fixed inset-0 z-[999999999] flex items-center justify-center bg-black/50">
					<div className="bg-white dark:bg-background rounded-lg p-6 max-w-md w-full mx-4 shadow-xl border border-gray-200 dark:border-gray-700">
						<div className="flex items-center gap-3 mb-4">
							<div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-full">
								<AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
							</div>
							<h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Confirmar eliminación</h3>
						</div>

						<p className="text-gray-700 dark:text-gray-300 mb-6">
							¿Estás seguro de que quieres eliminar este caso? Esta acción no se puede deshacer.
						</p>

						<div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
							<button
								onClick={() => setIsDeleteModalOpen(false)}
								className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
							>
								Cancelar
							</button>
							<button
								onClick={handleConfirmDelete}
								disabled={isDeleting}
								className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
							>
								{isDeleting ? (
									<>
										<Loader2 className="w-4 h-4 animate-spin" />
										<span>Eliminando...</span>
									</>
								) : (
									<>
										<Trash2 className="w-4 h-4" />
										<span>Confirmar</span>
									</>
								)}
							</button>
						</div>
					</div>
				</div>
			)}

			{/* Add Payment Modal */}
			{isAddPaymentModalOpen && (
				<div className="fixed inset-0 z-[999999999] flex items-center justify-center bg-black/50">
					<div className="bg-white dark:bg-background rounded-lg p-6 max-w-md w-full mx-4 shadow-xl border border-gray-200 dark:border-gray-700">
						<div className="flex items-center justify-between mb-4">
							<div className="flex items-center gap-3">
								<div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full">
									<DollarSign className="w-5 h-5 text-blue-600 dark:text-blue-400" />
								</div>
								<h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Agregar Método de Pago</h3>
							</div>
							<button
								onClick={() => setIsAddPaymentModalOpen(false)}
								className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
							>
								<X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
							</button>
						</div>

						<div className="space-y-4 mb-6">
							<div>
								<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
									Método de Pago
								</label>
								<FormDropdown
									options={createDropdownOptions([
										'Punto de venta',
										'Dólares en efectivo',
										'Zelle',
										'Pago móvil',
										'Bs en efectivo',
									])}
									value={newPayment.method}
									onChange={(value) => setNewPayment({ ...newPayment, method: value })}
									placeholder="Seleccionar método"
									className="w-full"
								/>
							</div>

							<div>
								<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
									Monto{isVESPaymentMethod(newPayment.method) ? ' (Bs)' : ' ($)'}
								</label>
								<Input
									type="text"
									inputMode="decimal"
									value={formatNumberForInput(parseDecimalNumber(newPayment.amount) || 0)}
									onChange={(e) => {
										const parsedValue = parseDecimalNumber(e.target.value)
										setNewPayment({ ...newPayment, amount: parsedValue.toString() })
									}}
									placeholder="0,00"
									className="text-right"
								/>
								{isVESPaymentMethod(newPayment.method) &&
									case_?.exchange_rate &&
									parseDecimalNumber(newPayment.amount) > 0 && (
										<p className="text-xs text-green-600 mt-1">
											≈ ${convertVEStoUSD(parseDecimalNumber(newPayment.amount), case_.exchange_rate).toFixed(2)} USD
										</p>
									)}
							</div>

							<div>
								<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Referencia</label>
								<Input
									value={newPayment.reference}
									onChange={(e) => setNewPayment({ ...newPayment, reference: e.target.value })}
									placeholder="Referencia de pago"
								/>
							</div>
						</div>

						<div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
							<Button variant="outline" onClick={() => setIsAddPaymentModalOpen(false)}>
								Cancelar
							</Button>
							<Button
								onClick={handleAddPayment}
								disabled={!newPayment.method || !newPayment.amount}
								className="bg-primary hover:bg-primary/80"
							>
								Agregar Pago
							</Button>
						</div>
					</div>
				</div>
			)}
		</>
	)
}

export default CaseDetailPanel