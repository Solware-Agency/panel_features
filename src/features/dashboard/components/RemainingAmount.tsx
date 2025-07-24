import React, { useRef } from 'react'
import { DollarSign, Users, Clock, AlertCircle, CheckCircle, XCircle } from 'lucide-react'
import { Card } from '@shared/components/ui/card'
import { useDashboardStats } from '@shared/hooks/useDashboardStats'

const RemainingAmount: React.FC = () => {
	const { data: stats, isLoading } = useDashboardStats()
	const reportRef = useRef<HTMLDivElement>(null)

	const formatCurrency = (amount: number) => {
		return new Intl.NumberFormat('es-VE', {
			style: 'currency',
			currency: 'USD',
			minimumFractionDigits: 0,
			maximumFractionDigits: 0,
		}).format(amount)
	}

	// Calculate pending payments percentage
	const pendingPaymentsPercentage = stats?.totalRevenue ? (stats.pendingPayments / stats.totalRevenue) * 100 : 0

	return (
		<div className="overflow-x-hidden max-w-full py-3" ref={reportRef}>
			{/* Pending Payments Section */}
			<Card className="col-span-1 grid hover:border-primary hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/20 transition-all duration-300 shadow-lg overflow-hidden group cursor-pointer">
				<div className="bg-white dark:bg-background rounded-xl p-3 sm:p-5">
					<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6">
						<h3 className="text-lg sm:text-xl font-bold text-gray-700 dark:text-gray-300 mb-2 sm:mb-0 flex items-center gap-2">
							<AlertCircle className="w-5 h-5 text-red-500 group-hover:scale-110 transition-transform duration-300" />
							Casos por Cobrar
						</h3>
						<div className="flex items-center gap-2 px-3 py-2 bg-red-100 dark:bg-red-900/30 rounded-lg group-hover:bg-red-200 dark:group-hover:bg-red-800/40 transition-colors duration-300">
							<Clock className="w-4 h-4 text-red-600 dark:text-red-400 group-hover:scale-110 transition-transform duration-300" />
							<span className="text-sm font-medium text-red-700 dark:text-red-300">Pagos pendientes</span>
						</div>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
						{/* Amount Card - Responsive */}
						<div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 rounded-xl p-3 sm:p-4 border border-red-200 dark:border-red-800/30 group-hover:scale-[1.02] group-hover:shadow-lg group-hover:shadow-red-500/20 transition-all duration-300 cursor-pointer">
							<div className="flex items-center gap-3 mb-3">
								<div className="p-3 bg-red-500 rounded-lg group-hover:scale-110 transition-transform duration-300">
									<DollarSign className="w-6 h-6 text-white group-hover:scale-110 transition-transform duration-300" />
								</div>
								<div>
									<p className="text-sm text-red-700 dark:text-red-300">Monto por Cobrar</p>
									<p className="text-2xl font-bold text-red-800 dark:text-red-200">
										{isLoading ? '...' : formatCurrency(stats?.pendingPayments || 0)}
									</p>
								</div>
							</div>
							<div className="w-full bg-red-200 dark:bg-red-800/50 rounded-full h-3">
								<div
									className="bg-red-500 h-3 rounded-full flex items-center justify-end pr-2"
									style={{ width: `${Math.min(pendingPaymentsPercentage, 100)}%` }}
								>
									{pendingPaymentsPercentage > 15 && (
										<span className="text-xs text-white font-medium">{pendingPaymentsPercentage.toFixed(1)}%</span>
									)}
								</div>
							</div>
							{pendingPaymentsPercentage <= 15 && (
								<div className="text-xs text-red-700 dark:text-red-300 mt-1">
									{pendingPaymentsPercentage.toFixed(1)}% del total de ingresos
								</div>
							)}
						</div>

						{/* Cases Card - Responsive */}
						<div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-xl p-3 sm:p-4 border border-orange-200 dark:border-orange-800/30 group-hover:scale-[1.02] group-hover:shadow-lg group-hover:shadow-orange-500/20 transition-all duration-300 cursor-pointer">
							<div className="flex items-center gap-3 mb-3">
								<div className="p-3 bg-orange-500 rounded-lg group-hover:scale-110 transition-transform duration-300">
									<Users className="w-6 h-6 text-white group-hover:scale-110 transition-transform duration-300" />
								</div>
								<div>
									<p className="text-sm text-orange-700 dark:text-orange-300">Casos Incompletos</p>
									<p className="text-2xl font-bold text-orange-800 dark:text-orange-200">
										{isLoading ? '...' : stats?.incompleteCases || 0}
									</p>
								</div>
							</div>
							<div className="w-full bg-orange-200 dark:bg-orange-800/50 rounded-full h-3">
								<div
									className="bg-orange-500 h-3 rounded-full flex items-center justify-end pr-2"
									style={{
										width: `${stats?.totalCases ? (stats.incompleteCases / stats.totalCases) * 100 : 0}%`,
									}}
								>
									{stats?.totalCases && (stats.incompleteCases / stats.totalCases) * 100 > 15 && (
										<span className="text-xs text-white font-medium">
											{((stats.incompleteCases / stats.totalCases) * 100).toFixed(1)}%
										</span>
									)}
								</div>
							</div>
							{stats?.totalCases && (stats.incompleteCases / stats.totalCases) * 100 <= 15 && (
								<div className="text-xs text-orange-700 dark:text-orange-300 mt-1">
									{((stats.incompleteCases / stats.totalCases) * 100).toFixed(1)}% del total de casos
								</div>
							)}
						</div>
					</div>

					{/* Status Breakdown */}
					<div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3 sm:p-4 overflow-hidden group-hover:bg-gray-50 dark:group-hover:bg-gray-800/50 transition-colors duration-300">
						<h4 className="text-base font-semibold text-gray-700 dark:text-gray-300 mb-3 sm:mb-4">
							Desglose de Estatus
						</h4>
						<div className="space-y-3 sm:space-y-4">
							{/* Completed Cases */}
							<div className="group-hover:bg-gray-100 dark:group-hover:bg-gray-700/50 p-2 rounded-lg transition-all duration-300 hover:scale-[1.01]">
								<div className="flex items-center justify-between mb-2">
									<div className="flex items-center gap-2">
										<CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 group-hover:scale-110 transition-transform duration-300" />
										<span className="text-sm font-medium text-gray-600 dark:text-gray-400">Casos Completados</span>
									</div>
									<span className="text-sm font-bold text-green-700 dark:text-green-300">
										{isLoading ? '...' : stats?.completedCases || 0} casos
									</span>
								</div>
								<div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
									<div
										className="bg-green-500 h-2.5 rounded-full"
										style={{
											width: `${stats?.totalCases ? (stats.completedCases / stats.totalCases) * 100 : 0}%`,
										}}
									></div>
								</div>
								<div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
									{stats?.totalCases ? ((stats.completedCases / stats.totalCases) * 100).toFixed(1) : 0}% del total
								</div>
							</div>

							{/* Incomplete Cases */}
							<div className="group-hover:bg-gray-100 dark:group-hover:bg-gray-700/50 p-2 rounded-lg transition-all duration-300 hover:scale-[1.01]">
								<div className="flex items-center justify-between mb-2">
									<div className="flex items-center gap-2">
										<XCircle className="w-4 h-4 text-red-600 dark:text-red-400 group-hover:scale-110 transition-transform duration-300" />
										<span className="text-sm font-medium text-gray-600 dark:text-gray-400">Casos Incompletos</span>
									</div>
									<span className="text-sm font-bold text-red-700 dark:text-red-300">
										{isLoading ? '...' : stats?.incompleteCases || 0} casos
									</span>
								</div>
								<div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
									<div
										className="bg-red-500 h-2.5 rounded-full"
										style={{
											width: `${stats?.totalCases ? (stats.incompleteCases / stats.totalCases) * 100 : 0}%`,
										}}
									></div>
								</div>
								<div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
									{stats?.totalCases ? ((stats.incompleteCases / stats.totalCases) * 100).toFixed(1) : 0}% del total
								</div>
							</div>
						</div>
					</div>
				</div>
			</Card>

			{/* Print styles - only applied when printing */}
			<style>{`
				@media print {
					body {
						background: white;
						font-size: 12pt;
						color: black;
					}
					
					.print\\:hidden {
						display: none !important;
					}
					
					.dark\\:bg-background,
					.bg-white,
					.dark\\:bg-gray-800 {
						background: white !important;
						color: black !important;
					}
					
					.dark\\:text-gray-300,
					.dark\\:text-gray-400,
					.dark\\:text-gray-100,
					.text-gray-700 {
						color: black !important;
					}
					
					.shadow-lg,
					.shadow-xl,
					.shadow-md {
						box-shadow: none !important;
					}
					
					.border {
						border-color: #ddd !important;
					}
					
					h3 {
						font-size: 16pt !important;
						margin-top: 20pt !important;
						margin-bottom: 10pt !important;
						page-break-after: avoid !important;
					}
					
					table {
						page-break-inside: auto !important;
						border-collapse: collapse !important;
					}
					
					tr {
						page-break-inside: avoid !important;
						page-break-after: auto !important;
					}
					
					td, th {
						border: 1px solid #ddd !important;
						padding: 8px !important;
					}
					
					thead {
						display: table-header-group !important;
					}
					
					tfoot {
						display: table-footer-group !important;
					}
					
					.card {
						page-break-inside: avoid !important;
						margin-bottom: 20pt !important;
						border: 1px solid #ddd !important;
						padding: 15pt !important;
					}
					
					.grid {
						display: block !important;
					}
					
					.col-span-1,
					.col-span-2,
					.col-span-3,
					.xl\\:col-span-2,
					.xl\\:col-span-3 {
						width: 100% !important;
						margin-bottom: 20pt !important;
					}
					
					@page {
						margin: 2cm;
					}
				}
			`}</style>
		</div>
	)
}

export default RemainingAmount
