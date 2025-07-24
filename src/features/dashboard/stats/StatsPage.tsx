import React, { useState } from 'react'
import { Users, DollarSign, ShoppingCart, ArrowUpRight, AlertTriangle, Clock } from 'lucide-react'
import { useDashboardStats } from '@shared/hooks/useDashboardStats'
import { YearSelector } from '@shared/components/ui/year-selector'
import StatCard from '@shared/components/ui/stat-card'
import StatDetailPanel from '@shared/components/ui/stat-detail-panel'
import type { StatType } from '@shared/components/ui/stat-detail-panel'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Card } from '@shared/components/ui/card'
import ExamTypePieChart from '@features/dashboard/components/ExamTypePieChart'
import BranchRevenueReport from '@features/dashboard/components/BranchRevenueReport'
import DoctorRevenueReport from '@features/dashboard/components/DoctorRevenueReport'
import OriginRevenueReport from '@features/dashboard/components/OriginRevenueReport'
import RemainingAmount from '@features/dashboard/components/RemainingAmount'

const StatsPage: React.FC = () => {
	const [selectedMonth, setSelectedMonth] = useState<Date>(new Date())
	const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear())
	const { data: stats, isLoading, error } = useDashboardStats(selectedMonth, selectedYear)
	const [selectedStat, setSelectedStat] = useState<StatType | null>(null)
	const [isDetailPanelOpen, setIsDetailPanelOpen] = useState(false)
	const [hoveredSegmentIndex, setHoveredSegmentIndex] = useState<number | null>(null)

	if (error) {
		console.error('Error loading stats:', error)
	}

	const formatCurrency = (amount: number) => {
		return new Intl.NumberFormat('es-VE', {
			style: 'currency',
			currency: 'USD',
			minimumFractionDigits: 0,
			maximumFractionDigits: 0,
		}).format(amount)
	}

	const handleMonthBarClick = (monthData: { monthIndex: number }) => {
		// FIXED: Use the monthIndex to create the correct date
		const clickedDate = new Date(selectedYear, monthData.monthIndex, 1)
		setSelectedMonth(clickedDate)
	}

	const handleYearChange = (year: number) => {
		setSelectedYear(year)
		// Update selected month to the same month in the new year
		setSelectedMonth(new Date(year, selectedMonth.getMonth(), 1))
	}

	const handleStatCardClick = (statType: StatType) => {
		setSelectedStat(statType)
		setIsDetailPanelOpen(true)
	}

	const handleDetailPanelClose = () => {
		setIsDetailPanelOpen(false)
	}

	// Calculate some additional metrics
	const completionRate = stats?.totalCases ? (stats.completedCases / stats.totalCases) * 100 : 0

	return (
		<>
			<div className="p-2 sm:p-4 md:p-6 overflow-x-hidden">
				{/* <div className="text-sm text-gray-600 dark:text-gray-400">
							Mes seleccionado:{' '}
							<span className="font-medium">{format(selectedMonth, 'MMMM yyyy', { locale: es })}</span>
						</div> */}
				{/* KPI Cards Grid */}
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-3 sm:mb-5 md:mb-6">
					{/* Total Revenue Card */}
					<StatCard
						title="Ingresos Este Mes"
						// value={isLoading ? '...' : formatCurrency(stats?.totalRevenue || 0)}
						// description={`Este mes: ${isLoading ? '...' : formatCurrency(stats?.monthlyRevenue || 0)}`}
						value={`${isLoading ? '...' : formatCurrency(stats?.monthlyRevenue || 0)}`}
						description={`Total: ${isLoading ? '...' : formatCurrency(stats?.totalRevenue || 0)}`}
						icon={<DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 dark:text-green-400" />}
						trend={{
							value: isLoading ? '...' : '+12.5%',
							icon: <ArrowUpRight className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />,
							positive: true,
						}}
						onClick={() => handleStatCardClick('totalRevenue')}
						statType="totalRevenue"
						isSelected={selectedStat === 'totalRevenue' && isDetailPanelOpen}
					/>

					{/* Active Users Card */}
					<StatCard
						title="Pacientes Nuevos Este Mes"
						// value={isLoading ? '...' : stats?.uniquePatients || 0}
						// description={`Nuevos este mes: ${isLoading ? '...' : stats?.newPatientsThisMonth || 0}`}
						value={`${isLoading ? '...' : stats?.newPatientsThisMonth || 0}`}
						description={`Total: ${isLoading ? '...' : stats?.uniquePatients || 0}`}
						icon={<Users className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400" />}
						trend={{
							value: isLoading ? '...' : `+${stats?.newPatientsThisMonth || 0}`,
							icon: <ArrowUpRight className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />,
							positive: true,
						}}
						onClick={() => handleStatCardClick('uniquePatients')}
						statType="uniquePatients"
						isSelected={selectedStat === 'uniquePatients' && isDetailPanelOpen}
					/>

					{/* Completed Projects Card */}
					<StatCard
						title="Casos Completados"
						value={isLoading ? '...' : stats?.completedCases || 0}
						description={`Total casos: ${isLoading ? '...' : stats?.totalCases || 0}`}
						icon={<ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600 dark:text-purple-400" />}
						trend={{
							value: isLoading ? '...' : `${completionRate.toFixed(1)}%`,
							icon: <ArrowUpRight className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />,
							positive: true,
						}}
						onClick={() => handleStatCardClick('completedCases')}
						statType="completedCases"
						isSelected={selectedStat === 'completedCases' && isDetailPanelOpen}
					/>

					{/* Incomplete Cases Card */}
					<StatCard
						title="Casos Incompletos"
						value={isLoading ? '...' : stats?.incompleteCases || 0}
						description={`Pagos pendientes: ${isLoading ? '...' : formatCurrency(stats?.pendingPayments || 0)}`}
						icon={<AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600 dark:text-orange-400" />}
						trend={{
							value: 'Pendientes',
							icon: <Clock className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />,
							positive: false,
						}}
						onClick={() => handleStatCardClick('incompleteCases')}
						statType="incompleteCases"
						isSelected={selectedStat === 'incompleteCases' && isDetailPanelOpen}
					/>
				</div>

				{/* Charts Section */}
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 md:gap-5 mb-3 sm:mb-5 md:mb-6">
					{/* 12-Month Revenue Trend Chart with Interactive Bars */}
					<Card className="col-span-1 grid hover:border-primary hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/20 transition-all duration-300 shadow-lg">
						<div className="bg-white dark:bg-background rounded-xl p-3 sm:p-4 md:p-6">
							<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-3 sm:mb-4 md:mb-6">
								<h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-700 dark:text-gray-300 mb-2 sm:mb-0">
									Tendencia de Ingresos
								</h3>
								<div className="flex items-center gap-2 sm:gap-4">
									<YearSelector
										selectedYear={selectedYear}
										onYearChange={handleYearChange}
										minYear={2020}
										maxYear={new Date().getFullYear() + 2}
									/>
									<span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
										12 meses de {selectedYear}
									</span>
								</div>
							</div>
							<div className="relative h-36 sm:h-48 md:h-64 flex items-end justify-between gap-0.5 sm:gap-1 md:gap-2">
								{isLoading ? (
									<div className="flex items-center justify-center w-full h-full">
										<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
									</div>
								) : (
									stats?.salesTrendByMonth.map((month) => {
										const maxRevenue = Math.max(...(stats?.salesTrendByMonth.map((m) => m.revenue) || [1]))
										const height = maxRevenue > 0 ? (month.revenue / maxRevenue) * 100 : 0
										const isSelected = month.isSelected
										return (
											<div
												key={month.month}
												className={`flex-1 rounded-t-sm transition-all duration-200 cursor-pointer hover:translate-y-[-4px] ${
													isSelected
														? 'bg-gradient-to-t from-purple-600 to-purple-400 shadow-lg'
														: 'bg-gradient-to-t from-blue-500 to-blue-300 hover:from-blue-600 hover:to-blue-400'
												}`}
												style={{ height: `${Math.max(height, 20)}%` }} // FIXED: Increased minimum height for better UX
												title={`${format(new Date(month.month), 'MMM yyyy', { locale: es })}: ${formatCurrency(
													month.revenue,
												)}`}
												onClick={() => handleMonthBarClick(month)}
											></div>
										)
									})
								)}
							</div>
							<div className="flex justify-between text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 mt-2 sm:mt-4 overflow-x-auto scrollbar-hide">
								{/* FIXED: Force Spanish month labels regardless of system language */}
								{['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'].map((month) => (
									<span key={month} className="flex-shrink-0">
										{month}
									</span>
								))}
							</div>
							<div className="mt-2 sm:mt-4 text-center">
								<p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
									Haz clic en una barra para seleccionar el mes
								</p>
							</div>
						</div>
					</Card>

					{/* Service Distribution by Branch */}
					<Card className="col-span-1 grid hover:border-primary hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/20 transition-all duration-300 shadow-lg">
						<div className="bg-white dark:bg-background rounded-xl p-3 sm:p-4 md:p-6">
							<h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-700 dark:text-gray-300 mb-3 sm:mb-4 md:mb-6">
								Distribución por Sede
							</h3>
							<div className="flex items-center justify-center mb-3 sm:mb-4 md:mb-6">
								<div className="relative size-28 sm:size-36 md:size-48">
									<svg className="size-full -rotate-90" viewBox="0 0 36 36">
										<circle
											cx="18"
											cy="18"
											r="14"
											fill="none"
											className="stroke-current text-gray-200 dark:text-neutral-700"
											strokeWidth="4"
										></circle>
										{stats?.revenueByBranch.map((branch, index) => {
											const colors = [
												'text-blue-500',
												'text-green-500',
												'text-orange-500',
												'text-red-500',
												'text-purple-500',
											]
											const offset = stats.revenueByBranch.slice(0, index).reduce((sum, b) => sum + b.percentage, 0)
											return (
												<circle
													key={branch.branch}
													cx="18"
													cy="18"
													r="14"
													fill="none"
													className={`stroke-current ${colors[index % colors.length]} transition-all duration-200`}
													strokeWidth={hoveredSegmentIndex === index ? '5' : '4'}
													strokeDasharray={`${branch.percentage} ${100 - branch.percentage}`}
													strokeDashoffset={-offset}
													onMouseEnter={() => setHoveredSegmentIndex(index)}
													onMouseLeave={() => setHoveredSegmentIndex(null)}
													style={{
														cursor: 'pointer',
														filter: hoveredSegmentIndex === index ? 'drop-shadow(0 0 3px currentColor)' : 'none',
													}}
												></circle>
											)
										})}
									</svg>
									<div className="absolute inset-0 flex items-center justify-center">
										<div className="text-center">
											<p className="text-xl sm:text-2xl font-bold text-gray-700 dark:text-gray-300">
												{isLoading ? '...' : formatCurrency(stats?.totalRevenue || 0)}
											</p>
											<p className="text-sm text-gray-500 dark:text-gray-400">Total</p>
										</div>
									</div>
								</div>
							</div>
							<div className="space-y-2 sm:space-y-3">
								{isLoading ? (
									<div className="space-y-1 sm:space-y-2">
										{[1, 2, 3, 4].map((i) => (
											<div key={i} className="animate-pulse bg-gray-200 dark:bg-gray-700 h-5 sm:h-6 rounded"></div>
										))}
									</div>
								) : (
									stats?.revenueByBranch.map((branch, index) => {
										const colors = ['bg-blue-500', 'bg-green-500', 'bg-orange-500', 'bg-red-500', 'bg-purple-500']
										return (
											<div
												key={branch.branch}
												className="flex items-center justify-between transition-all duration-200"
												onMouseEnter={() => setHoveredSegmentIndex(index)}
												onMouseLeave={() => setHoveredSegmentIndex(null)}
												style={{
													transform: hoveredSegmentIndex === index ? 'scale(1.05)' : 'scale(1)',
													cursor: 'pointer',
												}}
											>
												<div className="flex items-center gap-2">
													<div
														className={`w-3 h-3 ${colors[index % colors.length]} rounded-full ${
															hoveredSegmentIndex === index ? 'animate-pulse' : ''
														}`}
													></div>
													<span className="text-sm text-gray-600 dark:text-gray-400">{branch.branch}</span>
												</div>
												<span className="text-sm font-medium text-gray-700 dark:text-gray-300">
													{branch.percentage.toFixed(1)}% ({formatCurrency(branch.revenue)})
												</span>
											</div>
										)
									})
								)}
							</div>
						</div>
					</Card>
				</div>

				{/* Detailed Tables */}
				<div className="grid grid-cols-1 gap-3 sm:gap-4 md:gap-5">
					{/* Performance Metrics by Exam Type (Normalized) */}
					<ExamTypePieChart />
					<BranchRevenueReport />
					<RemainingAmount />
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 mb-3 sm:mb-5">
						{/* Doctor Revenue Report */}
						<DoctorRevenueReport />

						{/* Origin Revenue Report */}
						<OriginRevenueReport />
					</div>
				</div>
			</div>

			{/* Stat Detail Panel */}
			<StatDetailPanel
				isOpen={isDetailPanelOpen && selectedStat !== null}
				onClose={handleDetailPanelClose}
				statType={selectedStat || 'totalRevenue'}
				stats={stats}
				isLoading={isLoading}
				selectedMonth={selectedMonth}
				selectedYear={selectedYear}
			/>
		</>
	)
}

export default StatsPage
