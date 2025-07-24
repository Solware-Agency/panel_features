import {
	type Control,
	type FieldArrayWithId,
	type UseFieldArrayAppend,
	type UseFieldArrayRemove,
} from 'react-hook-form'
import { type FormValues } from '@features/form/lib/form-schema'
import { FormLabel } from '@shared/components/ui/form'
import { Button } from '@shared/components/ui/button'
import { PlusCircle } from 'lucide-react'
import { PaymentMethodItem } from './PaymentMethodItem'
import { memo, useCallback } from 'react'

interface PaymentMethodsListProps {
	control: Control<FormValues>
	fields: FieldArrayWithId<FormValues, 'payments', 'id'>[]
	append?: UseFieldArrayAppend<FormValues, 'payments'>
	remove: UseFieldArrayRemove
	inputStyles: string
	paymentStatus: string | null
	isPaymentComplete: boolean
	missingAmount?: number
	exchangeRate?: number
}

export const PaymentMethodsList = memo(
	({
		control,
		fields,
		append,
		remove,
		inputStyles,
		exchangeRate,
	}: PaymentMethodsListProps) => {
		// Memoize the append handler to prevent unnecessary re-renders
		const handleAppend = useCallback(() => {
			if (append) {
				append({ method: '', amount: 0, reference: '' })
			}
		}, [append])

		return (
			<div className="space-y-3 sm:space-y-4">
				<div className="flex justify-between items-center mb-1 sm:mb-2">
					<FormLabel className="font-semibold text-xs sm:text-sm md:text-base">Métodos de Pago</FormLabel>
				</div>
				{fields.map((item, index) => (
					<PaymentMethodItem
						key={item.id}
						className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 items-start bg-secondary p-3 sm:p-4 rounded-lg  max-w-[80%] w-full"
						control={control}
						index={index}
						item={item}
						remove={remove}
						inputStyles={inputStyles}
						fieldsLength={fields.length}
						exchangeRate={exchangeRate}
					/>
				))}
				<Button
					type="button"
					variant="outline"
					size="sm"
					onClick={handleAppend}
					disabled={!append || fields.length >= 4}
					className="disabled:opacity-40 text-xs py-1 px-2 sm:py-1.5 sm:px-2.5"
				>
					<PlusCircle className="mr-2 h-4 w-4" />
					Añadir método de pago
				</Button>
				{fields.length >= 4 && (
					<div className="text-[10px] text-red-500">No puedes agregar más de 4 métodos de pago.</div>
				)}
			</div>
		)
	},
)

PaymentMethodsList.displayName = 'PaymentMethodsList'