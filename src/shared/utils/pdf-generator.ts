import { PDFDocument, rgb, StandardFonts, PageSizes, PDFImage } from 'pdf-lib'
import fontkit from '@pdf-lib/fontkit'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import type { MedicalRecord } from '@lib/supabase-service'
import { updatePdfReadyStatus } from '@lib/supabase-service'

// Import logo as a module
import logoPath from '/src/assets/img/logo_conspat.png'
// Import signature image
import firmasImg from '/src/assets/img/firmas.png'

// Type definition for PDF page to avoid TypeScript errors
type PDFPage = ReturnType<PDFDocument['addPage']>

// Helper function to determine case type from exam_type
const getCaseType = (examType: string): 'biopsia' | 'inmunohistoquimica' | 'citologia' => {
	const type = examType.toLowerCase().trim()
	if (type.includes('inmuno')) return 'inmunohistoquimica'
	if (type.includes('citolog')) return 'citologia'
	return 'biopsia'
}

// Helper function to get case type title
const getCaseTypeTitle = (caseType: string): string => {
	switch (caseType) {
		case 'inmunohistoquimica':
			return 'INFORME DE INMUNOHISTOQUÍMICA'
		case 'citologia':
			return 'INFORME DE CITOLOGÍA'
		default:
			return 'INFORME DE BIOPSIA'
	}
}

/**
 * Generates a PDF document for a medical case using pdf-lib
 * @param caseData The case data to include in the PDF
 * @returns Promise that resolves when the PDF is downloaded
 */
export async function generatePDF(caseData: MedicalRecord): Promise<void> {
	try {
		// Determine case type
		const caseType = getCaseType(caseData.exam_type)
		
		// Create a new PDF document
		const pdfDoc = await PDFDocument.create()

		// Register fontkit
		pdfDoc.registerFontkit(fontkit)

		// Embed standard fonts
		const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica)
		const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

		// Add a page
		let page = pdfDoc.addPage(PageSizes.A4)
		const { width, height } = page.getSize()

		// Define margins
		const margin = 50
		const contentWidth = width - 2 * margin

		// Define text styles
		const titleSize = 16
		const headingSize = 14
		const normalSize = 10
		const smallSize = 8

		// Define colors
		const blackColor = rgb(0, 0, 0)
		const grayColor = rgb(0.4, 0.4, 0.4)

		// Current Y position (start from top)
		let yPos = height - margin

		// Add logo
		try {
			// Fetch the logo image
			const logoResponse = await fetch(logoPath)
			const logoArrayBuffer = await logoResponse.arrayBuffer()

			// Embed the logo image
			const logoImage = await pdfDoc.embedPng(logoArrayBuffer)
			const logoDims = logoImage.scale(0.1) // Scale to 10%

			// Draw the logo centered at the top
			page.drawImage(logoImage, {
				x: (width - logoDims.width) / 2,
				y: yPos - logoDims.height,
				width: logoDims.width,
				height: logoDims.height,
			})

			// Update Y position
			yPos -= logoDims.height + 20
		} catch (error) {
			console.error('Error embedding logo:', error)
			// Continue without logo if there's an error
			yPos -= 20
		}

		// Add title based on case type
		const title = getCaseTypeTitle(caseType)
		page.drawText(title, {
			x: (width - helveticaBold.widthOfTextAtSize(title, titleSize)) / 2,
			y: yPos,
			size: titleSize,
			font: helveticaBold,
			color: blackColor,
		})

		// Update Y position
		yPos -= titleSize + 20

		// Add patient information section
		page.drawText('Información del Paciente', {
			x: margin,
			y: yPos,
			size: headingSize,
			font: helveticaBold,
			color: blackColor,
		})

		// Update Y position
		yPos -= headingSize + 10

		// Function to add a field with label and value
		const addField = (label: string, value: string | undefined | null) => {
			const displayValue = value || 'N/A'

			// Draw label
			page.drawText(`${label}:`, {
				x: margin,
				y: yPos,
				size: normalSize,
				font: helveticaBold,
				color: blackColor,
			})

			// Draw value (with appropriate offset)
			const labelWidth = 100 // Fixed width for alignment
			page.drawText(displayValue, {
				x: margin + labelWidth,
				y: yPos,
				size: normalSize,
				font: helveticaFont,
				color: blackColor,
			})

			// Update Y position
			yPos -= normalSize + 10
		}

		// Add patient information fields
		addField('Nombre', caseData.full_name)
		addField('Cédula', caseData.id_number)

		// Add age field
		addField('Edad', caseData.edad || 'Sin edad')
		addField('Teléfono', caseData.phone)
		addField('Email', caseData.email)

		// Add some space
		yPos -= 10

		// Add case information section
		page.drawText('Información del Caso', {
			x: margin,
			y: yPos,
			size: headingSize,
			font: helveticaBold,
			color: blackColor,
		})

		// Update Y position
		yPos -= headingSize + 10

		// Add case information fields
		addField('Código', caseData.code)
		addField('Fecha', format(new Date(caseData.date), 'dd/MM/yyyy', { locale: es }))
		addField('Tipo de Examen', caseData.exam_type)
		addField('Médico Tratante', caseData.treating_doctor)
		addField('Procedencia', caseData.origin)
		addField('Sede', caseData.branch)

		// Add some space
		yPos -= 10

		// Check if we need to add a new page for biopsy information
		if (yPos < 300) {
			// Add a new page
			page = pdfDoc.addPage(PageSizes.A4)
			yPos = height - margin
		}

		// Add case-specific information section
		const sectionTitle = caseType === 'inmunohistoquimica' ? 'Informe de Inmunohistoquímica' : 
							caseType === 'citologia' ? 'Informe de Citología' : 'Informe de Biopsia'
		
		page.drawText(sectionTitle, {
			x: margin,
			y: yPos,
			size: headingSize,
			font: helveticaBold,
			color: blackColor,
		})

		// Update Y position
		yPos -= headingSize + 10

		// Function to add a multi-line text field
		const addMultilineField = (
			label: string,
			text: string | undefined | null,
			currentPage: PDFPage,
			currentYPos: number,
			pdfDocument: PDFDocument,
		): { page: PDFPage; yPos: number } => {
			if (!text) text = 'N/A'

			let workingPage = currentPage
			let workingYPos = currentYPos

			// Draw label
			workingPage.drawText(label + ':', {
				x: margin,
				y: workingYPos,
				size: normalSize,
				font: helveticaBold,
				color: blackColor,
			})

			// Update Y position
			workingYPos -= normalSize + 5

			// Split text into lines that fit within the content width
			const words = text.split(' ')
			let currentLine = ''

			words.forEach((word) => {
				const testLine = currentLine ? `${currentLine} ${word}` : word
				const testLineWidth = helveticaFont.widthOfTextAtSize(testLine, normalSize)

				if (testLineWidth > contentWidth) {
					// Check if we need to add a new page
					if (workingYPos < margin + normalSize) {
						// Add a new page
						workingPage = pdfDocument.addPage(PageSizes.A4)
						workingYPos = height - margin
					}

					// Draw the current line
					workingPage.drawText(currentLine, {
						x: margin,
						y: workingYPos,
						size: normalSize,
						font: helveticaFont,
						color: blackColor,
					})

					// Move to next line
					workingYPos -= normalSize + 5
					currentLine = word
				} else {
					currentLine = testLine
				}
			})

			// Draw the last line
			if (currentLine) {
				// Check if we need to add a new page
				if (workingYPos < margin + normalSize) {
					// Add a new page
					workingPage = pdfDocument.addPage(PageSizes.A4)
					workingYPos = height - margin
				}

				workingPage.drawText(currentLine, {
					x: margin,
					y: workingYPos,
					size: normalSize,
					font: helveticaFont,
					color: blackColor,
				})

				// Move to next line
				workingYPos -= normalSize + 5
			}

			// Add some extra space after the field
			workingYPos -= 10

			return { page: workingPage, yPos: workingYPos }
		}

		// Add case-specific information fields
		let result: { page: PDFPage; yPos: number }
		
		if (caseType === 'biopsia') {
			result = addMultilineField('Material Remitido', caseData.material_remitido, page, yPos, pdfDoc)
			page = result.page
			yPos = result.yPos

			result = addMultilineField('Información Clínica', caseData.informacion_clinica, page, yPos, pdfDoc)
			page = result.page
			yPos = result.yPos

			result = addMultilineField('Descripción Macroscópica', caseData.descripcion_macroscopica, page, yPos, pdfDoc)
			page = result.page
			yPos = result.yPos

			result = addMultilineField('Diagnóstico', caseData.diagnostico, page, yPos, pdfDoc)
			page = result.page
			yPos = result.yPos

			// Add comentario if it exists
			if (caseData.comentario) {
				result = addMultilineField('Comentario', caseData.comentario, page, yPos, pdfDoc)
				page = result.page
				yPos = result.yPos
			}
		} else if (caseType === 'inmunohistoquimica') {
			result = addMultilineField('Información Clínica', caseData.informacion_clinica, page, yPos, pdfDoc)
			page = result.page
			yPos = result.yPos

			result = addMultilineField('Descripción Macroscópica', caseData.descripcion_macroscopica, page, yPos, pdfDoc)
			page = result.page
			yPos = result.yPos

			result = addMultilineField('Inmunohistoquímica', caseData.inmunohistoquimica, page, yPos, pdfDoc)
			page = result.page
			yPos = result.yPos

			// Add immunohistochemistry results
			result = addMultilineField('Positivo', caseData.positivo, page, yPos, pdfDoc)
			page = result.page
			yPos = result.yPos

			result = addMultilineField('Negativo', caseData.negativo, page, yPos, pdfDoc)
			page = result.page
			yPos = result.yPos

			result = addMultilineField('Ki67', caseData.ki67, page, yPos, pdfDoc)
			page = result.page
			yPos = result.yPos

			result = addMultilineField('Conclusión Diagnóstica', caseData.conclusion_diagnostica, page, yPos, pdfDoc)
			page = result.page
			yPos = result.yPos

			// Add comentario if it exists
			if (caseData.comentario) {
				result = addMultilineField('Comentario', caseData.comentario, page, yPos, pdfDoc)
				page = result.page
				yPos = result.yPos
			}
		} else if (caseType === 'citologia') {
			result = addMultilineField('Descripción', caseData.descripcion_macroscopica, page, yPos, pdfDoc)
			page = result.page
			yPos = result.yPos
		}

		// Add attachment information if present
		if (caseData.attachment_url) {
			result = addMultilineField('Archivo Adjunto', `Archivo: ${caseData.attachment_url.split('/').pop() || caseData.attachment_url}`, page, yPos, pdfDoc)
			page = result.page
			yPos = result.yPos
		}

		// Fetch and embed the signature image
		let signatureImage: PDFImage | undefined
		try {
			const signatureResponse = await fetch(firmasImg)
			const signatureArrayBuffer = await signatureResponse.arrayBuffer()
			signatureImage = await pdfDoc.embedPng(signatureArrayBuffer)
		} catch (error) {
			console.error('Error embedding signature image:', error)
			// Continue without signature if there's an error
		}

		// Add footer to all pages
		const addFooter = (page: PDFPage) => {
			const { width } = page.getSize()
			const footerY = 30

			// Add signature image if available
			if (signatureImage) {
				const signatureDims = signatureImage.scale(0.3) // Scale to 30%

				// Draw the signature centered above the footer text
				page.drawImage(signatureImage, {
					x: (width - signatureDims.width) / 2,
					y: footerY + 40, // Position above the footer text
					width: signatureDims.width,
					height: signatureDims.height,
				})
			}

			// Add contact information
			page.drawText('DIRECCIÓN:', {
				x: margin,
				y: footerY + 20,
				size: smallSize,
				font: helveticaBold,
				color: grayColor,
			})

			page.drawText(
				'VALLES DEL TUY: Edificio Multioficinas Conex / CARACAS: Policlínica Méndez Gimón – Clínica Sanatrix – Torre Centro Caracas / MARACAY: Centro Profesional Plaza',
				{
					x: margin,
					y: footerY + 10,
					size: smallSize,
					font: helveticaFont,
					color: grayColor,
				},
			)

			page.drawText('CONTACTO: (0212) 889822 / (0414) 4861289 / (0424) 1425562', {
				x: margin,
				y: footerY,
				size: smallSize,
				font: helveticaFont,
				color: grayColor,
			})

			page.drawText('Resultados@conspat.com', {
				x: margin,
				y: footerY - 10,
				size: smallSize,
				font: helveticaFont,
				color: grayColor,
			})

			// Add page number and generation date
			const pageCount = pdfDoc.getPageCount()
			const pageIndex = pdfDoc.getPages().indexOf(page)
			const pageText = `Página ${pageIndex + 1} de ${pageCount} - Generado el ${format(new Date(), 'dd/MM/yyyy HH:mm', {
				locale: es,
			})}`

			page.drawText(pageText, {
				x: width / 2 - helveticaFont.widthOfTextAtSize(pageText, smallSize) / 2,
				y: footerY - 20,
				size: smallSize,
				font: helveticaFont,
				color: grayColor,
			})
		}

		// Add footer to all pages
		for (let i = 0; i < pdfDoc.getPageCount(); i++) {
			const page = pdfDoc.getPage(i)
			addFooter(page)
		}

		// Serialize the PDF to bytes
		const pdfBytes = await pdfDoc.save()

		// Create a blob from the PDF bytes
		const blob = new Blob([pdfBytes], { type: 'application/pdf' })

		// Create a URL for the blob
		const url = URL.createObjectURL(blob)

		// Create a link element
		const link = document.createElement('a')
		link.href = url
		link.download = `${caseType}_${caseData.code || caseData.id}_${caseData.full_name.replace(/\s+/g, '_')}.pdf`

		// Append the link to the body
		document.body.appendChild(link)

		// Click the link to trigger the download
		link.click()

		// Clean up
		document.body.removeChild(link)
		URL.revokeObjectURL(url)

		// Update PDF ready status in database
		if (caseData.id && !caseData.pdf_en_ready) {
			try {
				await updatePdfReadyStatus(caseData.id, true)
			} catch (error) {
				console.error('Error updating PDF ready status:', error)
				// Continue even if status update fails
			}
		}

		return Promise.resolve()
	} catch (error) {
		console.error('Error generating PDF:', error)
		return Promise.reject(error)
	}
}
