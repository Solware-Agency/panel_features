import React, { useRef } from 'react'
import { Button } from '@shared/components/ui/button'
import { Download, Loader2 } from 'lucide-react'
import { exportElementToPdf, exportTableToPdf } from '@shared/components/ui/pdf-export'
import { useToast } from '@shared/hooks/use-toast'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface ReportPDFProps {
  title?: string
  subtitle?: string
  data?: any
  type?: 'element' | 'table'
  headers?: string[]
  tableData?: any[]
  orientation?: 'portrait' | 'landscape'
  isLoading?: boolean
}

const ReportPDF: React.FC<ReportPDFProps> = ({
  title = 'Reporte',
  subtitle = '',
  data,
  type = 'element',
  headers = [],
  tableData = [],
  orientation = 'portrait',
  isLoading = false,
}) => {
  const reportRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()
  const [exporting, setExporting] = React.useState(false)

  const handleExport = async () => {
    setExporting(true)
    try {
      if (type === 'element' && reportRef.current) {
        const success = await exportElementToPdf(reportRef.current, {
          title,
          subtitle,
          orientation,
          filename: `${title.toLowerCase().replace(/\s+/g, '-')}-${format(new Date(), 'yyyy-MM-dd')}`,
        })

        if (success) {
          toast({
            title: '✅ Reporte exportado',
            description: 'El reporte ha sido exportado como PDF exitosamente.',
            className: 'bg-green-100 border-green-400 text-green-800',
          })
        } else {
          throw new Error('Error al exportar el reporte')
        }
      } else if (type === 'table' && headers.length > 0 && tableData.length > 0) {
        const success = exportTableToPdf(headers, tableData, {
          title,
          subtitle,
          orientation,
          filename: `${title.toLowerCase().replace(/\s+/g, '-')}-${format(new Date(), 'yyyy-MM-dd')}`,
        })

        if (success) {
          toast({
            title: '✅ Reporte exportado',
            description: 'El reporte ha sido exportado como PDF exitosamente.',
            className: 'bg-green-100 border-green-400 text-green-800',
          })
        } else {
          throw new Error('Error al exportar el reporte')
        }
      } else {
        throw new Error('No hay datos para exportar')
      }
    } catch (error) {
      console.error('Error exporting report:', error)
      toast({
        title: '❌ Error al exportar',
        description: 'Hubo un problema al generar el PDF. Inténtalo de nuevo.',
        variant: 'destructive',
      })
    } finally {
      setExporting(false)
    }
  }

  return (
    <div>
      <Button
        onClick={handleExport}
        disabled={exporting || isLoading}
        className="bg-green-600 hover:bg-green-700 text-white"
      >
        {exporting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Generando PDF...
          </>
        ) : (
          <>
            <Download className="mr-2 h-4 w-4" />
            Exportar PDF
          </>
        )}
      </Button>
      
      {type === 'element' && (
        <div className="hidden">
          <div ref={reportRef} className="p-8 bg-white">
            {/* Header */}
            <div className="mb-6 border-b pb-4">
              <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
              {subtitle && <p className="text-gray-600">{subtitle}</p>}
              <p className="text-sm text-gray-500 mt-2">
                Fecha: {format(new Date(), 'PPP', { locale: es })}
              </p>
            </div>
            
            {/* Content */}
            <div className="space-y-6">
              {data}
            </div>
            
            {/* Footer */}
            <div className="mt-8 pt-4 border-t text-sm text-gray-500">
              <p>Generado por el sistema de registros médicos</p>
              <p>Página 1 de 1</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ReportPDF