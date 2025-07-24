import { Input } from '@shared/components/ui/input'
import { FormLabel } from '@shared/components/ui/form'
import { memo } from 'react'
import { createCalculatorInputHandler } from '@shared/utils/number-utils'

interface CurrencyConverterProps {
	usdValue: string
	setUsdValue: (value: string) => void
	vesValue: string
	vesInputValue: string
	setVesInputValue: (value: string) => void
	usdFromVes: string
	exchangeRate: number | undefined
	isLoadingRate: boolean
	inputStyles: string
}

export const ConverterUSDtoVES = memo(
	({
		usdValue,
		setUsdValue,
		vesValue,
		inputStyles,
	}: CurrencyConverterProps) => {
		// Calculator handlers for both inputs
		const usdCalculatorHandler = createCalculatorInputHandler(parseFloat(usdValue) || 0, (value: number) =>
			setUsdValue(value.toString()),
		)


		return (
			<div className="w-full space-y-2">
				<FormLabel className="text-sm sm:text-base">Convertidor USD a VES</FormLabel>
				<Input
					type="text"
					inputMode="decimal"
					placeholder="0,00"
					value={usdCalculatorHandler.displayValue}
					onKeyDown={usdCalculatorHandler.handleKeyDown}
					onPaste={usdCalculatorHandler.handlePaste}
					onFocus={usdCalculatorHandler.handleFocus}
					onChange={usdCalculatorHandler.handleChange}
					className={`${inputStyles} text-right font-mono`}
					autoComplete="off"
				/>
				{vesValue && <p className="text-xs sm:text-sm font-bold text-green-600">{vesValue} VES</p>}
				{/* <p className="text-[10px] sm:text-xs text-muted-foreground">
						{isLoadingRate ? 'Cargando tasa...' : `Tasa BCV: ${exchangeRate?.toFixed(2) || 'N/A'} VES/USD`}
					</p> */}
			</div>
		)
	},
)

ConverterUSDtoVES.displayName = 'ConverterUSDtoVES'
