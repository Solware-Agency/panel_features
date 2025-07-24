import { useQuery } from '@tanstack/react-query'
import { supabase } from '@lib/supabase/config'
import { startOfMonth, endOfMonth, format, startOfYear, endOfYear } from 'date-fns'
import { es } from 'date-fns/locale'

export interface DashboardStats {
  totalRevenue: number
  uniquePatients: number
  completedCases: number
  incompleteCases: number
  pendingPayments: number
  monthlyRevenue: number
  newPatientsThisMonth: number
  revenueByBranch: Array<{ branch: string; revenue: number; percentage: number }>
  revenueByExamType: Array<{ examType: string; revenue: number; count: number }>
  salesTrendByMonth: Array<{ month: string; revenue: number; isSelected?: boolean; monthIndex: number }>
  topExamTypes: Array<{ examType: string; count: number; revenue: number }>
  topTreatingDoctors: Array<{ doctor: string; cases: number; revenue: number }>
  revenueByOrigin: Array<{ origin: string; revenue: number; cases: number; percentage: number }>
  totalCases: number
}

// Function to normalize exam type names
const normalizeExamType = (examType: string): string => {
  if (!examType) return ''
  
  return examType
    .toLowerCase()
    .trim()
    // Remove accents and diacritics
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    // Normalize common variations
    .replace(/citologia/g, 'citologia')
    .replace(/biopsia/g, 'biopsia')
    .replace(/inmunohistoquimica/g, 'inmunohistoquimica')
}

export const useDashboardStats = (selectedMonth?: Date, selectedYear?: number) => {
  return useQuery({
    queryKey: ['dashboard-stats', selectedMonth?.toISOString(), selectedYear],
    queryFn: async (): Promise<DashboardStats> => {
      try {
				// Get all records for general stats
				const { data: allRecords, error: allError } = await supabase.from('medical_records_clean').select('*')

				if (allError) throw allError

				// Get current month data if selectedMonth is provided
				const currentMonth = selectedMonth || new Date()
				const monthStart = startOfMonth(currentMonth)
				const monthEnd = endOfMonth(currentMonth)

				const { data: monthRecords, error: monthError } = await supabase
					.from('medical_records_clean')
					.select('*')
					.gte('created_at', monthStart.toISOString())
					.lte('created_at', monthEnd.toISOString())

				if (monthError) throw monthError

				// Calculate total revenue
				const totalRevenue = allRecords?.reduce((sum, record) => sum + (record.total_amount || 0), 0) || 0

				// Calculate unique patients - CORREGIDO: solo contar registros con id_number válido
				const validRecords = allRecords?.filter((r) => r.id_number && r.id_number.trim() !== '') || []
				const uniquePatientIds = new Set(validRecords.map((record) => record.id_number))
				const uniquePatients = uniquePatientIds.size

				// Calculate completed and incomplete cases
				const completedCases = allRecords?.filter((record) => record.payment_status === 'Completado').length || 0
				const totalCases = allRecords?.length || 0
				const incompleteCases = totalCases - completedCases

				// Calculate pending payments (remaining amounts)
				const pendingPayments =
					allRecords?.reduce((sum, record) => {
						// If payment status is not completed, add the remaining amount
						if (record.payment_status !== 'Completado') {
							return sum + (record.remaining || record.total_amount || 0)
						}
						return sum + (record.remaining || 0)
					}, 0) || 0

				// Calculate monthly revenue
				const monthlyRevenue = monthRecords?.reduce((sum, record) => sum + (record.total_amount || 0), 0) || 0

				// Calculate new patients this month - CORREGIDO: usar solo registros válidos
				const existingPatientIds = new Set(
					allRecords
						?.filter(
							(record) =>
								record.id_number && record.id_number.trim() !== '' && new Date(record.created_at) < monthStart,
						)
						.map((record) => record.id_number) || [],
				)
				const monthPatientIds = new Set(
					monthRecords
						?.filter((record) => record.id_number && record.id_number.trim() !== '')
						.map((record) => record.id_number) || [],
				)
				const newPatientsThisMonth = Array.from(monthPatientIds).filter((id) => !existingPatientIds.has(id)).length

				// Calculate revenue by branch
				const branchRevenue = new Map<string, number>()
				allRecords?.forEach((record) => {
					const current = branchRevenue.get(record.branch) || 0
					branchRevenue.set(record.branch, current + (record.total_amount || 0))
				})

				const revenueByBranch = Array.from(branchRevenue.entries())
					.map(([branch, revenue]) => ({
						branch,
						revenue,
						percentage: totalRevenue > 0 ? (revenue / totalRevenue) * 100 : 0,
					}))
					.sort((a, b) => b.revenue - a.revenue)

				// Calculate revenue by exam type (with normalization)
				const examTypeRevenue = new Map<string, { revenue: number; count: number; originalName: string }>()
				allRecords?.forEach((record) => {
					const normalizedType = normalizeExamType(record.exam_type)
					const current = examTypeRevenue.get(normalizedType) || {
						revenue: 0,
						count: 0,
						originalName: record.exam_type,
					}
					examTypeRevenue.set(normalizedType, {
						revenue: current.revenue + (record.total_amount || 0),
						count: current.count + 1,
						originalName: current.originalName, // Keep the first occurrence as display name
					})
				})

				const revenueByExamType = Array.from(examTypeRevenue.entries())
					.map(([_normalizedType, data]) => ({
						examType: data.originalName, // Use original name for display
						revenue: data.revenue,
						count: data.count,
					}))
					.sort((a, b) => b.revenue - a.revenue)

				// Calculate sales trend by month for selected year - FIXED: Start from January (month 0)
				const currentYear = selectedYear || new Date().getFullYear()
				const yearStart = startOfYear(new Date(currentYear, 0, 1))
				const yearEnd = endOfYear(new Date(currentYear, 0, 1))

				// Filter records for the selected year
				const yearRecords =
					allRecords?.filter((record) => {
						const recordDate = new Date(record.created_at)
						return recordDate >= yearStart && recordDate <= yearEnd
					}) || []

				// Create 12 months for the selected year - FIXED: Start from January (0) to December (11)
				const salesTrendByMonth = []
				for (let month = 0; month < 12; month++) {
					const monthDate = new Date(currentYear, month, 1)
					const monthKey = format(monthDate, 'yyyy-MM')
					const monthRevenue = yearRecords
						.filter((record) => format(new Date(record.created_at), 'yyyy-MM') === monthKey)
						.reduce((sum, record) => sum + (record.total_amount || 0), 0)

					salesTrendByMonth.push({
						month: monthKey,
						revenue: monthRevenue,
						monthIndex: month, // Add month index for proper ordering
						isSelected: selectedMonth ? format(selectedMonth, 'yyyy-MM') === monthKey : false,
					})
				}

				// Calculate top exam types by frequency (with normalization)
				const examTypeCounts = new Map<string, { count: number; revenue: number; originalName: string }>()
				allRecords?.forEach((record) => {
					const normalizedType = normalizeExamType(record.exam_type)
					const current = examTypeCounts.get(normalizedType) || { count: 0, revenue: 0, originalName: record.exam_type }
					examTypeCounts.set(normalizedType, {
						count: current.count + 1,
						revenue: current.revenue + (record.total_amount || 0),
						originalName: current.originalName,
					})
				})

				const topExamTypes = Array.from(examTypeCounts.entries())
					.map(([_normalizedType, data]) => ({
						examType: data.originalName,
						count: data.count,
						revenue: data.revenue,
					}))
					.sort((a, b) => b.count - a.count)
					.slice(0, 5) // Top 5

				// Calculate top treating doctors
				const doctorStats = new Map<string, { cases: number; revenue: number }>()
				allRecords?.forEach((record) => {
					const doctor = record.treating_doctor?.trim()
					if (doctor) {
						const current = doctorStats.get(doctor) || { cases: 0, revenue: 0 }
						doctorStats.set(doctor, {
							cases: current.cases + 1,
							revenue: current.revenue + (record.total_amount || 0),
						})
					}
				})

				const topTreatingDoctors = Array.from(doctorStats.entries())
					.map(([doctor, stats]) => ({
						doctor,
						cases: stats.cases,
						revenue: stats.revenue,
					}))
					.sort((a, b) => b.revenue - a.revenue) // Sort by revenue
					.slice(0, 5) // Top 5 doctors

				// Calculate revenue by origin (procedencia)
				const originStats = new Map<string, { cases: number; revenue: number }>()
				allRecords?.forEach((record) => {
					const origin = record.origin?.trim()
					if (origin) {
						const current = originStats.get(origin) || { cases: 0, revenue: 0 }
						originStats.set(origin, {
							cases: current.cases + 1,
							revenue: current.revenue + (record.total_amount || 0),
						})
					}
				})

				const revenueByOrigin = Array.from(originStats.entries())
					.map(([origin, stats]) => ({
						origin,
						cases: stats.cases,
						revenue: stats.revenue,
						percentage: totalRevenue > 0 ? (stats.revenue / totalRevenue) * 100 : 0,
					}))
					.sort((a, b) => b.revenue - a.revenue) // Sort by revenue
					.slice(0, 5) // Top 5 origins

				return {
					totalRevenue,
					uniquePatients,
					completedCases,
					incompleteCases,
					pendingPayments,
					monthlyRevenue,
					newPatientsThisMonth,
					revenueByBranch,
					revenueByExamType,
					salesTrendByMonth,
					topExamTypes,
					topTreatingDoctors,
					revenueByOrigin,
					totalCases,
				}
			} catch (error) {
				console.error('Error fetching dashboard stats:', error)
				throw error
			}
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
  })
}

export const useMonthSelector = () => {
  const currentDate = new Date()
  const months = []
  
  // Generate last 12 months
  for (let i = 11; i >= 0; i--) {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1)
    months.push({
      value: date,
      label: format(date, 'MMMM yyyy', { locale: es })
    })
  }
  
  return months
}

export const useYearSelector = () => {
  const currentYear = new Date().getFullYear()
  const years = []
  
  // Generate last 5 years and next 2 years
  for (let i = currentYear - 5; i <= currentYear + 2; i++) {
    years.push({
      value: i,
      label: i.toString()
    })
  }
  
  return years
}