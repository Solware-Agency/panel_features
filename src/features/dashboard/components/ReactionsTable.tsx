import React, { useRef, useState } from 'react'

const ReactionsTable: React.FC = () => {
	const reportRef = useRef<HTMLDivElement>(null)
	const [payments, setPayments] = useState<Record<string, boolean>>({
		'325007F': false,
		'325006F': false,
	})
	const [selectAll, setSelectAll] = useState(false)

	const handlePaymentToggle = (caseNumber: string) => {
		setPayments((prev) => {
			const newPayments = {
				...prev,
				[caseNumber]: !prev[caseNumber],
			}
			// Verificar si todos están seleccionados
			setSelectAll(Object.values(newPayments).every(Boolean))
			return newPayments
		})
	}

	const handleSelectAll = () => {
		const newSelectAll = !selectAll
		setSelectAll(newSelectAll)
		setPayments((prev) => {
			const updatedPayments = { ...prev }
			Object.keys(updatedPayments).forEach((key) => {
				updatedPayments[key] = newSelectAll
			})
			return updatedPayments
		})
	}

	return (
		<div className="p-3 sm:p-6 overflow-x-hidden max-w-full" ref={reportRef}>
			<table className="w-full border-collapse rounded-lg overflow-hidden shadow-sm bg-white dark:bg-gray-900">
				{/* Encabezado */}
				<thead className="bg-gray-100 dark:bg-gray-800">
					<tr className="text-gray-700 dark:text-gray-300 text-sm">
						<th className="py-3 px-4 text-center border-b border-gray-200 dark:border-gray-700 w-12">
							<div className="flex justify-center items-center">
								<input
									type="checkbox"
									checked={selectAll}
									onChange={handleSelectAll}
									className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded dark:bg-gray-700 dark:border-gray-600 cursor-pointer"
								/>
							</div>
						</th>
						<th className="py-3 px-4 text-center border-b border-gray-200 dark:border-gray-700">Nº DE CASO</th>
						<th className="py-3 px-4 text-center border-b border-gray-200 dark:border-gray-700 w-[60%]">
							INMUNORREACCIONES
						</th>
						<th className="py-3 px-4 text-center border-b border-gray-200 dark:border-gray-700">Nº DE REACCIONES</th>
						<th className="py-3 px-4 text-center border-b border-gray-200 dark:border-gray-700">TOTAL EN DIVISAS</th>
					</tr>
				</thead>

				{/* Cuerpo */}
				<tbody className="divide-y divide-gray-200 dark:divide-gray-800">
					{Object.entries(payments).map(([caseNumber, isPaid], index) => {
						const caseData = [
							{
								reactions: 'RE,RP,CERB2,KI67',
								count: 4,
								amount: '18$',
							},
							{
								reactions: 'ISNM1,KI67',
								count: 2,
								amount: '18$',
							},
						][index]

						return (
							<tr
								key={caseNumber}
								className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${
									isPaid ? 'bg-green-50/50 dark:bg-green-900/20' : ''
								}`}
							>
								<td className="py-3 px-4 text-center">
									<div className="flex justify-center items-center">
										<input
											type="checkbox"
											checked={isPaid}
											onChange={() => handlePaymentToggle(caseNumber)}
											className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded dark:bg-gray-700 dark:border-gray-600 cursor-pointer"
										/>
									</div>
								</td>
								<td className="py-3 px-4 text-center text-gray-800 dark:text-gray-200">{caseNumber}</td>
								<td className="py-3 px-4 text-center text-gray-700 dark:text-gray-300">{caseData.reactions}</td>
								<td className="py-3 px-4 text-center text-gray-700 dark:text-gray-300">{caseData.count}</td>
								<td
									className={`py-3 px-4 text-center font-medium ${
										isPaid ? 'text-green-800 dark:text-green-300 line-through' : 'text-green-600 dark:text-green-400'
									}`}
								>
									{caseData.amount}
								</td>
							</tr>
						)
					})}
				</tbody>

				{/* Pie de tabla */}
				<tfoot className="bg-gray-50 dark:bg-gray-800/80">
					<tr>
						<td colSpan={4} className="py-3 px-4 text-left font-medium text-gray-900 dark:text-gray-200">
							Total
						</td>
						<td className="py-3 px-4 text-center font-bold text-green-700 dark:text-green-300">
							{Object.values(payments).every(Boolean) ? <span className="line-through">36$</span> : '36$'}
						</td>
					</tr>
				</tfoot>
			</table>

			{/* Estado de pagos */}
			<div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
				{Object.values(payments).filter(Boolean).length} de {Object.keys(payments).length} pagos completados
			</div>
		</div>
	)
}

export default ReactionsTable
