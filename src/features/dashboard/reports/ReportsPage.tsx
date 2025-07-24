import React, { useRef } from 'react'
import ExportSection from './ExportSection'
import ReactionsTable from '../components/ReactionsTable'
// import { Card } from '@shared/components/ui/card'

const ReportsPage: React.FC = () => {
	const reportRef = useRef<HTMLDivElement>(null)

	return (
		<div className="p-3 sm:p-6 overflow-x-hidden max-w-full" ref={reportRef}>
			{/* Export Section */}
			<ExportSection />
			<ReactionsTable />
		</div>
	)
}

export default ReportsPage
