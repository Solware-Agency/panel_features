import React, { useState } from 'react'
import { Button } from '@shared/components/ui/button'
import { Download, Loader2 } from 'lucide-react'
import { exportTableToPdf } from '@shared/components/ui/pdf-export'
import { useToast } from '@shared/hooks/use-toast'
import { format } from 'date-fns'

interface ReportExportButtonProps {
  title: string
  subtitle?: string
  headers: string[]
  data: any[][]
  filename?: string
  orientation?: 'portrait' | 'landscape'
  isLoading?: boolean
}

const ReportExportButton: React.FC<ReportExportButtonProps> = ({
  title,
  subtitle = '',
  headers,
  data,
  filename,
  orientation = 'portrait',
  isLoading = false,
}) => {
  const [exporting, setExporting] = useState(false)
  const { toast } = useToast()

  const handleExport = () => {
    if (headers.length === 0 || data.length === 0) {
      toast({
        title: '❌ Sin datos para exportar',
        description: 'No hay datos disponibles para generar el reporte.',
        variant: 'destructive',
      })
      return
    }

    setExporting(true)
    try {
      const defaultFilename = `${title.toLowerCase().replace(/\s+/g, '-')}-${format(new Date(), 'yyyy-MM-dd')}`
      
      const success = exportTableToPdf(headers, data, {
        title,
        subtitle,
        orientation,
        filename: filename || defaultFilename,
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
    <Button
      onClick={handleExport}
      disabled={exporting || isLoading || headers.length === 0 || data.length === 0}
      className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2 py-3 sm:p-4 transition-colors duration-300"
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
  )
}

export default ReportExportButton