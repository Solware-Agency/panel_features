import React, { useState, useEffect } from 'react'
import {
	Users,
	Mail,
	Calendar,
	Search,
	Filter,
	Crown,
	Briefcase,
	MapPin,
	CheckCircle,
	Clock,
	User,
	ShieldCheck,
} from 'lucide-react'
import { Card } from '@shared/components/ui/card'
import { Input } from '@shared/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@shared/components/ui/select'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@lib/supabase/config'
import {
	updateUserRole,
	updateUserBranch,
	canManageUsers,
	updateUserApprovalStatus,
} from '@lib/supabase/user-management'
import { useAuth } from '@app/providers/AuthContext'
import { useUserProfile } from '@shared/hooks/useUserProfile'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { useToast } from '@shared/hooks/use-toast'
import { Button } from '@shared/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@shared/components/ui/dialog'

interface UserProfile {
	id: string
	email: string
	role: 'owner' | 'employee' | 'admin'
	created_at: string
	updated_at: string
	email_confirmed_at?: string
	last_sign_in_at?: string
	password?: string // Campo para almacenar la contraseña (solo para visualización)
	assigned_branch?: string | null
	display_name?: string | null
	estado?: 'pendiente' | 'aprobado'
}

const MainUsers: React.FC = () => {
	const { user: currentUser } = useAuth()
	const { profile } = useUserProfile()
	const { toast } = useToast()
	const [searchTerm, setSearchTerm] = useState('')
	const [roleFilter, setRoleFilter] = useState<string>('all')
	const [statusFilter, setStatusFilter] = useState<string>('all')
	const [branchFilter, setbranchFilter] = useState<string>('all')
	const [approvalFilter, setApprovalFilter] = useState<string>('all')
	const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
	const [roleFilterOptions, setRoleFilterOptions] = useState<string[]>(['all', 'owner', 'employee', 'admin'])
	const [userToUpdate, setUserToUpdate] = useState<{
		id: string
		email: string
		newRole: 'owner' | 'employee' | 'admin'
	} | null>(null)

	// Query para obtener usuarios
	const {
		data: users,
		isLoading,
		error,
		refetch,
	} = useQuery({
		queryKey: ['users'],
		queryFn: async (): Promise<UserProfile[]> => {
			try {
				// Obtener perfiles de usuarios
				const { data: profiles, error: profilesError } = await supabase
					.from('profiles')
					.select('*')
					.order('created_at', { ascending: false })

				if (profilesError) throw profilesError

				// Simular contraseñas para demostración (en un sistema real, nunca se deberían mostrar contraseñas)
				// Esto es solo para fines de demostración
				const usersWithPasswords =
					profiles?.map((profile) => ({
						...profile,
						email_confirmed_at: undefined, // Placeholder
						last_sign_in_at: undefined, // Placeholder
						password: '********', // Contraseña simulada para demostración
					})) || []

				return usersWithPasswords
			} catch (error) {
				console.error('Error fetching users:', error)
				throw error
			}
		},
		staleTime: 1000 * 60 * 5, // 5 minutos
	})

	// Set available role filter options based on user role
	useEffect(() => {
		if (profile?.role === 'admin') {
			// Admin users can only see admin users
			setRoleFilterOptions(['admin'])
			setRoleFilter('admin')
		} else {
			setRoleFilterOptions(['all', 'owner', 'employee', 'admin'])
		}
	}, [profile?.role])

	// Query para verificar permisos del usuario actual
	const { data: canManage } = useQuery({
		queryKey: ['can-manage-users', currentUser?.id],
		queryFn: async () => {
			if (!currentUser?.id) return false
			return await canManageUsers(currentUser.id)
		},
		enabled: !!currentUser?.id,
	})

	const getRoleIcon = (role: string) => {
		switch (role) {
			case 'owner':
				return <Crown className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
			case 'employee':
				return <Briefcase className="w-4 h-4 text-blue-600 dark:text-blue-400" />
			case 'admin':
				return <ShieldCheck className="w-4 h-4 text-purple-600 dark:text-purple-400" />
			default:
				return <Users className="w-4 h-4 text-gray-600 dark:text-gray-400" />
		}
	}

	const getRoleColor = (role: string) => {
		switch (role) {
			case 'owner':
				return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
			case 'employee':
				return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
			case 'admin':
				return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
			default:
				return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
		}
	}

	const getApprovalIcon = (estado?: string) => {
		switch (estado) {
			case 'aprobado':
				return <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
			case 'pendiente':
				return <Clock className="w-4 h-4 text-orange-600 dark:text-orange-400" />
			default:
				return <Clock className="w-4 h-4 text-gray-600 dark:text-gray-400" />
		}
	}

	const getApprovalColor = (estado?: string) => {
		switch (estado) {
			case 'aprobado':
				return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
			case 'pendiente':
				return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300'
			default:
				return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
		}
	}

	const getBranchColor = (branch: string | null | undefined) => {
		if (!branch) return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'

		switch (branch) {
			case 'PMG':
				return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
			case 'CPC':
				return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
			case 'CNX':
				return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
			case 'STX':
				return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300'
			case 'MCY':
				return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
			default:
				return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
		}
	}

	const handleRoleChange = async (userId: string, newRole: 'owner' | 'employee' | 'admin') => {
		// Verificar permisos antes de permitir edición
		if (!canManage) {
			toast({
				title: '❌ Sin permisos',
				description: 'No tienes permisos para editar usuarios.',
				variant: 'destructive',
			})
			return
		}

		// No permitir que un usuario se edite a sí mismo
		if (userId === currentUser?.id) {
			toast({
				title: '❌ Acción no permitida',
				description: 'No puedes cambiar tu propio rol.',
				variant: 'destructive',
			})
			return
		}

		// Obtener el usuario que se va a actualizar
		const userToEdit = users?.find((u) => u.id === userId)
		if (!userToEdit) {
			toast({
				title: '❌ Usuario no encontrado',
				description: 'No se pudo encontrar el usuario para editar.',
				variant: 'destructive',
			})
			return
		}

		// Si el nuevo rol es admin, mostrar diálogo de confirmación
		if (newRole === 'admin') {
			setUserToUpdate({
				id: userId,
				email: userToEdit.email,
				newRole: newRole,
			})
			setConfirmDialogOpen(true)
			return
		}

		// Para otros roles, proceder directamente
		try {
			const { error } = await updateUserRole(userId, newRole)

			if (error) {
				throw error
			}

			toast({
				title: '✅ Rol actualizado',
				description: `El rol del usuario ha sido cambiado a ${
					{ owner: 'Propietario', admin: 'Administrador', employee: 'Recepcionista' }[newRole]
				}.`,
				className: 'bg-green-100 border-green-400 text-green-800',
			})

			// Refrescar la lista de usuarios
			refetch()
		} catch (error) {
			console.error('Error updating user role:', error)
			toast({
				title: '❌ Error al actualizar',
				description: 'Hubo un problema al cambiar el rol del usuario. Inténtalo de nuevo.',
				variant: 'destructive',
			})
		}
	}

	const confirmRoleChange = async () => {
		if (!userToUpdate) return

		try {
			const { error } = await updateUserRole(userToUpdate.id, userToUpdate.newRole)

			if (error) {
				throw error
			}

			toast({
				title: '✅ Rol actualizado',
				description: `El rol del usuario ha sido cambiado a ${
					{ owner: 'Propietario', admin: 'Administrador', employee: 'Recepcionista' }[userToUpdate.newRole]
				}.`,
				className: 'bg-green-100 border-green-400 text-green-800',
			})

			// Refrescar la lista de usuarios
			refetch()
		} catch (error) {
			console.error('Error updating user role:', error)
			toast({
				title: '❌ Error al actualizar',
				description: 'Hubo un problema al cambiar el rol del usuario. Inténtalo de nuevo.',
				variant: 'destructive',
			})
		} finally {
			setConfirmDialogOpen(false)
			setUserToUpdate(null)
		}
	}

	const handleBranchChange = async (userId: string, branch: string | null) => {
		// Verificar permisos antes de permitir edición
		if (!canManage) {
			toast({
				title: '❌ Sin permisos',
				description: 'No tienes permisos para editar usuarios.',
				variant: 'destructive',
			})
			return
		}

		try {
			const { error } = await updateUserBranch(userId, branch === 'none' ? null : branch)

			if (error) {
				throw error
			}

			toast({
				title: '✅ Sede actualizada',
				description:
					branch === 'none'
						? 'Se ha eliminado la restricción de sede para este usuario.'
						: `La sede del usuario ha sido cambiada a ${branch}.`,
				className: 'bg-green-100 border-green-400 text-green-800',
			})

			// Refrescar la lista de usuarios
			refetch()
		} catch (error) {
			console.error('Error updating user branch:', error)
			toast({
				title: '❌ Error al actualizar',
				description: 'Hubo un problema al cambiar la sede del usuario. Inténtalo de nuevo.',
				variant: 'destructive',
			})
		}
	}

	const handleApprovalChange = async (userId: string, newStatus: 'pendiente' | 'aprobado') => {
		// Verificar permisos antes de permitir edición
		if (!canManage) {
			toast({
				title: '❌ Sin permisos',
				description: 'No tienes permisos para aprobar usuarios.',
				variant: 'destructive',
			})
			return
		}

		// No permitir que un usuario se edite a sí mismo
		if (userId === currentUser?.id) {
			toast({
				title: '❌ Acción no permitida',
				description: 'No puedes cambiar tu propio estado de aprobación.',
				variant: 'destructive',
			})
			return
		}

		try {
			const { error } = await updateUserApprovalStatus(userId, newStatus)

			if (error) {
				throw error
			}

			toast({
				title: newStatus === 'aprobado' ? '✅ Usuario aprobado' : '⏱️ Usuario pendiente',
				description:
					newStatus === 'aprobado'
						? 'El usuario ha sido aprobado y ahora puede acceder al sistema.'
						: 'El usuario ha sido marcado como pendiente y no podrá acceder al sistema.',
				className:
					newStatus === 'aprobado'
						? 'bg-green-100 border-green-400 text-green-800'
						: 'bg-orange-100 border-orange-400 text-orange-800',
			})

			// Refrescar la lista de usuarios
			refetch()
		} catch (error) {
			console.error('Error updating user approval status:', error)
			toast({
				title: '❌ Error al actualizar',
				description: 'Hubo un problema al cambiar el estado de aprobación. Inténtalo de nuevo.',
				variant: 'destructive',
			})
		}
	}

	// Filtrar usuarios
	const filteredUsers =
		users?.filter((user) => {
			// If current user is admin, only show admin users
			if (profile?.role === 'admin' && user.role !== 'admin') {
				return false
			}

			const matchesSearch =
				user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
				(user.display_name || '').toLowerCase().includes(searchTerm.toLowerCase())
			const matchesRole = roleFilter === 'all' || user.role === roleFilter
			const matchesStatus =
				statusFilter === 'all' ||
				(statusFilter === 'verified' && user.email_confirmed_at) ||
				(statusFilter === 'unverified' && !user.email_confirmed_at)
			const matchesBranch =
				branchFilter === 'all' ||
				(branchFilter === 'assigned' && user.assigned_branch) ||
				(branchFilter === 'unassigned' && !user.assigned_branch) ||
				user.assigned_branch === branchFilter
			const matchesApproval =
				approvalFilter === 'all' ||
				(approvalFilter === 'aprobado' && user.estado === 'aprobado') ||
				(approvalFilter === 'pendiente' && user.estado === 'pendiente')

			return matchesSearch && matchesRole && matchesStatus && matchesBranch && matchesApproval
		}) || []

	// Estadísticas
	const stats = {
		total: users?.length || 0,
		owners: users?.filter((u) => u.role === 'owner').length || 0,
		employees: users?.filter((u) => u.role === 'employee').length || 0,
		admins: users?.filter((u) => u.role === 'admin').length || 0,
		verified: users?.filter((u) => u.email_confirmed_at).length || 0,
		withBranch: users?.filter((u) => u.assigned_branch).length || 0,
		approved: users?.filter((u) => u.estado === 'aprobado').length || 0,
		pending: users?.filter((u) => u.estado === 'pendiente').length || 0,
	}

	if (isLoading) {
		return (
			<div className="p-3 sm:p-6">
				<div className="flex items-center justify-center py-12">
					<div className="flex items-center gap-3">
						<div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
						<span className="text-lg text-gray-700 dark:text-gray-300">Cargando usuarios...</span>
					</div>
				</div>
			</div>
		)
	}

	if (error) {
		return (
			<div className="p-3 sm:p-6">
				<div className="text-center py-12">
					<div className="text-red-500 dark:text-red-400">
						<p className="text-lg font-medium">Error al cargar los usuarios</p>
						<p className="text-sm mt-2">Verifica tu conexión a internet o contacta al administrador</p>
						<button
							onClick={() => refetch()}
							className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
						>
							Reintentar
						</button>
					</div>
				</div>
			</div>
		)
	}

	return (
		<div className="p-3 sm:p-6">
			{/* Page Title */}
			<div className="mb-4 sm:mb-6">
				<h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
					{profile?.role === 'admin' ? 'Gestión de Médicos' : 'Gestión de Usuarios'}
				</h1>
				<p className="text-sm text-gray-600 dark:text-gray-400 mt-1 sm:mt-2">
					{profile?.role === 'admin'
						? 'Administra los médicos del sistema y sus permisos'
						: 'Administra los usuarios del sistema y sus permisos'}
				</p>
			</div>

			{/* Estadísticas - Responsive Grid */}
			<div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-3 sm:mb-5">
				<Card className="hover:border-primary hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/20 transition-all duration-300 shadow-lg">
					<div className="bg-white dark:bg-background rounded-xl p-3 sm:p-4 md:p-6">
						<div className="flex items-center justify-between mb-2 sm:mb-4">
							<div className="p-1.5 sm:p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
							</div>
						</div>
						<div>
							<h3 className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">Total Usuarios</h3>
							<p className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-700 dark:text-gray-300">
								{stats.total}
							</p>
						</div>
					</div>
				</Card>

				<Card className="hover:border-primary hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/20 transition-all duration-300 shadow-lg">
					<div className="bg-white dark:bg-background rounded-xl p-3 sm:p-4 md:p-6">
						<div className="flex items-center justify-between mb-2 sm:mb-4">
							<div className="p-1.5 sm:p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
								<Crown className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600 dark:text-yellow-400" />
							</div>
						</div>
						<div>
							<h3 className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">Propietarios</h3>
							<p className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-700 dark:text-gray-300">
								{stats.owners}
							</p>
						</div>
					</div>
				</Card>

				<Card className="hover:border-primary hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/20 transition-all duration-300 shadow-lg">
					<div className="bg-white dark:bg-background rounded-xl p-3 sm:p-4 md:p-6">
						<div className="flex items-center justify-between mb-2 sm:mb-4">
							<div className="p-1.5 sm:p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
								<Briefcase className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400" />
							</div>
						</div>
						<div>
							<h3 className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">Recepcionistas</h3>
							<p className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-700 dark:text-gray-300">
								{stats.employees}
							</p>
						</div>
					</div>
				</Card>

				<Card className="hover:border-primary hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/20 transition-all duration-300 shadow-lg">
					<div className="bg-white dark:bg-background rounded-xl p-3 sm:p-4 md:p-6">
						<div className="flex items-center justify-between mb-2 sm:mb-4">
							<div className="p-1.5 sm:p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
								<ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 dark:text-purple-400" />
							</div>
						</div>
						<div>
							<h3 className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">Administradores</h3>
							<p className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-700 dark:text-gray-300">
								{stats.admins}
							</p>
						</div>
					</div>
				</Card>
			</div>

			{/* Filtros y búsqueda */}
			<Card className="hover:border-primary hover:shadow-lg hover:shadow-primary/20 transition-all duration-300 shadow-lg mb-3 sm:mb-5">
				<div className="bg-white dark:bg-background rounded-xl p-3 sm:p-6">
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-2 sm:gap-3">
						{/* Búsqueda */}
						<div className="col-span-1 sm:col-span-2 lg:col-span-2 xl:col-span-2 relative">
							<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
							<Input
								type="text"
								placeholder="Buscar por email o nombre..."
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
								className="pl-10"
							/>
						</div>

						{/* Filtro por rol */}
						<div className="col-span-1 sm:col-span-1 lg:col-span-1 xl:col-span-1 flex items-center gap-2">
							<Filter className="w-4 h-4 text-gray-400" />
							<Select value={roleFilter} onValueChange={setRoleFilter}>
								<SelectTrigger className="w-40">
									<SelectValue placeholder={profile?.role === 'admin' ? 'Médicos' : 'Filtrar por rol'} />
								</SelectTrigger>
								<SelectContent>
									{roleFilterOptions.map((role) => (
										<SelectItem key={role} value={role}>
											{role === 'all'
												? 'Todos los roles'
												: role === 'owner'
												? 'Propietarios'
												: role === 'employee'
												? 'Recepcionistas'
												: 'Médicos'}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						{/* Filtro por estado */}
						<div className="col-span-1 sm:col-span-1 lg:col-span-1 xl:col-span-1 flex items-center gap-2">
							<Select value={statusFilter} onValueChange={setStatusFilter}>
								<SelectTrigger className="w-40">
									<SelectValue placeholder="Filtrar por estado" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">Todos los estados</SelectItem>
									<SelectItem value="verified">Verificados</SelectItem>
									<SelectItem value="unverified">No verificados</SelectItem>
								</SelectContent>
							</Select>
						</div>

						{/* Filtro por aprobación */}
						<div className="col-span-1 sm:col-span-1 lg:col-span-1 xl:col-span-1 flex items-center gap-2">
							<Select value={approvalFilter} onValueChange={setApprovalFilter}>
								<SelectTrigger className="w-40">
									<SelectValue placeholder="Filtrar por aprobación" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">Todos</SelectItem>
									<SelectItem value="aprobado">Aprobados</SelectItem>
									<SelectItem value="pendiente">Pendientes</SelectItem>
								</SelectContent>
							</Select>
						</div>

						{/* Filtro por sede */}
						<div className="col-span-1 sm:col-span-1 lg:col-span-1 xl:col-span-1 flex items-center gap-2">
							<Select value={branchFilter} onValueChange={setbranchFilter}>
								<SelectTrigger className="w-40">
									<SelectValue placeholder="Filtrar por sede" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">Todas las sedes</SelectItem>
									<SelectItem value="assigned">Con sede asignada</SelectItem>
									<SelectItem value="unassigned">Sin sede asignada</SelectItem>
									<SelectItem value="PMG">PMG</SelectItem>
									<SelectItem value="CPC">CPC</SelectItem>
									<SelectItem value="CNX">CNX</SelectItem>
									<SelectItem value="STX">STX</SelectItem>
									<SelectItem value="MCY">MCY</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</div>

					{/* Contador de resultados */}
					<div className="mt-3 sm:mt-4 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
						Mostrando {filteredUsers.length} de {stats.total} usuarios
					</div>
				</div>
			</Card>

			{/* Tabla de usuarios */}
			<Card className="hover:border-primary hover:shadow-lg hover:shadow-primary/20 transition-all duration-300 shadow-lg overflow-hidden">
				<div className="bg-white dark:bg-background rounded-xl">
					{/* Vista móvil - Cards */}
					<div className="block lg:hidden p-3 sm:p-4">
						<div className="space-y-3 sm:space-y-4">
							{filteredUsers.map((user) => (
								<div
									key={user.id}
									className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 sm:p-4 border border-gray-200 dark:border-gray-700"
								>
									{/* Header con rol y estado */}
									<div className="flex items-center justify-between mb-2 sm:mb-3">
										<span
											className={`inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 text-xs font-semibold rounded-full ${getRoleColor(
												user.role,
											)}`}
										>
											{getRoleIcon(user.role)}
											{user.role === 'owner'
												? 'Propietario'
												: user.role === 'admin'
												? 'Administrador'
												: 'Recepcionista'}
										</span>
									</div>

									{/* Email */}
									<div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
										<Mail className="w-4 h-4 text-gray-600 dark:text-gray-400" />
										<p className="font-medium text-gray-900 dark:text-gray-100 text-xs sm:text-sm truncate">
											{user.email}
										</p>
									</div>

									{/* Display Name */}
									{user.display_name && (
										<div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
											<User className="w-4 h-4 text-gray-600 dark:text-gray-400" />
											<p className="font-medium text-gray-900 dark:text-gray-100 text-xs sm:text-sm truncate">
												{user.display_name}
											</p>
										</div>
									)}

									{/* Estado de aprobación */}
									<div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
										{getApprovalIcon(user.estado)}
										<span
											className={`inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 text-xs font-semibold rounded-full ${getApprovalColor(
												user.estado,
											)}`}
										>
											{user.estado === 'aprobado' ? 'Aprobado' : 'Pendiente de aprobación'}
										</span>
									</div>

									{/* Sede asignada */}
									<div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
										<MapPin className="w-4 h-4 text-gray-600 dark:text-gray-400" />
										<div className="flex items-center gap-2">
											{user.assigned_branch ? (
												<span
													className={`inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 text-xs font-semibold rounded-full ${getBranchColor(
														user.assigned_branch,
													)}`}
												>
													{user.assigned_branch}
												</span>
											) : (
												<span className="text-sm text-gray-500 dark:text-gray-400">Sin sede asignada</span>
											)}
										</div>
									</div>

									{/* Fecha de registro */}
									<div className="flex items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3">
										<Calendar className="w-4 h-4 text-gray-600 dark:text-gray-400" />
										<p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">
											Registrado: {format(new Date(user.created_at), 'dd/MM/yyyy HH:mm', { locale: es })}
										</p>
									</div>

									{/* Selector de aprobación */}
									{canManage && user.id !== currentUser?.id && (
										<div className="mt-3">
											<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
												Estado de Aprobación:
											</label>
											<Select
												defaultValue={user.estado || 'pendiente'}
												onValueChange={(value: 'pendiente' | 'aprobado') => handleApprovalChange(user.id, value)}
											>
												<SelectTrigger className="w-full">
													<SelectValue placeholder="Seleccionar estado" />
												</SelectTrigger>
												<SelectContent>
													<SelectItem value="aprobado">
														<div className="flex items-center gap-2">
															<CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
															<span>Aprobado</span>
														</div>
													</SelectItem>
													<SelectItem value="pendiente">
														<div className="flex items-center gap-2">
															<Clock className="w-4 h-4 text-orange-600 dark:text-orange-400" />
															<span>Pendiente</span>
														</div>
													</SelectItem>
												</SelectContent>
											</Select>
										</div>
									)}

									{/* Selector de rol */}
									{canManage && user.id !== currentUser?.id && (
										<div className="mt-3">
											<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
												Cambiar Rol:
											</label>
											<Select
												defaultValue={user.role}
												onValueChange={(value: 'owner' | 'employee' | 'admin') => handleRoleChange(user.id, value)}
											>
												<SelectTrigger className="w-full">
													<SelectValue placeholder="Seleccionar rol" />
												</SelectTrigger>
												<SelectContent>
													<SelectItem value="owner">
														<div className="flex items-center gap-2">
															<Crown className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
															<span>Propietario</span>
														</div>
													</SelectItem>
													<SelectItem value="employee">
														<div className="flex items-center gap-2">
															<Briefcase className="w-4 h-4 text-blue-600 dark:text-blue-400" />
															<span>Recepcionista</span>
														</div>
													</SelectItem>
													<SelectItem value="admin">
														<div className="flex items-center gap-2">
															<ShieldCheck className="w-4 h-4 text-purple-600 dark:text-purple-400" />
															<span>Administrador</span>
														</div>
													</SelectItem>
												</SelectContent>
											</Select>
										</div>
									)}

									{/* Selector de sede */}
									{canManage && (
										<div className="mt-3">
											<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
												Asignar Sede:
											</label>
											<Select
												defaultValue={user.assigned_branch || 'none'}
												onValueChange={(value) => handleBranchChange(user.id, value === 'none' ? null : value)}
											>
												<SelectTrigger className="w-full">
													<SelectValue placeholder="Seleccionar sede" />
												</SelectTrigger>
												<SelectContent>
													<SelectItem value="none">Sin restricción de sede</SelectItem>
													<SelectItem value="PMG">PMG</SelectItem>
													<SelectItem value="CPC">CPC</SelectItem>
													<SelectItem value="CNX">CNX</SelectItem>
													<SelectItem value="STX">STX</SelectItem>
													<SelectItem value="MCY">MCY</SelectItem>
												</SelectContent>
											</Select>
										</div>
									)}
								</div>
							))}
						</div>
					</div>

					{/* Vista desktop - Tabla */}
					<div className="hidden lg:block overflow-x-auto">
						<table className="w-full responsive-table">
							<thead className="bg-gray-50/50 dark:bg-background/50 backdrop-blur-[10px]">
								<tr>
									<th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
										Usuario
									</th>
									<th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
										Rol
									</th>
									<th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
										Sede Asignada
									</th>
									<th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
										Aprobación
									</th>
									<th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
										Fecha de Registro
									</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-gray-200 dark:divide-gray-700">
								{filteredUsers.map((user) => (
									<tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
										<td className="px-6 py-4">
											<div className="flex items-center gap-3">
												<div>
													<p className="text-sm font-medium text-gray-900 dark:text-gray-100">{user.email}</p>
													{user.display_name && (
														<p className="text-xs text-gray-500 dark:text-gray-400">{user.display_name}</p>
													)}
												</div>
											</div>
										</td>
										<td className="px-6 py-4">
											{canManage && user.id !== currentUser?.id ? (
												<Select
													defaultValue={user.role}
													onValueChange={(value: 'owner' | 'employee' | 'admin') => handleRoleChange(user.id, value)}
												>
													<SelectTrigger className="w-40">
														<SelectValue placeholder="Seleccionar rol" />
													</SelectTrigger>
													<SelectContent>
														<SelectItem value="owner">
															<div className="flex items-center gap-2">
																<Crown className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
																<span>Propietario</span>
															</div>
														</SelectItem>
														<SelectItem value="employee">
															<div className="flex items-center gap-2">
																<Briefcase className="w-4 h-4 text-blue-600 dark:text-blue-400" />
																<span>Recepcionista</span>
															</div>
														</SelectItem>
														<SelectItem value="admin">
															<div className="flex items-center gap-2">
																<ShieldCheck className="w-4 h-4 text-purple-600 dark:text-purple-400" />
																<span>Administrador</span>
															</div>
														</SelectItem>
													</SelectContent>
												</Select>
											) : (
												<span
													className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(
														user.role,
													)}`}
												>
													{getRoleIcon(user.role)}
													{user.role === 'owner'
														? 'Propietario'
														: user.role === 'admin'
														? 'Administrador'
														: 'Recepcionista'}
												</span>
											)}
										</td>
										<td className="px-6 py-4">
											{canManage ? (
												<Select
													defaultValue={user.assigned_branch || 'none'}
													onValueChange={(value) => handleBranchChange(user.id, value === 'none' ? null : value)}
												>
													<SelectTrigger className="w-40">
														<SelectValue placeholder="Seleccionar sede" className="text-white" />
													</SelectTrigger>
													<SelectContent className="bg-white dark:bg-background">
														<SelectItem value="none">Sin restricción</SelectItem>
														<SelectItem value="PMG">PMG</SelectItem>
														<SelectItem value="CPC">CPC</SelectItem>
														<SelectItem value="CNX">CNX</SelectItem>
														<SelectItem value="STX">STX</SelectItem>
														<SelectItem value="MCY">MCY</SelectItem>
													</SelectContent>
												</Select>
											) : user.assigned_branch ? (
												<span
													className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full ${getBranchColor(
														user.assigned_branch,
													)}`}
												>
													<MapPin className="w-3 h-3" />
													{user.assigned_branch}
												</span>
											) : (
												<span className="text-sm text-gray-500 dark:text-gray-400">Sin restricción</span>
											)}
										</td>
										<td className="px-6 py-4">
											{canManage && user.id !== currentUser?.id ? (
												<Select
													defaultValue={user.estado || 'pendiente'}
													onValueChange={(value: 'pendiente' | 'aprobado') => handleApprovalChange(user.id, value)}
												>
													<SelectTrigger className="w-40">
														<SelectValue placeholder="Seleccionar estado" />
													</SelectTrigger>
													<SelectContent>
														<SelectItem value="aprobado">
															<div className="flex items-center gap-2">
																<CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
																<span>Aprobado</span>
															</div>
														</SelectItem>
														<SelectItem value="pendiente">
															<div className="flex items-center gap-2">
																<Clock className="w-4 h-4 text-orange-600 dark:text-orange-400" />
																<span>Pendiente</span>
															</div>
														</SelectItem>
													</SelectContent>
												</Select>
											) : (
												<span
													className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full ${getApprovalColor(
														user.estado,
													)}`}
												>
													{getApprovalIcon(user.estado)}
													{user.estado === 'aprobado' ? 'Aprobado' : 'Pendiente'}
												</span>
											)}
										</td>
										<td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
											{format(new Date(user.created_at), 'dd/MM/yyyy HH:mm', { locale: es })}
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>

					{/* Estado vacío */}
					{filteredUsers.length === 0 && (
						<div className="text-center py-12">
							<div className="text-gray-500 dark:text-gray-400">
								<p className="text-lg font-medium">
									{profile?.role === 'admin' ? 'No se encontraron médicos' : 'No se encontraron usuarios'}
								</p>
								<p className="text-sm">Intenta ajustar los filtros de búsqueda</p>
							</div>
						</div>
					)}
				</div>
			</Card>

			{/* Instrucciones */}
			<div className="mt-4 sm:mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 sm:p-4">
				<h3 className="text-base sm:text-lg font-semibold text-blue-800 dark:text-blue-300 mb-1 sm:mb-2">
					{profile?.role === 'admin' ? 'Información de Médicos' : 'Instrucciones de Uso'}
				</h3>
				<ul className="list-disc list-inside space-y-1 sm:space-y-2 text-xs sm:text-sm text-blue-700 dark:text-blue-400">
					{profile?.role === 'admin' ? (
						<>
							<li>
								<strong>Médicos:</strong> En esta sección puedes ver y gestionar los usuarios con rol de médico.
							</li>
							<li>
								<strong>Asignación de Sede:</strong> Los médicos con una sede asignada solo podrán ver los casos médicos
								de esa sede.
							</li>
							<li>
								<strong>Generación de Casos:</strong> Los médicos pueden generar diagnósticos para casos de biopsia.
							</li>
						</>
					) : (
						<>
							<li>
								<strong>Aprobación de Usuarios:</strong> Los nuevos usuarios se crean con estado "Pendiente" y deben ser
								aprobados por un propietario antes de poder acceder al sistema.
							</li>
							<li>
								<strong>Asignación de Sede:</strong> Los Recepcionistas con una sede asignada solo podrán ver los casos
								médicos de esa sede.
							</li>
							<li>
								<strong>Sin Restricción:</strong> Los Recepcionistas sin sede asignada pueden ver todos los casos.
							</li>
							<li>
								<strong>Propietarios:</strong> Los usuarios con rol de propietario siempre pueden ver todos los casos,
								independientemente de la sede asignada.
							</li>
							<li>
								<strong>Administradores:</strong> Los usuarios con rol de administrador tienen acceso a registros, casos
								generados, médicos y ajustes.
							</li>
						</>
					)}
				</ul>
			</div>

			{/* Diálogo de confirmación para cambio a admin */}
			<Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Confirmar cambio de rol</DialogTitle>
						<DialogDescription>
							¿Está seguro que desea cambiar el rol del usuario {userToUpdate?.email} a Administrador? Este cambio
							modificará los permisos y accesos del usuario en el sistema.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button variant="outline" onClick={() => setConfirmDialogOpen(false)}>
							Cancelar
						</Button>
						<Button onClick={confirmRoleChange}>Confirmar</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	)
}

export default MainUsers