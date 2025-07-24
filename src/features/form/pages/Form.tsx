import { Toaster } from '@shared/components/ui/toaster'
import { Toaster as Sonner } from '@shared/components/ui/sonner'
import { ThemeProvider } from '@app/providers/ThemeProvider'
import { useQuery } from '@tanstack/react-query'
import { MedicalForm } from '@features/form/components/MedicalForm'
import { RecordsSection } from '@features/form/components/RecordsSection'
import { SettingsSection } from '@features/form/components/SettingsSection'
import { useState, useCallback, Suspense, useEffect } from 'react'
import { Tabs, TabsContent } from '@shared/components/ui/tabs'
import { getMedicalRecords, searchMedicalRecords } from '@lib/supabase-service'
import { RefreshCw, Loader2, Trash2 } from 'lucide-react'
import { useUserProfile } from '@shared/hooks/useUserProfile'
import { DoctorsSection } from '@features/form/components/DoctorsSection'
import PatientsPage from '@features/dashboard/patients/PatientsPage'
import Sidebar from '@shared/components/Sidebar'
import { useDarkMode } from '@shared/hooks/useDarkMode'
import { AnimatePresence, motion } from 'framer-motion'
import { useLocation, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Button } from '@shared/components/ui/button'
import { useResetForm } from '@shared/hooks/useResetForm'
import { type FormValues } from '@features/form/lib/form-schema'
import { useToast } from '@shared/hooks/use-toast'

// Import Menu icon for mobile sidebar toggle
import { Menu } from 'lucide-react'

const getInitialFormValues = (): FormValues => ({
	fullName: '',
	idNumber: '',
	phone: '',
	ageValue: 0,
	ageUnit: 'MESES',
	email: '',
	examType: '',
	origin: '',
	treatingDoctor: '',
	sampleType: '',
	numberOfSamples: 1,
	relationship: '',
	branch: '',
	registrationDate: new Date(),
	totalAmount: 0.01, // Changed from 0 to 0.01 to comply with database constraint
	payments: [{ method: '', amount: 0, reference: '' }],
	comments: '',
})

// Loading fallback component
const LoadingFallback = () => (
	<div className="flex items-center justify-center h-64">
		<div className="flex flex-col items-center gap-4">
			<Loader2 className="h-8 w-8 animate-spin text-primary" />
			<p className="text-muted-foreground">Cargando datos...</p>
		</div>
	</div>
)

function FormContent() {
	const [activeTab, setActiveTab] = useState('form')
	const [isFullscreen, setIsFullscreen] = useState(false)
	const [searchTerm, setSearchTerm] = useState('')
	const { profile } = useUserProfile()
	const { isDark, toggleDarkMode } = useDarkMode()

	const [sidebarOpen, setSidebarOpen] = useState(false)
	const [sidebarExpanded, setSidebarExpanded] = useState(false) // New state for hover expansion
	const location = useLocation()
	const navigate = useNavigate()
	const [, setUsdValue] = useState('')
	const [, setVesInputValue] = useState('')
	const [, setIsSubmitted] = useState(false)
	const form = useForm<FormValues>({ defaultValues: getInitialFormValues() })
	const { toast } = useToast()

	// Determine active tab based on current route
	useEffect(() => {
		const pathname = location.pathname
		if (pathname === '/form') {
			setActiveTab('form')
		} else if (pathname === '/records') {
			setActiveTab('records')
		} else if (pathname === '/doctors') {
			setActiveTab('doctors')
		} else if (pathname === '/patients') {
			setActiveTab('patients')
		} else if (pathname === '/settings') {
			setActiveTab('settings')
		}
	}, [location.pathname])



	const handleSidebarMouseEnter = () => {
		setSidebarExpanded(true)
	}

	const handleSidebarMouseLeave = () => {
		setSidebarExpanded(false)
	}

	// Query for medical records data - fetch all records at once
	// Only enable the query when the records tab is active to save resources
	const {
		data: casesData,
		isLoading: casesLoading,
		error: casesError,
		refetch: refetchCases,
	} = useQuery({
		queryKey: ['medical-cases', searchTerm],
		queryFn: () => (searchTerm ? searchMedicalRecords(searchTerm) : getMedicalRecords()),
		staleTime: 1000 * 60 * 5, // 5 minutes
		// Add refetchOnWindowFocus to false to prevent unnecessary refetches
		refetchOnWindowFocus: false,
		// Only enable the query when the records tab is active
		enabled: activeTab === 'records',
	})

	const handleRefreshCases = useCallback(() => {
		refetchCases()
	}, [refetchCases])

	const handleSearch = useCallback((term: string) => {
		setSearchTerm(term)
	}, [])

	// Handle tab change with routing for Employee users
	const handleTabChange = useCallback(
		(value: string) => {
			setActiveTab(value)

			// If user is Employee, navigate to the corresponding route
			if (profile?.role === 'employee') {
				const routeMap = {
					form: '/form',
					records: '/records',
					doctors: '/doctors',
					patients: '/patients',
					settings: '/settings',
				}
				navigate(routeMap[value as keyof typeof routeMap])
			}

			// If switching to records tab, refetch data
			if (value === 'records') {
				refetchCases()
			}
		},
		[refetchCases, profile?.role, navigate],
	)

	useResetForm(form, getInitialFormValues, setUsdValue, setIsSubmitted, toast)

	const handleClearForm = useCallback(() => {
		form.reset(getInitialFormValues())
		setUsdValue('')
		setVesInputValue('')
		setIsSubmitted(false)
		toast({
			title: '🧹 Formulario Limpio',
			description: 'Todos los campos han sido reiniciados.',
		})
	}, [form, toast])

	return (
		<>
			<Toaster />
			<Sonner />
			<div className="fixed top-4 right-4 z-50 flex items-center gap-2">
				{/* Mobile sidebar toggle button */}
				{activeTab === 'form' && (
					<Button
						type="button"
						onClick={handleClearForm}
						variant="outline"
						className="flex lg:hidden items-center gap-1 text-xs py-1 px-2 sm:py-1.5 sm:px-2.5"
					>
						<Trash2 className="h-4 w-4" />
						Limpiar
					</Button>
				)}
				{activeTab === 'records' && (
					<>
						<button
							onClick={handleRefreshCases}
							disabled={casesLoading}
							className="flex items-center bg-white gap-2 px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary dark:bg-background dark:text-white text-sm hover:bg-gray-50 dark:hover:bg-gray-700 shadow-xl dark:shadow-black shadow-black/40"
						>
							<RefreshCw className={`w-4 h-4 ${casesLoading ? 'animate-spin' : ''}`} />
						</button>
					</>
				)}
				<button
					onClick={() => setSidebarOpen(!sidebarOpen)}
					className="lg:hidden flex items-center justify-center p-2 bg-white dark:bg-background border border-input rounded-lg shadow-lg"
				>
					<Menu className="h-5 w-5 text-gray-600 dark:text-gray-400" />
				</button>
			</div>

			<AnimatePresence>
				{sidebarOpen && (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						className="fixed inset-0 bg-black bg-opacity-50 z-[999998] lg:hidden"
						onClick={() => setSidebarOpen(false)}
					/>
				)}
			</AnimatePresence>

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
					onClose={() => {
						setSidebarOpen(false)
						setSidebarExpanded(false)
					}}
					isExpanded={sidebarExpanded}
					isMobile={sidebarOpen}
					isDark={isDark}
					toggleDarkMode={toggleDarkMode}
				/>
			</div>
			<div className="container mx-auto py-4 md:py-6 px-2 sm:px-4">
				<main
					className={`min-h-screen flex flex-col transition-all duration-300 ease-in-out z-50 ${
						sidebarExpanded ? 'lg:ml-56' : 'lg:ml-16'
					}`}
				>
					<Tabs defaultValue="form" value={activeTab} onValueChange={handleTabChange}>
						<TabsContent value="form" className="mt-4">
							<MedicalForm />
						</TabsContent>

						<TabsContent value="records" className="mt-4">
							<Suspense fallback={<LoadingFallback />}>
								<RecordsSection
									cases={casesData?.data || []}
									isLoading={casesLoading}
									error={casesError}
									refetch={refetchCases}
									isFullscreen={isFullscreen}
									setIsFullscreen={setIsFullscreen}
									onSearch={handleSearch}
								/>
							</Suspense>
						</TabsContent>

						<TabsContent value="settings" className="mt-4">
							<SettingsSection />
						</TabsContent>

						<TabsContent value="doctors" className="mt-4">
							<DoctorsSection />
						</TabsContent>

						<TabsContent value="patients" className="mt-4">
							<PatientsPage />
						</TabsContent>
					</Tabs>
				</main>
			</div>
		</>
	)
}

export default function Form() {
	return (
		<ThemeProvider defaultTheme="system" storageKey="ui-theme">
			<div className="overflow-x-hidden">
				<FormContent />
			</div>
		</ThemeProvider>
	)
}
