import React, { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { useDarkMode } from '@shared/hooks/useDarkMode'
import Header from './Header'
import Sidebar from '../../../shared/components/Sidebar'

const Layout: React.FC = () => {
	const { isDark, toggleDarkMode } = useDarkMode()

	const [sidebarOpen, setSidebarOpen] = useState(false)
	const [sidebarExpanded, setSidebarExpanded] = useState(false) // New state for hover expansion



	const toggleSidebar = () => {
		setSidebarOpen(!sidebarOpen)
	}

	const handleSidebarMouseEnter = () => {
		setSidebarExpanded(true)
	}

	const handleSidebarMouseLeave = () => {
		setSidebarExpanded(false)
	}

	return (
		<div className="min-h-screen bg-white dark:bg-background">
			{/* Mobile overlay */}
			<AnimatePresence>
				{sidebarOpen && (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						className="fixed inset-0 bg-black bg-opacity-50 z-[999998] lg:hidden transition-all duration-300 ease-in-out"
						onClick={() => setSidebarOpen(false)}
					/>
				)}
			</AnimatePresence>

			{/* Sidebar - Updated with collapsible behavior */}
			<div
				className={`fixed top-0 left-0 h-screen z-[9999999] lg:z-10 transform transition-all duration-300 ease-in-out lg:translate-x-0 ${
					sidebarOpen ? 'translate-x-0' : '-translate-x-full'
				} ${
					// On desktop: collapsed by default (w-16), expanded on hover (w-56)
					sidebarExpanded ? 'lg:w-56' : 'lg:w-16'
				}`}
				onMouseEnter={handleSidebarMouseEnter}
				onMouseLeave={handleSidebarMouseLeave}
			>
				<Sidebar
					onClose={() => setSidebarOpen(false)}
					isExpanded={sidebarExpanded}
					isMobile={sidebarOpen}
					isDark={isDark}
					toggleDarkMode={toggleDarkMode}
				/>
			</div>

			{/* Main content - Updated margin to accommodate collapsible sidebar */}
			<main className={`min-h-screen flex flex-col z-50 transition-all duration-300 ${sidebarExpanded ? 'lg:ml-56' : 'lg:ml-16'}`}>
				<Header isDark={isDark} toggleDarkMode={toggleDarkMode} onMenuClick={toggleSidebar} />
				<div className="flex-1 overflow-x-hidden overflow-y-auto">
					<Outlet />
				</div>
			</main>
		</div>
	)
}

export default Layout
