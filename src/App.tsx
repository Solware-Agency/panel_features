import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { LoginPage } from '@features/auth/pages/LoginPage'
import { RegisterPage } from '@features/auth/pages/RegisterPage'
import { ForgotPasswordPage } from '@features/auth/pages/ForgotPasswordPage'
import PasswordResetPage from '@features/auth/pages/PasswordResetPage'
import NewPasswordPage from '@features/auth/pages/NewPasswordPage'
import PrivateRoute from '@app/routes/PrivateRoute'
import EmailVerificationNotice from '@features/auth/other/EmailVerificationNotice'
import PendingApprovalPage from '@features/auth/other/PendingApprovalPage'
import AuthCallback from '@features/auth/other/AuthCallback'
import Layout from '@features/dashboard/layouts/Layout'
import HomePage from '@features/dashboard/home/HomePage'
import StatsPage from '@features/dashboard/stats/StatsPage'
import ReportsPage from '@features/dashboard/reports/ReportsPage'
import UsersPage from '@features/dashboard/users/UsersPage'
import CasesPage from '@features/dashboard/cases/CasesPage'
import MyCasesPage from '@features/dashboard/cases/MyCasesPage'
import SettingsPage from '@features/dashboard/settings/SettingsPage'
import ChangelogPage from '@features/dashboard/changelog/ChangelogPage'
import Form from '@features/form/pages/Form'
import PatientsPage from '@features/dashboard/patients/PatientsPage'
import FormRoute from '@app/routes/FormRoute'
import { DoctorsSection } from '@features/form/components/DoctorsSection'

// Create a client instance
const queryClient = new QueryClient()

function App() {
	return (
		<QueryClientProvider client={queryClient}>
			<BrowserRouter
				future={{
					v7_startTransition: true,
					v7_relativeSplatPath: true,
				}}
			>
				<div className="App">
					<Routes>
						{/* Public routes */}
						<Route path="/" element={<LoginPage />} />
						<Route path="/register" element={<RegisterPage />} />
						<Route path="/forgot-password" element={<ForgotPasswordPage />} />
						<Route path="/reset-password" element={<PasswordResetPage />} />
						<Route path="/new-password" element={<NewPasswordPage />} />
						<Route path="/email-verification-notice" element={<EmailVerificationNotice />} />
						<Route path="/pending-approval" element={<PendingApprovalPage />} />

						{/* Auth callback route for email verification and password reset */}
						<Route path="/auth/callback" element={<AuthCallback />} />

						{/* Form route for regular users */}
						<Route
							path="/form"
							element={
								<FormRoute>
									<Form />
								</FormRoute>
							}
						/>

						{/* Form sub-routes for Employee users */}
						<Route
							path="/records"
							element={
								<FormRoute>
									<Form />
								</FormRoute>
							}
						/>
						<Route
							path="/doctors"
							element={
								<FormRoute>
									<Form />
								</FormRoute>
							}
						/>
						<Route
							path="/patients"
							element={
								<FormRoute>
									<Form />
								</FormRoute>
							}
						/>
						<Route
							path="/settings"
							element={
								<FormRoute>
									<Form />
								</FormRoute>
							}
						/>

						{/* Default route */}
						<Route path="/" element={<LoginPage />} />

						{/* Protected dashboard routes */}
						<Route
							path="/dashboard"
							element={
								<PrivateRoute requiredRole={undefined}>
									<Layout />
								</PrivateRoute>
							}
						>
							{/* Nested routes that will render in the Outlet */}
							<Route index element={<HomePage />} />
							<Route path="home" element={<HomePage />} />
							<Route path="stats" element={<StatsPage />} />
							<Route path="reports" element={<ReportsPage />} />
							<Route path="users" element={<UsersPage />} />
							<Route path="cases" element={<CasesPage />} />
							<Route path="my-cases" element={<MyCasesPage />} />
							<Route path="settings" element={<SettingsPage />} />
							<Route path="patients" element={<PatientsPage />} />
							<Route path="changelog" element={<ChangelogPage />} />
							<Route path="doctors" element={<DoctorsSection />} />
						</Route>
					</Routes>
				</div>
			</BrowserRouter>
		</QueryClientProvider>
	)
}

export default App
