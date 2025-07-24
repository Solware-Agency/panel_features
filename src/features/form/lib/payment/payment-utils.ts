import { type FormValues } from '../form-schema'
import { parseDecimalNumber } from '@shared/utils/number-utils'

type Payment = FormValues['payments'][0]

// List of payment methods that are in bolívares (VES)
const BOLIVARES_METHODS = ['Punto de venta', 'Pago móvil', 'Bs en efectivo']

/**
 * Checks if a payment method is in bolívares (VES)
 */
export const isBolivaresMethod = (method: string | undefined): boolean => {
	if (!method) return false
	return BOLIVARES_METHODS.includes(method)
}

/**
 * Calculates payment details including conversion from VES to USD
 * @param payments Array of payment objects
 * @param totalAmount Total amount in USD
 * @param exchangeRate Current exchange rate (VES/USD)
 * @returns Payment status information
 */
export const calculatePaymentDetails = (
	payments: Payment[],
	totalAmount: number | string | undefined,
	exchangeRate: number | undefined,
) => {
	const totalAmountValue = totalAmount ? parseDecimalNumber(totalAmount) : 0

	// If total amount is 0, consider payment complete
	if (totalAmountValue === 0) {
		return {
			paymentStatus: 'Completado',
			isPaymentComplete: true,
			missingAmount: 0,
		}
	}

	const currentTotalPaid = payments.reduce((acc, payment) => {
		const amount = payment.amount ? parseDecimalNumber(payment.amount) : 0
		if (!payment.method || !amount) return acc

		// Check if payment is in bolívares and convert to USD if needed
		if (isBolivaresMethod(payment.method)) {
			if (exchangeRate && exchangeRate > 0) {
				// Convert VES to USD using exchange rate
				return acc + amount / exchangeRate
			}
			return acc
		} else {
			// Payment is already in USD
			return acc + amount
		}
	}, 0)

	let paymentStatus: string | null = null
	let isPaymentComplete = false
	let missingAmount = 0

	if (totalAmountValue > 0) {
		// Round total paid to 2 decimals to avoid floating point issues
		const finalTotalPaid = parseFloat(currentTotalPaid.toFixed(2))
		missingAmount = parseFloat((totalAmountValue - finalTotalPaid).toFixed(2))

		// Consider payment complete if difference is less than 1 cent
		isPaymentComplete = Math.abs(finalTotalPaid - totalAmountValue) < 0.01

		if (isPaymentComplete) {
			paymentStatus = 'Completado'
			missingAmount = 0
		} else if (missingAmount > 0.009) {
			// If missing less than 1 cent, don't show anything
			paymentStatus = `Incompleto`
		}
	}

	return { paymentStatus, isPaymentComplete, missingAmount }
}

// Function to calculate payment details from medical record payment fields
export const calculatePaymentDetailsFromRecord = (record: {
	total_amount: number
	payment_method_1?: string | null
	payment_amount_1?: number | null
	payment_method_2?: string | null
	payment_amount_2?: number | null
	payment_method_3?: string | null
	payment_amount_3?: number | null
	payment_method_4?: string | null
	payment_amount_4?: number | null
	exchange_rate?: number | null
}) => {
	const totalAmount = record.total_amount || 0
	const exchangeRate = record.exchange_rate || undefined

	// If total amount is 0, consider payment complete
	if (totalAmount === 0) {
		return {
			paymentStatus: 'Completado',
			isPaymentComplete: true,
			missingAmount: 0,
		}
	}

	// Convert medical record payment fields to payments array format
	const payments = []

	for (let i = 1; i <= 4; i++) {
		const method = record[`payment_method_${i}` as keyof typeof record] as string | null
		const amount = record[`payment_amount_${i}` as keyof typeof record] as number | null

		if (method && amount && amount > 0) {
			payments.push({
				method,
				amount,
				reference: '', // Reference not needed for calculation
			})
		}
	}

	return calculatePaymentDetails(payments, totalAmount, exchangeRate)
}

/**
 * Validates if the total payments (with VES converted to USD) match the total amount
 * @param payments Array of payment objects
 * @param totalAmount Total amount in USD
 * @param exchangeRate Current exchange rate (VES/USD)
 * @returns Whether the payments are valid
 */
export const validatePaymentTotal = (
	payments: Payment[],
	totalAmount: number,
	exchangeRate: number | undefined,
): boolean => {
	if (totalAmount <= 0) return true

	const { isPaymentComplete } = calculatePaymentDetails(payments, totalAmount, exchangeRate)
	return isPaymentComplete
}

/**
 * Calculates the total amount paid in USD (converting VES payments)
 * @param payments Array of payment objects
 * @param exchangeRate Current exchange rate (VES/USD)
 * @returns Total amount paid in USD
 */
export const calculateTotalPaidUSD = (payments: Payment[], exchangeRate: number | undefined): number => {
	return payments.reduce((acc, payment) => {
		const amount = payment.amount ? parseDecimalNumber(payment.amount) : 0
		if (!payment.method || !amount) return acc

		if (isBolivaresMethod(payment.method)) {
			if (exchangeRate && exchangeRate > 0) {
				return acc + amount / exchangeRate
			}
			return acc
		} else {
			return acc + amount
		}
	}, 0)
}