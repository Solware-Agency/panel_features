import React from 'react'
import { Card } from '@shared/components/ui/card'
import { Stethoscope, Activity, Heart, Eye } from 'lucide-react'
import { useDashboardStats } from '@shared/hooks/useDashboardStats'
import { useBreakpoint } from '@shared/components/ui/media-query'

const ExamTypeReport: React.FC = () => {
	const { data: stats, isLoading } = useDashboardStats()
	const isDesktop = useBreakpoint('lg')

	const formatCurrency = (amount: number) => {
		return new Intl.NumberFormat('es-VE', {
			style: 'currency',
			currency: 'USD',
			minimumFractionDigits: 0,
			maximumFractionDigits: 0,
		}).format(amount)
	}

	// Get exam type icon based on type
	const getExamTypeIcon = (examType: string) => {
		const type = examType.toLowerCase()
		if (type.includes('citologia')) {
			return <Eye className="w-4 h-4 text-white" />
		} else if (type.includes('biopsia')) {
			return <Activity className="w-4 h-4 text-white" />
		} else if (type.includes('inmunohistoquimica')) {
			return <Heart className="w-4 h-4 text-white" />
		}
		return <Stethoscope className="w-4 h-4 text-white" />
	}

	return (
		<Card className="col-span-1 grid hover:border-primary hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/20 transition-all duration-300 shadow-lg mb-6">
			<div className="bg-white dark:bg-background rounded-xl p-3 sm:p-5 overflow-hidden">
				<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6">
					<h3 className="text-lg sm:text-xl font-bold text-gray-700 dark:text-gray-300 mb-2 sm:mb-0">
						Tipos de Exámenes Más Solicitados
					</h3>
				</div>
				<div className="space-y-3 sm:space-y-4">
					{isLoading ? (
						<div className="space-y-3">
							{[1, 2, 3].map((i) => (
								<div key={i} className="animate-pulse bg-gray-200 dark:bg-gray-700 h-16 rounded-xl"></div>
							))}
						</div>
					) : stats?.revenueByExamType && stats.revenueByExamType.length > 0 ? (
						<div className="overflow-x-auto w-full">
							{isDesktop ? (
								<table className="w-full min-w-full">
									<thead>
										<tr className="border-b border-gray-200 dark:border-gray-700">
											<th className="text-left py-3 text-gray-600 dark:text-gray-400 font-medium text-sm">
												Tipo de Examen
											</th>
											<th className="text-center py-3 text-gray-600 dark:text-gray-400 font-medium text-sm">Casos</th>
											<th className="text-center py-3 text-gray-600 dark:text-gray-400 font-medium text-sm">
												% del Total
											</th>
											<th className="text-right py-3 text-gray-600 dark:text-gray-400 font-medium text-sm">
												Monto Total
											</th>
										</tr>
									</thead>
									<tbody>
										{stats.revenueByExamType.map((exam, index) => {
											const colors = ['bg-blue-500', 'bg-green-500', 'bg-orange-500', 'bg-red-500']
											const percentage = stats.totalRevenue > 0 ? (exam.revenue / stats.totalRevenue) * 100 : 0

											return (
												<tr
													key={index}
													className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50"
												>
													<td className="py-4">
														<div className="flex items-center gap-2">
															<div
																className={`w-8 h-8 ${
																	colors[index % colors.length]
																} rounded-lg flex items-center justify-center`}
															>
																{getExamTypeIcon(exam.examType)}
															</div>
															<p className="font-medium text-gray-700 dark:text-gray-300 text-sm">{exam.examType}</p>
														</div>
													</td>
													<td className="py-4 text-center">
														<span className="inline-flex items-center justify-center px-2 py-1 text-xs font-medium rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
															{exam.count} caso{exam.count !== 1 ? 's' : ''}
														</span>
													</td>
													<td className="py-4 text-center">
														<span className="text-sm font-medium text-gray-700 dark:text-gray-300">
															{percentage.toFixed(1)}%
														</span>
													</td>
													<td className="py-4 text-right">
														<p className="text-base font-bold text-gray-700 dark:text-gray-300">
															{formatCurrency(exam.revenue)}
														</p>
														<div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mt-1">
															<div
																className={`h-1.5 rounded-full ${colors[index % colors.length]}`}
																style={{
																	width: `${
																		stats.revenueByExamType.length > 0
																			? (exam.revenue / Math.max(...stats.revenueByExamType.map((e) => e.revenue))) *
																			  100
																			: 0
																	}%`,
																}}
															></div>
														</div>
													</td>
												</tr>
											)
										})}
									</tbody>
								</table>
							) : (
								// Mobile card view
								<div className="space-y-3 w-full">
									{stats.revenueByExamType.map((exam, index) => {
										const colors = ['bg-blue-500', 'bg-green-500', 'bg-orange-500', 'bg-red-500']
										const percentage = stats.totalRevenue > 0 ? (exam.revenue / stats.totalRevenue) * 100 : 0

										return (
											<div
												key={index}
												className="bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg p-3 w-full"
											>
												<div className="flex items-center gap-2 mb-2 flex-wrap">
													<div
														className={`w-8 h-8 ${
															colors[index % colors.length]
														} rounded-lg flex items-center justify-center`}
													>
														{getExamTypeIcon(exam.examType)}
													</div>
													<div className="flex-1 min-w-0 max-w-full">
														<p className="font-medium text-gray-700 dark:text-gray-300 text-sm truncate">
															{exam.examType}
														</p>
														<div className="flex items-center gap-2">
															<span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
																{exam.count} caso{exam.count !== 1 ? 's' : ''}
															</span>
															<span className="text-xs font-medium text-gray-500 dark:text-gray-400">
																{percentage.toFixed(1)}%
															</span>
														</div>
													</div>
													<p className="text-base font-bold text-gray-700 dark:text-gray-300 ml-auto whitespace-nowrap">
														{formatCurrency(exam.revenue)}
													</p>
												</div>
												<div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
													<div
														className={`h-1.5 rounded-full ${colors[index % colors.length]}`}
														style={{
															width: `${
																stats.revenueByExamType.length > 0
																	? (exam.revenue / Math.max(...stats.revenueByExamType.map((e) => e.revenue))) * 100
																	: 0
															}%`,
														}}
													></div>
												</div>
											</div>
										)
									})}
								</div>
							)}
						</div>
					) : (
						<div className="text-center py-8">
							<Stethoscope className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
							<p className="text-gray-500 dark:text-gray-400">No hay datos de exámenes disponibles</p>
						</div>
					)}
				</div>
			</div>
		</Card>
	)
}

export default ExamTypeReport
