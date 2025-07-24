import React from 'react'
import {
	Home,
	PieChart,
	FileText,
	FolderInput,
	LogOut,
	Microscope,
	Moon,
	Sun,
	Users,
	Settings,
	History,
	User,
	ChevronDown,
	ChevronRight,
	Folder,
	Stethoscope,
	Clipboard,
} from 'lucide-react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '@app/providers/AuthContext'
import FavIcon from '@shared/components/icons/FavIcon'
import { useUserProfile } from '@shared/hooks/useUserProfile'
import { cn } from '@shared/lib/cn'
import {useBodyScrollLock} from '@shared/hooks/useBodyScrollLock'

interface NavItemProps {
	to: string
	icon: React.ReactNode
	label: string
	showFullContent: boolean
	onClick?: () => void
	title?: string
}

interface NavGroupProps {
	icon: React.ReactNode
	label: string
	showFullContent: boolean
	isExpanded: boolean
	onToggle: () => void
	children: React.ReactNode
	childPaths: string[] // Array de rutas de los items hijos
	isMobile?: boolean // Para manejar comportamiento diferente en mobile
}

const NavItem: React.FC<NavItemProps> = ({ to, icon, label, showFullContent, onClick, title }) => {
	return (
		<NavLink
			to={to}
			className={({ isActive }) =>
				`flex justify-between items-center gap-2 sm:gap-3 cursor-pointer w-full py-2 px-1 rounded-md ${
					isActive ? 'text-primary border-primary' : 'hover:text-primary'
				}`
			}
			onClick={onClick}
			title={!showFullContent ? title || label : undefined}
		>
			<div className="flex gap-3 items-center min-w-0">
				{icon}
				<p
					className={`text-md whitespace-nowrap ${
						showFullContent ? 'opacity-100 w-auto' : 'opacity-0 w-0 overflow-hidden'
					}`}
				>
					{label}
				</p>
			</div>
		</NavLink>
	)
}

const NavGroup: React.FC<NavGroupProps> = ({
	icon,
	label,
	showFullContent,
	isExpanded,
	onToggle,
	children,
	childPaths,
	isMobile = false,
}) => {
	const [hoverTimeout, setHoverTimeout] = React.useState<NodeJS.Timeout | null>(null)

	// Verificar si algún item hijo está activo
	const isChildActive = childPaths.some((path) => window.location.pathname === path)

	// Funciones para hover (solo desktop)
	const handleMouseEnter = () => {
		if (isMobile) return // No hacer nada en mobile

		if (hoverTimeout) {
			clearTimeout(hoverTimeout)
			setHoverTimeout(null)
		}
		if (!isExpanded) {
			onToggle()
		}
	}

	const handleMouseLeave = () => {
		if (isMobile) return // No hacer nada en mobile

		if (hoverTimeout) {
			clearTimeout(hoverTimeout)
		}
		const timeout = setTimeout(() => {
			if (isExpanded) {
				onToggle()
			}
		}, 200) // Delay de 200ms antes de cerrar
		setHoverTimeout(timeout)
	}

	// Función para click (mobile y desktop)
	const handleClick = () => {
		if (isMobile) {
			// En mobile, solo funciona con clicks
			onToggle()
		} else {
			// En desktop, también permitir clicks para mayor flexibilidad
			if (hoverTimeout) {
				clearTimeout(hoverTimeout)
				setHoverTimeout(null)
			}
			onToggle()
		}
	}

	// Limpiar timeout al desmontar
	React.useEffect(() => {
		return () => {
			if (hoverTimeout) {
				clearTimeout(hoverTimeout)
			}
		}
	}, [hoverTimeout])

	return (
		<div className="space-y-1" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
			<div
				className={`flex justify-between items-center gap-2 sm:gap-3 cursor-pointer w-full py-2 px-1 rounded-md ${
					isExpanded || isChildActive ? 'text-primary' : 'hover:text-primary'
				}`}
				title={!showFullContent ? label : undefined}
				onClick={handleClick}
			>
				<div className="flex gap-3 items-center min-w-0">
					{icon}
					<p
						className={`text-md whitespace-nowrap ${
							showFullContent ? 'opacity-100 w-auto' : 'opacity-0 w-0 overflow-hidden'
						}`}
					>
						{label}
					</p>
				</div>
				{showFullContent && (
					<div className="transition-transform duration-500">
						{isExpanded ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
					</div>
				)}
			</div>

			<div
				className={cn(
					'pl-2 space-y-1 overflow-hidden transition-all duration-500',
					isExpanded ? 'max-h-96' : 'max-h-0',
				)}
			>
				{children}
			</div>
		</div>
	)
}

interface SidebarProps {
	onClose?: () => void
	isExpanded?: boolean
	isMobile?: boolean
	isDark: boolean
	toggleDarkMode: () => void
}

const Sidebar: React.FC<SidebarProps> = ({
	onClose,
	isExpanded = false,
	isMobile = false,
	isDark,
	toggleDarkMode,
}) => {
	// For mobile, always show full sidebar. For desktop, use isExpanded state
	const showFullContent = isMobile || isExpanded
	const navigate = useNavigate()
	const { signOut } = useAuth()
	const { profile } = useUserProfile()

	// Definir las rutas de cada grupo
	const clinicalPaths = ['/dashboard/cases', '/dashboard/my-cases', '/dashboard/patients', '/patients']
	const reportsPaths = ['/dashboard/stats', '/dashboard/reports', '/dashboard/changelog']

	const [expandedGroups, setExpandedGroups] = React.useState<Record<string, boolean>>({
		clinical: false,
		reports: false,
	})

	const toggleGroup = (groupName: string) => {
		setExpandedGroups((prev) => ({
			...prev,
			[groupName]: !prev[groupName],
		}))
	}

	// Collapse all groups when sidebar is collapsed
	React.useEffect(() => {
		if (!showFullContent) {
			setExpandedGroups({
				clinical: false,
				reports: false,
			})
		}
	}, [showFullContent])

	const handleLogout = async () => {
		await signOut()
		// Clear session storage
		localStorage.removeItem('last_activity_time')
		localStorage.removeItem('session_expiry_time')
		localStorage.removeItem('session_timeout_minutes')
		navigate('/')
	}

	// Determine if user is admin role
	const isAdmin = profile?.role === 'admin'
	const isOwner = profile?.role === 'owner'
	const isEmployee = profile?.role === 'employee'

	useBodyScrollLock(showFullContent)

	return (
		<aside className="bg-white/80 dark:bg-background/50 shadow-lg shadow-primary/50 backdrop-blur-[10px] flex flex-col justify-between h-screen py-4 sm:py-6 px-2 sm:px-4 gap-4 border-gray-600 text-gray-700 dark:text-white ease-in-out overflow-hidden border-r border-input">
			<div className="flex flex-col items-start gap-4">
				<div className="flex justify-between items-center w-full mb-2 sm:mb-4">
					<a
						href="https://conspat.solware.agency/"
						target="_blank"
						rel="noopener noreferrer"
						className="flex items-center gap-3 hover:opacity-80 transition-opacity"
					>
						<FavIcon fill="#e82084" className="size-8 shrink-0 -ml-1" />
						<p
							className={`text-2xl font-bold whitespace-nowrap ${
								showFullContent ? 'opacity-100 w-auto' : 'opacity-0 w-0 overflow-hidden'
							}`}
						>
							Conspat
						</p>
					</a>

				</div>

				<div className="flex flex-col justify-center gap-4">
					{/* Common menu items for all roles */}
					{!isEmployee && !isAdmin && (
						<div className="py-1">
							<NavItem
								to="/dashboard/home"
								icon={<Home className="stroke-2 size-5 shrink-0" />}
								label="Inicio"
								showFullContent={showFullContent}
								onClick={onClose}
							/>
						</div>
					)}

					{/* Employee specific routes */}
					{isEmployee && (
						<>
							<NavItem
								to="/form"
								icon={<FileText className="stroke-2 size-5 shrink-0" />}
								label="Formulario"
								showFullContent={showFullContent}
								onClick={onClose}
							/>
							<NavItem
								to="/records"
								icon={<FolderInput className="stroke-2 size-5 shrink-0" />}
								label="Registros"
								showFullContent={showFullContent}
								onClick={onClose}
							/>
							<NavItem
								to="/doctors"
								icon={<Stethoscope className="stroke-2 size-5 shrink-0" />}
								label="Médicos"
								showFullContent={showFullContent}
								onClick={onClose}
							/>
							<NavItem
								to="/patients"
								icon={<Users className="stroke-2 size-5 shrink-0" />}
								label="Pacientes"
								showFullContent={showFullContent}
								onClick={onClose}
							/>
						</>
					)}

					{/* Clinical Group - Cases, Patients, My Cases */}
					{(isAdmin || isOwner) && (
						<NavGroup
							icon={<Folder className="stroke-2 size-4 sm:size-5 shrink-0" />}
							label="Clínico"
							showFullContent={showFullContent}
							isExpanded={expandedGroups.clinical}
							onToggle={() => toggleGroup('clinical')}
							childPaths={clinicalPaths}
							isMobile={isMobile}
						>
							{/* Cases - For all roles */}
							<NavItem
								to="/dashboard/cases"
								icon={<FolderInput className="stroke-2 size-5 shrink-0" />}
								label="Casos"
								showFullContent={showFullContent}
								onClick={onClose}
							/>

							{/* My Cases - Only for admin */}
							{isAdmin && (
								<NavItem
									to="/dashboard/my-cases"
									icon={<Microscope className="stroke-2 size-5 shrink-0" />}
									label="Mis Casos"
									showFullContent={showFullContent}
									onClick={onClose}
								/>
							)}

							{/* Patients - For all roles */}
							{(isOwner || isEmployee) && (
								<NavItem
									to={isEmployee ? '/patients' : '/dashboard/patients'}
									icon={<User className="stroke-2 size-5 shrink-0" />}
									label="Pacientes"
									showFullContent={showFullContent}
									onClick={onClose}
								/>
							)}
						</NavGroup>
					)}

					{/* Reports Group - Stats, Reports, Changelog */}
					{isOwner && (
						<NavGroup
							icon={<FileText className="stroke-2 size-4 sm:size-5 shrink-0" />}
							label="Análisis"
							showFullContent={showFullContent}
							isExpanded={expandedGroups.reports}
							onToggle={() => toggleGroup('reports')}
							childPaths={reportsPaths}
							isMobile={isMobile}
						>
							<NavItem
								to="/dashboard/stats"
								icon={<PieChart className="stroke-2 size-5 shrink-0" />}
								label="Estadísticas"
								showFullContent={showFullContent}
								onClick={onClose}
							/>

							<NavItem
								to="/dashboard/reports"
								icon={<Clipboard className="stroke-2 size-5 shrink-0" />}
								label="Reportes"
								showFullContent={showFullContent}
								onClick={onClose}
							/>

							<NavItem
								to="/dashboard/changelog"
								icon={<History className="stroke-2 size-5 shrink-0" />}
								label="Historial"
								showFullContent={showFullContent}
								onClick={onClose}
							/>
						</NavGroup>
					)}

					{isOwner && (
						<NavItem
							to="/dashboard/doctors"
							icon={<Stethoscope className="stroke-2 size-5 shrink-0" />}
							label="Médicos"
							showFullContent={showFullContent}
							onClick={onClose}
						/>
					)}

					{/* Users - For owner and admin */}
					{(isOwner || isAdmin) && (
						<NavItem
							to="/dashboard/users"
							icon={<Users className="stroke-2 size-4 sm:size-5 shrink-0" />}
							label="Usuarios"
							showFullContent={showFullContent}
							onClick={onClose}
						/>
					)}
				</div>
			</div>

			<div className="flex flex-col justify-center gap-1">
				{isEmployee && (
					<NavItem
						to="/settings"
						icon={<Settings className="stroke-2 size-4 sm:size-5 shrink-0" />}
						label="Ajustes"
						showFullContent={showFullContent}
						onClick={onClose}
					/>
				)}

				{!isEmployee && (
					<NavItem
						to="/dashboard/settings"
						icon={<Settings className="stroke-2 size-4 sm:size-5 shrink-0" />}
						label="Ajustes"
						showFullContent={showFullContent}
						onClick={onClose}
					/>
				)}

				<div
					onClick={toggleDarkMode}
					title={!showFullContent ? 'Cambiar color' : undefined}
					className="flex items-center gap-2 cursor-pointer hover:text-primary py-2 px-1 rounded-md"
					aria-label={isDark ? 'Activar modo claro' : 'Activar modo oscuro'}
				>
					{isDark ? (
						<Sun className="stroke-2 size-4 sm:size-5 shrink-0" />
					) : (
						<Moon className="stroke-2 size-4 sm:size-5 shrink-0" />
					)}
					<p
						className={`text-md whitespace-nowrap ${
							showFullContent ? 'opacity-100 w-auto' : 'opacity-0 w-0 overflow-hidden'
						}`}
					>
						{isDark ? 'Claro' : 'Oscuro'}
					</p>
				</div>
				<div
					onClick={handleLogout}
					title={!showFullContent ? 'Salir' : undefined}
					className="flex items-center gap-2 cursor-pointer hover:text-red-500 py-2 px-1 rounded-md"
				>
					<LogOut className="stroke-2 size-4 sm:size-5 shrink-0 text-red-500" />
					<p
						className={`text-md whitespace-nowrap ${
							showFullContent ? 'opacity-100 w-auto' : 'opacity-0 w-0 overflow-hidden'
						}`}
					>
						Salir
					</p>
				</div>
			</div>
		</aside>
	)
}

export default Sidebar
