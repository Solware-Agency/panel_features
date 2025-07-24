import React, { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { X, Microscope, Loader2, Save, Upload, FileText, Activity, Heart } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@shared/components/ui/form'
import { Button } from '@shared/components/ui/button'
import { Textarea } from '@shared/components/ui/textarea'
import { Input } from '@shared/components/ui/input'
import { useToast } from '@shared/hooks/use-toast'
import { useAuth } from '@app/providers/AuthContext'
import { useUserProfile } from '@shared/hooks/useUserProfile'
import { updateMedicalRecordWithLog } from '@lib/supabase-service'
import type { MedicalRecord } from '@lib/supabase-service'

// Validation schemas for different case types
const biopsyCaseSchema = z.object({
	case_type: z.literal('biopsia'),
	material_remitido: z.string().min(1, 'Este campo es requerido'),
	informacion_clinica: z.string().min(1, 'Este campo es requerido'),
	descripcion_macroscopica: z.string().min(1, 'Este campo es requerido'),
	diagnostico: z.string().min(1, 'Este campo es requerido'),
	comentario: z.string().optional(),
})

const immunohistochemistryCaseSchema = z.object({
	case_type: z.literal('inmunohistoquimica'),
	informacion_clinica: z.string().min(1, 'Este campo es requerido'),
	descripcion_macroscopica: z
		.string()
		.default(
			'Se recibe bloque de parafina y lámina, identificados con el número... procesados para estudio de inmunohistoquímica',
		),
	inmunohistoquimica: z
		.string()
		.default(
			'Utilizando la técnica de avidina-estreptavidina, el método de recuperación antigénica y controles positivos, se probaron los siguientes anticuerpos',
		),
	positivo: z.string().min(1, 'Este campo es requerido'),
	negativo: z.string().min(1, 'Este campo es requerido'),
	ki67: z.string().min(1, 'Este campo es requerido'),
	conclusion_diagnostica: z.string().min(1, 'Este campo es requerido'),
	comentario: z.string().optional(),
})

const cytologyCaseSchema = z.object({
	case_type: z.literal('citologia'),
	descripcion_macroscopica: z
		.string()
		.default(
			'Se recibe una (01) lámina con material celular, previamente fijado. Teñido con Papanicolaou para estudio citológico.',
		),
})

type CaseFormData =
	| z.infer<typeof biopsyCaseSchema>
	| z.infer<typeof immunohistochemistryCaseSchema>
	| z.infer<typeof cytologyCaseSchema>

interface GenerateCaseModalProps {
	case_: MedicalRecord | null
	isOpen: boolean
	onClose: () => void
	onSuccess: () => void
}

const GenerateCaseModal: React.FC<GenerateCaseModalProps> = ({ case_, isOpen, onClose, onSuccess }) => {
	const [isSaving, setIsSaving] = useState(false)
	const [selectedFile, setSelectedFile] = useState<File | null>(null)
	const { toast } = useToast()
	const { user } = useAuth()
	const { profile } = useUserProfile()

	// Determine case type from exam_type
	const getCaseType = (examType: string): 'biopsia' | 'inmunohistoquimica' | 'citologia' => {
		const type = examType.toLowerCase().trim()
		if (type.includes('inmuno')) return 'inmunohistoquimica'
		if (type.includes('citolog')) return 'citologia'
		return 'biopsia'
	}

	const caseType = case_ ? getCaseType(case_.exam_type) : 'biopsia'

	// Get appropriate schema based on case type
	const getSchemaForCaseType = (type: string) => {
		switch (type) {
			case 'inmunohistoquimica':
				return immunohistochemistryCaseSchema
			case 'citologia':
				return cytologyCaseSchema
			default:
				return biopsyCaseSchema
		}
	}

	const form = useForm<CaseFormData>({
		resolver: zodResolver(getSchemaForCaseType(caseType)),
		defaultValues: {
			case_type: caseType,
			...(caseType === 'biopsia' && {
				material_remitido: case_?.material_remitido || '',
				informacion_clinica: case_?.informacion_clinica || '',
				descripcion_macroscopica: case_?.descripcion_macroscopica || '',
				diagnostico: case_?.diagnostico || '',
				comentario: case_?.comentario || '',
			}),
			...(caseType === 'inmunohistoquimica' && {
				informacion_clinica: case_?.informacion_clinica || '',
				descripcion_macroscopica:
					'Se recibe bloque de parafina y lámina, identificados con el número... procesados para estudio de inmunohistoquímica',
				inmunohistoquimica:
					'Utilizando la técnica de avidina-estreptavidina, el método de recuperación antigénica y controles positivos, se probaron los siguientes anticuerpos',
				positivo: '',
				negativo: '',
				ki67: '',
				conclusion_diagnostica: '',
				comentario: '',
			}),
			...(caseType === 'citologia' && {
				descripcion_macroscopica:
					'Se recibe una (01) lámina con material celular, previamente fijado. Teñido con Papanicolaou para estudio citológico.',
			}),
		} as CaseFormData,
	})

	// Reset form when case changes
	React.useEffect(() => {
		if (case_ && isOpen) {
			const newCaseType = getCaseType(case_.exam_type)
			form.reset({
				case_type: newCaseType,
				...(newCaseType === 'biopsia' && {
					material_remitido: case_.material_remitido || '',
					informacion_clinica: case_.informacion_clinica || '',
					descripcion_macroscopica: case_.descripcion_macroscopica || '',
					diagnostico: case_.diagnostico || '',
					comentario: case_.comentario || '',
				}),
				...(newCaseType === 'inmunohistoquimica' && {
					informacion_clinica: case_.informacion_clinica || '',
					descripcion_macroscopica:
						'Se recibe bloque de parafina y lámina, identificados con el número... procesados para estudio de inmunohistoquímica',
					inmunohistoquimica:
						'Utilizando la técnica de avidina-estreptavidina, el método de recuperación antigénica y controles positivos, se probaron los siguientes anticuerpos',
					positivo: '',
					negativo: '',
					ki67: '',
					conclusion_diagnostica: '',
					comentario: '',
				}),
				...(newCaseType === 'citologia' && {
					descripcion_macroscopica:
						'Se recibe una (01) lámina con material celular, previamente fijado. Teñido con Papanicolaou para estudio citológico.',
				}),
			} as CaseFormData)
		}
	}, [case_, isOpen, form])

	const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0]
		if (file) {
			// Validate file type and size
			const allowedTypes = [
				'image/jpeg',
				'image/png',
				'image/gif',
				'application/pdf',
				'application/msword',
				'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
			]
			const maxSize = 10 * 1024 * 1024 // 10MB

			if (!allowedTypes.includes(file.type)) {
				toast({
					title: '❌ Tipo de archivo no válido',
					description: 'Solo se permiten archivos PDF, Word, o imágenes (JPG, PNG, GIF).',
					variant: 'destructive',
				})
				return
			}

			if (file.size > maxSize) {
				toast({
					title: '❌ Archivo muy grande',
					description: 'El archivo no puede ser mayor a 10MB.',
					variant: 'destructive',
				})
				return
			}

			setSelectedFile(file)
		}
	}

	const handleSubmit = async (data: CaseFormData) => {
		if (!case_ || !user) return

		setIsSaving(true)

		// Get current timestamp for generated_at
		const now = new Date().toISOString()

		try {
			// Prepare changes for logging
			const changes = []

			// Handle file upload if present
			let attachmentUrl = null
			if (selectedFile) {
				// Store the filename for now - in production you would upload to Supabase Storage
				// and get the actual URL back
				attachmentUrl = `attachments/${case_.id}/${selectedFile.name}`

				// TODO: Implement actual file upload to Supabase Storage
				// const { data: uploadData, error: uploadError } = await supabase.storage
				//   .from('case-attachments')
				//   .upload(`${case_.id}/${selectedFile.name}`, selectedFile)
				// if (!uploadError) {
				//   attachmentUrl = uploadData.path
				// }
			}

			// Prepare updates based on case type
			let updatesWithGeneratedBy: Partial<MedicalRecord> = {
				generated_by: user.id,
				generated_by_display_name: profile?.display_name || user.email,
				generated_at: now,
				pdf_en_ready: true,
			}

			// Add case-specific fields
			if (data.case_type === 'biopsia') {
				updatesWithGeneratedBy = {
					...updatesWithGeneratedBy,
					material_remitido: data.material_remitido,
					informacion_clinica: data.informacion_clinica,
					descripcion_macroscopica: data.descripcion_macroscopica,
					diagnostico: data.diagnostico,
					comentario: data.comentario || '',
				}

				// Track changes for biopsy
				if (data.material_remitido !== (case_.material_remitido || '')) {
					changes.push({
						field: 'material_remitido',
						fieldLabel: 'Material Remitido',
						oldValue: case_.material_remitido || null,
						newValue: data.material_remitido,
					})
				}

				if (data.informacion_clinica !== (case_.informacion_clinica || '')) {
					changes.push({
						field: 'informacion_clinica',
						fieldLabel: 'Información Clínica',
						oldValue: case_.informacion_clinica || null,
						newValue: data.informacion_clinica,
					})
				}

				if (data.descripcion_macroscopica !== (case_.descripcion_macroscopica || '')) {
					changes.push({
						field: 'descripcion_macroscopica',
						fieldLabel: 'Descripción Macroscópica',
						oldValue: case_.descripcion_macroscopica || null,
						newValue: data.descripcion_macroscopica,
					})
				}

				if (data.diagnostico !== (case_.diagnostico || '')) {
					changes.push({
						field: 'diagnostico',
						fieldLabel: 'Diagnóstico',
						oldValue: case_.diagnostico || null,
						material_remitido: 'Material Remitido',
						informacion_clinica: 'Información Clínica',
						descripcion_macroscopica: 'Descripción Macroscópica',
						diagnostico: 'Diagnóstico',
						comentario: 'Comentario',
						inmunohistoquimica: 'Inmunohistoquímica',
						positivo: 'Positivo',
						negativo: 'Negativo',
						ki67: 'Ki67',
						conclusion_diagnostica: 'Conclusión Diagnóstica',
						attachment_url: 'Archivo Adjunto',
						newValue: data.diagnostico,
					})
				}

				if (data.comentario !== (case_.comentario || '')) {
					changes.push({
						field: 'comentario',
						fieldLabel: 'Comentario',
						oldValue: case_.comentario || null,
						newValue: data.comentario || null,
					})
				}
			} else if (data.case_type === 'inmunohistoquimica') {
				updatesWithGeneratedBy = {
					...updatesWithGeneratedBy,
					informacion_clinica: data.informacion_clinica,
					descripcion_macroscopica: data.descripcion_macroscopica,
					inmunohistoquimica: data.inmunohistoquimica,
					positivo: data.positivo,
					negativo: data.negativo,
					ki67: data.ki67,
					conclusion_diagnostica: data.conclusion_diagnostica,
					comentario: data.comentario || '',
				}

				// Track changes for immunohistochemistry
				changes.push({
					field: 'case_type',
					fieldLabel: 'Tipo de Caso',
					oldValue: 'Sin generar',
					newValue: 'Inmunohistoquímica',
				})
			} else if (data.case_type === 'citologia') {
				updatesWithGeneratedBy = {
					...updatesWithGeneratedBy,
					descripcion_macroscopica: data.descripcion_macroscopica,
				}

				// Track changes for cytology
				changes.push({
					field: 'case_type',
					fieldLabel: 'Tipo de Caso',
					oldValue: 'Sin generar',
					newValue: 'Citología',
				})
			}

			// Add attachment if present
			if (attachmentUrl) {
				updatesWithGeneratedBy.attachment_url = attachmentUrl
				changes.push({
					field: 'attachment_url',
					fieldLabel: 'Archivo Adjunto',
					oldValue: null,
					newValue: attachmentUrl,
				})
			}

			// Add generated_by to changes log
			changes.push({
				field: 'generated_by',
				fieldLabel: 'Generado Por',
				oldValue: case_.generated_by || null,
				newValue: user.id,
			})

			changes.push({
				field: 'pdf_en_ready',
				fieldLabel: 'PDF Listo',
				oldValue: case_.pdf_en_ready || false,
				newValue: true,
			})

			// Update record with changes
			const { error } = await updateMedicalRecordWithLog(
				case_.id!,
				updatesWithGeneratedBy,
				changes,
				user.id,
				user.email || 'unknown@email.com',
			)

			if (error) {
				throw error
			}

			toast({
				title: '✅ Caso generado exitosamente',
				description: `Se ha generado el caso de ${data.case_type} para ${case_.full_name}.`,
				className: 'bg-green-100 border-green-400 text-green-800',
			})

			onSuccess()
			onClose()
		} catch (error) {
			console.error('Error saving case:', error)
			toast({
				title: '❌ Error al guardar',
				description: 'Hubo un problema al generar el caso. Inténtalo de nuevo.',
				variant: 'destructive',
			})
		} finally {
			setIsSaving(false)
		}
	}

	const getCaseTypeIcon = (type: string) => {
		switch (type) {
			case 'inmunohistoquimica':
				return <Heart className="w-5 h-5 text-purple-600 dark:text-purple-400" />
			case 'citologia':
				return <Activity className="w-5 h-5 text-blue-600 dark:text-blue-400" />
			default:
				return <Microscope className="w-5 h-5 text-green-600 dark:text-green-400" />
		}
	}

	const getCaseTypeTitle = (type: string) => {
		switch (type) {
			case 'inmunohistoquimica':
				return 'Inmunohistoquímica'
			case 'citologia':
				return 'Citología'
			default:
				return 'Biopsia'
		}
	}

	if (!case_) return null

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
						className="fixed inset-0 bg-black/50 z-[999999998]"
					/>

					{/* Main Modal */}
					<motion.div
						initial={{ x: '100%' }}
						animate={{ x: 0 }}
						exit={{ x: '100%' }}
						transition={{ type: 'spring', damping: 25, stiffness: 200 }}
						className="fixed right-0 top-0 h-full w-full sm:w-2/3 lg:w-1/2 xl:w-2/5 bg-white dark:bg-background shadow-2xl z-[999999999] overflow-y-auto border-l border-input flex flex-col"
					>
						{/* Header */}
						<div className="sticky top-0 bg-white dark:bg-background border-b border-gray-200 dark:border-gray-700 p-3 sm:p-6 z-10">
							<div className="flex items-center justify-between">
								<div>
									<h2 className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
										{getCaseTypeIcon(caseType)}
										Generar Caso de {getCaseTypeTitle(caseType)}
									</h2>
									<div className="flex items-center gap-1.5 sm:gap-2 mt-1 sm:mt-2">
										<p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
											{case_.code || case_.id?.slice(-6).toUpperCase()}
										</p>
										<p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">• {case_.full_name}</p>
									</div>
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
						<div className="p-3 sm:p-6 overflow-y-auto flex-1">
							<Form {...form}>
								<form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 sm:space-y-6">
									{/* Case Type Indicator */}
									<div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
										<div className="flex items-center gap-2">
											{getCaseTypeIcon(caseType)}
											<span className="font-medium text-blue-800 dark:text-blue-300">
												Tipo de caso: {getCaseTypeTitle(caseType)}
											</span>
										</div>
									</div>

									{/* Dynamic Form Fields Based on Case Type */}
									{caseType === 'biopsia' && (
										<div className="space-y-4">
											<FormField
												control={form.control}
												name="material_remitido"
												render={({ field }) => (
													<FormItem>
														<FormLabel>Material Remitido *</FormLabel>
														<FormControl>
															<Textarea
																placeholder="Describa el material remitido para análisis..."
																className="min-h-[60px] sm:min-h-[80px] resize-y text-sm"
																{...field}
															/>
														</FormControl>
														<FormMessage />
													</FormItem>
												)}
											/>

											<FormField
												control={form.control}
												name="informacion_clinica"
												render={({ field }) => (
													<FormItem>
														<FormLabel>Información Clínica *</FormLabel>
														<FormControl>
															<Textarea
																placeholder="Información clínica relevante..."
																className="min-h-[60px] sm:min-h-[80px] resize-y text-sm"
																{...field}
															/>
														</FormControl>
														<FormMessage />
													</FormItem>
												)}
											/>

											<FormField
												control={form.control}
												name="descripcion_macroscopica"
												render={({ field }) => (
													<FormItem>
														<FormLabel>Descripción Macroscópica *</FormLabel>
														<FormControl>
															<Textarea
																placeholder="Descripción macroscópica de la muestra..."
																className="min-h-[80px] sm:min-h-[100px] resize-y text-sm"
																{...field}
															/>
														</FormControl>
														<FormMessage />
													</FormItem>
												)}
											/>

											<FormField
												control={form.control}
												name="diagnostico"
												render={({ field }) => (
													<FormItem>
														<FormLabel>Diagnóstico *</FormLabel>
														<FormControl>
															<Textarea
																placeholder="Diagnóstico basado en el análisis..."
																className="min-h-[80px] sm:min-h-[100px] resize-y text-sm"
																{...field}
															/>
														</FormControl>
														<FormMessage />
													</FormItem>
												)}
											/>

											<FormField
												control={form.control}
												name="comentario"
												render={({ field }) => (
													<FormItem>
														<FormLabel>Comentario</FormLabel>
														<FormControl>
															<Textarea
																placeholder="Comentarios adicionales (opcional)..."
																className="min-h-[60px] sm:min-h-[80px] resize-y text-sm"
																{...field}
															/>
														</FormControl>
														<FormMessage />
													</FormItem>
												)}
											/>
										</div>
									)}

									{caseType === 'inmunohistoquimica' && (
										<div className="space-y-4">
											<FormField
												control={form.control}
												name="informacion_clinica"
												render={({ field }) => (
													<FormItem>
														<FormLabel>Información Clínica *</FormLabel>
														<FormControl>
															<Textarea
																placeholder="Información clínica relevante..."
																className="min-h-[60px] sm:min-h-[80px] resize-y text-sm"
																{...field}
															/>
														</FormControl>
														<FormMessage />
													</FormItem>
												)}
											/>

											<FormField
												control={form.control}
												name="descripcion_macroscopica"
												render={({ field }) => (
													<FormItem>
														<FormLabel>Descripción Macroscópica</FormLabel>
														<FormControl>
															<Textarea
																className="min-h-[60px] resize-y text-sm bg-gray-50 dark:bg-gray-800"
																readOnly
																{...field}
															/>
														</FormControl>
														<p className="text-xs text-gray-500">Texto fijo para inmunohistoquímica</p>
													</FormItem>
												)}
											/>

											<FormField
												control={form.control}
												name="inmunohistoquimica"
												render={({ field }) => (
													<FormItem>
														<FormLabel>Inmunohistoquímica</FormLabel>
														<FormControl>
															<Textarea
																className="min-h-[60px] resize-y text-sm bg-gray-50 dark:bg-gray-800"
																readOnly
																{...field}
															/>
														</FormControl>
														<p className="text-xs text-gray-500">Texto fijo para técnica utilizada</p>
													</FormItem>
												)}
											/>

											<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
												<FormField
													control={form.control}
													name="positivo"
													render={({ field }) => (
														<FormItem>
															<FormLabel>Positivo *</FormLabel>
															<FormControl>
																<Input placeholder="Anticuerpos positivos" className="text-sm" {...field} />
															</FormControl>
															<FormMessage />
														</FormItem>
													)}
												/>

												<FormField
													control={form.control}
													name="negativo"
													render={({ field }) => (
														<FormItem>
															<FormLabel>Negativo *</FormLabel>
															<FormControl>
																<Input placeholder="Anticuerpos negativos" className="text-sm" {...field} />
															</FormControl>
															<FormMessage />
														</FormItem>
													)}
												/>

												<FormField
													control={form.control}
													name="ki67"
													render={({ field }) => (
														<FormItem>
															<FormLabel>Ki67 *</FormLabel>
															<FormControl>
																<Input placeholder="Valor Ki67" className="text-sm" {...field} />
															</FormControl>
															<FormMessage />
														</FormItem>
													)}
												/>
											</div>

											<FormField
												control={form.control}
												name="conclusion_diagnostica"
												render={({ field }) => (
													<FormItem>
														<FormLabel>Conclusión Diagnóstica *</FormLabel>
														<FormControl>
															<Textarea
																placeholder="Conclusión diagnóstica basada en el estudio..."
																className="min-h-[80px] sm:min-h-[100px] resize-y text-sm"
																{...field}
															/>
														</FormControl>
														<FormMessage />
													</FormItem>
												)}
											/>

											<FormField
												control={form.control}
												name="comentario"
												render={({ field }) => (
													<FormItem>
														<FormLabel>Comentario</FormLabel>
														<FormControl>
															<Textarea
																placeholder="Comentarios adicionales (opcional)..."
																className="min-h-[60px] sm:min-h-[80px] resize-y text-sm"
																{...field}
															/>
														</FormControl>
														<FormMessage />
													</FormItem>
												)}
											/>
										</div>
									)}

									{caseType === 'citologia' && (
										<div className="space-y-4">
											<FormField
												control={form.control}
												name="descripcion_macroscopica"
												render={({ field }) => (
													<FormItem>
														<FormLabel>Descripción</FormLabel>
														<FormControl>
															<Textarea
																className="min-h-[60px] resize-y text-sm bg-gray-50 dark:bg-gray-800"
																readOnly
																{...field}
															/>
														</FormControl>
														<p className="text-xs text-gray-500">Texto fijo para citología</p>
													</FormItem>
												)}
											/>

											<div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
												<div className="flex items-center gap-2 mb-2">
													<FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
													<span className="font-medium text-blue-800 dark:text-blue-300">
														Información sobre Citología
													</span>
												</div>
												<p className="text-sm text-blue-700 dark:text-blue-400">
													Para casos de citología, solo se requiere subir el archivo correspondiente. El PDF se generará
													automáticamente con el texto estándar y la información del paciente.
												</p>
											</div>
										</div>
									)}

									{/* File Upload Section - Common for all case types */}
									<div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
										<div className="flex items-center gap-2">
											<Upload className="w-5 h-5 text-gray-600 dark:text-gray-400" />
											<h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">Archivo Adjunto</h3>
										</div>

										<div className="space-y-2">
											<label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
												Subir archivo relacionado al caso
											</label>
											<Input
												type="file"
												accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif"
												onChange={handleFileChange}
												className="text-sm"
											/>
											<p className="text-xs text-gray-500 dark:text-gray-400">
												Formatos permitidos: PDF, Word, imágenes (JPG, PNG, GIF). Máximo 10MB.
											</p>
											{selectedFile && (
												<div className="bg-green-50 dark:bg-green-900/20 p-2 rounded border border-green-200 dark:border-green-800">
													<p className="text-sm text-green-800 dark:text-green-300">
														Archivo seleccionado: {selectedFile.name}
													</p>
												</div>
											)}
										</div>
									</div>

									{/* Action Buttons */}
									<div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-4 sm:pt-6 border-t border-gray-200 dark:border-gray-700">
										<Button type="button" variant="outline" onClick={onClose} className="flex-1">
											Cancelar
										</Button>
										<Button type="submit" className="flex-1 bg-primary hover:bg-primary/80" disabled={isSaving}>
											{isSaving ? (
												<>
													<Loader2 className="w-4 h-4 mr-2 animate-spin" />
													Guardando...
												</>
											) : (
												<>
													<Save className="w-4 h-4 mr-2" />
													Generar Caso
												</>
											)}
										</Button>
									</div>
								</form>
							</Form>
						</div>
					</motion.div>
				</>
			)}
		</AnimatePresence>
	)
}

export default GenerateCaseModal