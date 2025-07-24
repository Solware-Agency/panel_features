import { type Control } from 'react-hook-form'
import { type FormValues } from '@features/form/lib/form-schema'
import { FormField, FormItem, FormLabel, FormControl } from '@shared/components/ui/form'
import { AutocompleteInput } from '@shared/components/ui/autocomplete-input'
import { FormDropdown, createDropdownOptions } from '@shared/components/ui/form-dropdown'
import { Card, CardContent, CardHeader, CardTitle } from '@shared/components/ui/card'
import { Input } from '@shared/components/ui/input'
import { Loader2, CheckCircle } from 'lucide-react'
import { useFormContext } from 'react-hook-form'
import { usePatientAutofill } from '@shared/hooks/usePatientAutofill'
import { memo, useCallback } from 'react'
import { useState } from 'react'
import { User, Phone, CreditCard, Mail } from 'lucide-react'
import { cn } from '@shared/lib/cn'
import { Popover, PopoverContent, PopoverTrigger } from '@shared/components/ui/popover'
import { Button } from '@shared/components/ui/button'
import { Calendar } from '@shared/components/ui/calendar'
import { CalendarIcon } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface PatientDataSectionProps {
	control: Control<FormValues>
	inputStyles: string
}

export const PatientDataSection = memo(({ control, inputStyles }: PatientDataSectionProps) => {
	const { setValue } = useFormContext<FormValues>()
	const { fillPatientData, isLoading: isLoadingPatient, lastFilledPatient } = usePatientAutofill(setValue)
	const [isRegistrationDateCalendarOpen, setIsRegistrationDateCalendarOpen] = useState(false)

	// Memoize the handler to prevent unnecessary re-renders
	const handlePatientSelect = useCallback(
		(idNumber: string) => {
			fillPatientData(idNumber, true) // Silencioso
		},
		[fillPatientData],
	)

	return (
		<Card className="hover:border-primary hover:shadow-lg hover:shadow-primary/20">
			<CardHeader className="p-4 sm:p-6">
				<CardTitle className="text-base sm:text-lg">
					Datos del Paciente
					{isLoadingPatient && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
					{lastFilledPatient && !isLoadingPatient && (
						<div className="flex items-center gap-1 text-green-600 text-xs sm:text-sm">
							<CheckCircle className="h-4 w-4" />
							<span>Datos de {lastFilledPatient} cargados</span>
						</div>
					)}
				</CardTitle>
			</CardHeader>
			<CardContent className="p-3 sm:p-4 pt-0 sm:pt-0 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
				{/* Nombre Completo - CON AUTOCOMPLETADO */}
				<FormField
					control={control}
					name="fullName"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Nombre Completo *</FormLabel>
							<FormControl>
								<AutocompleteInput
									fieldName="fullName"
									placeholder="Nombre y Apellido"
									iconRight={<User className="h-4 w-4 text-muted-foreground" />}
									{...field}
									onChange={(e) => {
										const { value } = e.target
										if (/^[A-Za-zÑñÁáÉéÍíÓóÚúÜü\s]*$/.test(value)) {
											field.onChange(e)
										}
									}}
									className={inputStyles}
								/>
							</FormControl>
						</FormItem>
					)}
				/>

				{/* Cédula - CON AUTOCOMPLETADO Y AUTOFILL */}
				<FormField
					control={control}
					name="idNumber"
					render={({ field }) => (
						<FormItem>
							<FormLabel className="flex items-center gap-2">
								Cédula *
								<span className="text-[10px] sm:text-xs text-green-600 bg-green-100 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full">
									Autocompletado inteligente
								</span>
							</FormLabel>
							<FormControl>
								<AutocompleteInput
									fieldName="idNumber"
									placeholder="12345678"
									iconRight={<CreditCard className="h-4 w-4 text-muted-foreground" />}
									{...field}
									onPatientSelect={handlePatientSelect}
									onChange={(e) => {
										const { value } = e.target
										if (/^[0-9]*$/.test(value)) {
											field.onChange(e)
										}
									}}
									className={cn(inputStyles, isLoadingPatient && 'border-blue-300')}
								/>
							</FormControl>
							<p className="text-[10px] sm:text-xs text-gray-500 mt-1">
								💡 Haz clic en una cédula para llenar automáticamente los datos del paciente
							</p>
						</FormItem>
					)}
				/>

				{/* Teléfono - CON AUTOCOMPLETADO */}
				<FormField
					control={control}
					name="phone"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Teléfono *</FormLabel>
							<FormControl>
								<AutocompleteInput
									fieldName="phone"
									placeholder="0412-1234567"
									iconRight={<Phone className="h-4 w-4 text-muted-foreground" />}
									{...field}
									maxLength={15}
									onChange={(e) => {
										const { value } = e.target
										// Permitir números, guiones, espacios, paréntesis y el símbolo +
										if (/^[0-9-+\s()]*$/.test(value) && value.length <= 15) {
											field.onChange(e)
										}
									}}
									className={inputStyles}
								/>
							</FormControl>
						</FormItem>
					)}
				/>

				{/* Fecha de Nacimiento - CON CALENDARIO */}
				{/* Edad - CON VALOR Y UNIDAD */}
				<div className="col-span-1 sm:col-span-2 lg:col-span-1">
					<div className="grid grid-cols-2 gap-2">
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
											className={inputStyles}
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
											className={inputStyles}
										/>
									</FormControl>
								</FormItem>
							)}
						/>
					</div>
				</div>

				{/* Email - CON AUTOCOMPLETADO */}
				<FormField
					control={control}
					name="email"
					render={({ field }) => (
						<FormItem className="space-y-2 flex flex-col col-span-1">
							<FormLabel>Correo electrónico</FormLabel>
							<FormControl>
								<AutocompleteInput
									fieldName="email"
									type="email"
									iconRight={<Mail className="h-4 w-4 text-muted-foreground" />}
									placeholder="email@ejemplo.com"
									{...field}
									className={inputStyles}
								/>
							</FormControl>
						</FormItem>
					)}
				/>

				{/* Fecha de Registro - CON CALENDARIO */}
				<FormField
					control={control}
					name="registrationDate"
					render={({ field }) => (
						<FormItem className="flex flex-col col-span-1">
							<FormLabel>Fecha de Registro *</FormLabel>
							<Popover open={isRegistrationDateCalendarOpen} onOpenChange={setIsRegistrationDateCalendarOpen}>
								<PopoverTrigger asChild>
									<FormControl>
										<Button
											variant={'outline'}
											className={cn(
												'w-full justify-start text-left font-normal',
												!field.value && 'text-muted-foreground',
												inputStyles,
											)}
										>
											<CalendarIcon className="mr-2 h-4 w-4" />
											{field.value ? format(field.value, 'PPP', { locale: es }) : <span>Selecciona fecha</span>}
										</Button>
									</FormControl>
								</PopoverTrigger>
								<PopoverContent className="w-auto p-0 z-[9999]" align="start">
									<Calendar
										mode="single"
										selected={field.value instanceof Date ? field.value : undefined}
										onSelect={(date) => {
											field.onChange(date instanceof Date ? date : null)
											setIsRegistrationDateCalendarOpen(false)
										}}
										disabled={(date) => {
											const today = new Date()
											const maxPastDate = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate())
											return date < maxPastDate || date > today
										}}
										initialFocus
										locale={es}
										defaultMonth={field.value instanceof Date ? field.value : new Date()}
									/>
								</PopoverContent>
							</Popover>
						</FormItem>
					)}
				/>
			</CardContent>
		</Card>
	)
})

PatientDataSection.displayName = 'PatientDataSection'
