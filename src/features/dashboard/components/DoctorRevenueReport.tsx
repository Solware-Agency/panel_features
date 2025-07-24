import React from 'react'
import { Card } from '@shared/components/ui/card'
import { User } from 'lucide-react'
import { useDashboardStats } from '@shared/hooks/useDashboardStats'
import { useBreakpoint } from '@shared/components/ui/media-query'

const DoctorRevenueReport: React.FC = () => {
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
            <User className="w-5 h-5 text-blue-500" />
            Ingreso por Médico Tratante
          </h3>
        </div>

        <div className="overflow-x-auto w-full">
          {isLoading ? (
            <div className="py-8 text-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
            </div>
          ) : stats?.topTreatingDoctors && stats.topTreatingDoctors.length > 0 ? (
            isDesktop ? (
              <table className="w-full min-w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 text-gray-600 dark:text-gray-400 font-medium text-sm">Médico Tratante</th>
                    <th className="text-center py-3 text-gray-600 dark:text-gray-400 font-medium text-sm">Casos</th>
                    <th className="text-right py-3 text-gray-600 dark:text-gray-400 font-medium text-sm">Monto Total</th>
                    <th className="text-right py-3 text-gray-600 dark:text-gray-400 font-medium text-sm">% del Total</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.topTreatingDoctors.map((doctor, index) => (
                    <tr key={index} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                            <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-700 dark:text-gray-300 text-sm">{doctor.doctor}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 text-center">
                        <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-medium rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                          {doctor.cases} caso{doctor.cases !== 1 ? 's' : ''}
                        </span>
                      </td>
                      <td className="py-4 text-right">
                        <p className="text-base font-bold text-gray-700 dark:text-gray-300">{formatCurrency(doctor.revenue)}</p>
                      </td>
                      <td className="py-4 text-right">
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {((doctor.revenue / stats.totalRevenue) * 100).toFixed(1)}%
                        </p>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mt-1">
                          <div 
                            className="bg-blue-500 h-1.5 rounded-full" 
                            style={{ 
                              width: `${stats.topTreatingDoctors.length > 0 ? 
                                (doctor.revenue / Math.max(...stats.topTreatingDoctors.map(d => d.revenue))) * 100 : 0}%` 
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
              <div className="space-y-4 px-2">
                {stats.topTreatingDoctors.map((doctor, index) => (
                  <div 
                    key={index} 
                    className="bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg p-3 w-full"
                  >
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="flex-1 min-w-0 max-w-full">
                        <p className="font-medium text-gray-700 dark:text-gray-300 text-sm truncate">{doctor.doctor}</p>
                      </div>
                      <p className="text-base font-bold text-gray-700 dark:text-gray-300 ml-auto">{formatCurrency(doctor.revenue)}</p>
                    </div>
                    
                    <div className="flex items-center justify-between mb-1">
                      <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-medium rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                        {doctor.cases} caso{doctor.cases !== 1 ? 's' : ''}
                      </span>
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                        {((doctor.revenue / stats.totalRevenue) * 100).toFixed(1)}%
                      </span>
                    </div>
                    
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                      <div 
                        className="bg-blue-500 h-1.5 rounded-full" 
                        style={{ 
                          width: `${stats.topTreatingDoctors.length > 0 ? 
                            (doctor.revenue / Math.max(...stats.topTreatingDoctors.map(d => d.revenue))) * 100 : 0}%` 
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
                <User className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">No hay datos de médicos</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}

export default DoctorRevenueReport