import { type Control, useWatch } from 'react-hook-form'
import { type FormValues } from '@features/form/lib/form-schema'
import { FormField, FormItem, FormLabel, FormControl } from '@shared/components/ui/form'
import { Input } from '@shared/components/ui/input'
import { AutocompleteInput } from '@shared/components/ui/autocomplete-input'
import { FormDropdown, createDropdownOptions } from '@shared/components/ui/form-dropdown'
import { Card, CardContent, CardHeader, CardTitle } from '@shared/components/ui/card'
import { useUserProfile } from '@shared/hooks/useUserProfile'
import { useEffect, memo } from 'react'
import { Stethoscope, MapPin, Microscope, Hash } from 'lucide-react'

interface ServiceSectionProps {
	control: Control<FormValues>
	inputStyles: string
}

export const ServiceSection = memo(({ control, inputStyles }: ServiceSectionProps) => {
	const { profile } = useUserProfile()
	const branch = useWatch({ control, name: 'branch' })

	// Auto-set branch if user has an assigned branch - memoized with useCallback
	useEffect(() => {
		if (profile?.assigned_branch && !branch) {
			// Set the branch to the user's assigned branch
			const setValue = control._options.context?.setValue
			if (setValue) {
				setValue('branch', profile.assigned_branch)
			}
		}
	}, [profile, branch, control])

	return (
		<Card className="transition-all duration-300 hover:border-primary hover:shadow-lg hover:shadow-primary/20">
			<CardHeader className="p-3 sm:p-4 md:p-6">
				<CardTitle className="text-base sm:text-lg">Servicio</CardTitle>
				<div className="w-12 sm:w-16 md:w-20 h-1 bg-primary mt-1 rounded-full" />
			</CardHeader>
			<CardContent className="p-3 sm:p-4 pt-0 sm:pt-0 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
				{/* Tipo de Examen - SIN AUTOCOMPLETADO (es un select) */}
				<FormField
					control={control}
					name="examType"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Tipo de Examen *</FormLabel>
							<FormControl>
								<FormDropdown
									options={createDropdownOptions([
										{ value: 'inmunohistoquimica', label: 'Inmunohistoquímica' },
										{ value: 'biopsia', label: 'Biopsia' },
										{ value: 'citologia', label: 'Citología' },
									])}
									value={field.value}
									onChange={field.onChange}
									placeholder="Seleccione una opción"
									className={inputStyles}
								/>
							</FormControl>
						</FormItem>
					)}
				/>

				{/* Procedencia - CON AUTOCOMPLETADO */}
				<FormField
					control={control}
					name="origin"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Procedencia *</FormLabel>
							<FormControl>
								<AutocompleteInput
									fieldName="origin"
									placeholder="Hospital o Clínica"
									iconRight={<MapPin className="h-4 w-4 text-muted-foreground" />}
									{...field}
									onChange={(e: any) => {
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

				{/* Médico Tratante - CON AUTOCOMPLETADO */}
				<FormField
					control={control}
					name="treatingDoctor"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Médico Tratante *</FormLabel>
							<FormControl>
								<AutocompleteInput
									fieldName="treatingDoctor"
									placeholder="Nombre del Médico"
									iconRight={<Stethoscope className="h-4 w-4 text-muted-foreground" />}
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

				{/* Tipo de Muestra - CON AUTOCOMPLETADO */}
				<FormField
					control={control}
					name="sampleType"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Tipo de Muestra *</FormLabel>
							<FormControl>
								<AutocompleteInput
									fieldName="sampleType"
									placeholder="Ej: Biopsia de Piel"
									iconRight={<Microscope className="h-4 w-4 text-muted-foreground" />}
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

				{/* Cantidad de Muestras - PLACEHOLDER ACTUALIZADO */}
				<FormField
					control={control}
					name="numberOfSamples"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Cantidad de Muestras *</FormLabel>
							<FormControl>
								<Input
									type="number"
									placeholder="0"
									{...field}
									iconRight={<Hash className="h-4 w-4 text-muted-foreground" />}
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

				{/* Relación - CON AUTOCOMPLETADO */}
				<FormField
					control={control}
					name="relationship"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Relación</FormLabel>
							<FormControl>
								<AutocompleteInput
									fieldName="relationship"
									placeholder="Relación con la muestra"
									{...field}
									className={inputStyles}
								/>
							</FormControl>
						</FormItem>
					)}
				/>
			</CardContent>
		</Card>
	)
})

ServiceSection.displayName = 'ServiceSection'