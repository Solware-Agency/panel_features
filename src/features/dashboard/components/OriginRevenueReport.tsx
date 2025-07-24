import React from 'react'
import { Card } from '@shared/components/ui/card'
import { MapPin } from 'lucide-react'
import { useDashboardStats } from '@shared/hooks/useDashboardStats'
import { useBreakpoint } from '@shared/components/ui/media-query'

const OriginRevenueReport: React.FC = () => {
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

  return (
		<Card className="col-span-1 grid hover:border-primary hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/20 transition-all duration-300 shadow-lg mb-6">
			<div className="bg-white dark:bg-background rounded-xl p-3 sm:p-5 overflow-hidden">
				<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6">
					<h3 className="text-lg sm:text-xl font-bold text-gray-700 dark:text-gray-300 mb-2 sm:mb-0 flex items-center gap-2">
						<MapPin className="w-5 h-5 text-purple-500" />
						Ingreso por Procedencia
					</h3>
				</div>

				<div className="overflow-x-auto w-full">
					{isLoading ? (
						<div className="py-8 text-center">
							<div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-500 mx-auto"></div>
						</div>
					) : stats?.revenueByOrigin && stats.revenueByOrigin.length > 0 ? (
						isDesktop ? (
							<table className="w-full min-w-full">
								<thead>
									<tr className="border-b border-gray-200 dark:border-gray-700">
										<th className="text-left py-3 text-gray-600 dark:text-gray-400 font-medium text-sm">Procedencia</th>
										<th className="text-center py-3 text-gray-600 dark:text-gray-400 font-medium text-sm">Casos</th>
										<th className="text-center py-3 text-gray-600 dark:text-gray-400 font-medium text-sm">% del Total</th>
										<th className="text-right py-3 text-gray-600 dark:text-gray-400 font-medium text-sm">Monto Total</th>
									</tr>
								</thead>
								<tbody>
									{stats.revenueByOrigin.map((origin, index) => (
										<tr
											key={index}
											className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50"
										>
											<td className="py-4">
												<p className="font-medium text-gray-700 dark:text-gray-300 text-sm">{origin.origin}</p>
											</td>
											<td className="py-4 text-center">
												<span className="inline-flex items-center justify-center px-2 py-1 text-xs font-medium rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
													{origin.cases} caso{origin.cases !== 1 ? 's' : ''}
												</span>
											</td>
											<td className="py-4 text-center">
												<span className="text-sm font-medium text-gray-700 dark:text-gray-300">
													{origin.percentage.toFixed(1)}%
												</span>
											</td>
											<td className="py-4 text-right">
												<p className="text-base font-bold text-gray-700 dark:text-gray-300">
													{formatCurrency(origin.revenue)}
												</p>
												<div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mt-1">
													<div
														className="bg-purple-500 h-1.5 rounded-full"
														style={{
															width: `${
																stats.revenueByOrigin.length > 0
																	? (origin.revenue / Math.max(...stats.revenueByOrigin.map((o) => o.revenue))) * 100
																	: 0
															}%`,
														}}
													></div>
												</div>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						) : (
							// Mobile card view
							<div className="space-y-3 w-full">
								{stats.revenueByOrigin.map((origin, index) => (
									<div 
										key={index} 
										className="bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg p-3 w-full"
									>
										<div className="flex items-center justify-between mb-2 flex-wrap">
											<div className="flex items-center gap-2 min-w-0 max-w-[70%]">
												<MapPin className="w-4 h-4 text-purple-600 dark:text-purple-400" />
												<p className="font-medium text-gray-700 dark:text-gray-300 text-sm truncate">{origin.origin}</p>
											</div>
											<p className="text-base font-bold text-gray-700 dark:text-gray-300 whitespace-nowrap">
												{formatCurrency(origin.revenue)}
											</p>
										</div>
										
										<div className="flex items-center justify-between mb-1">
											<span className="inline-flex items-center justify-center px-2 py-1 text-xs font-medium rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
												{origin.cases} caso{origin.cases !== 1 ? 's' : ''}
											</span>
											<span className="text-xs font-medium text-gray-700 dark:text-gray-300">
												{origin.percentage.toFixed(1)}%
											</span>
										</div>
										
										<div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
											<div
												className="bg-purple-500 h-1.5 rounded-full"
												style={{
													width: `${
														stats.revenueByOrigin.length > 0
															? (origin.revenue / Math.max(...stats.revenueByOrigin.map((o) => o.revenue))) * 100
															: 0
													}%`,
												}}
											></div>
										</div>
									</div>
								))}
							</div>
						)
					) : (
						<div className="py-8 text-center">
							<div className="text-gray-500 dark:text-gray-400">
								<MapPin className="w-12 h-12 mx-auto mb-4 opacity-50" />
								<p className="text-lg font-medium">No hay datos de procedencia</p>
							</div>
						</div>
					)}
				</div>
			</div>
		</Card>
	)
}

export default OriginRevenueReport