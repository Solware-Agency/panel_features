import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@app/providers/AuthContext'
import { useUserProfile } from './useUserProfile'

interface UseSecureRedirectOptions {
  /** Whether to redirect immediately on mount */
  redirectOnMount?: boolean
  /** Custom redirect paths */
  ownerPath?: string
  employeePath?: string
  /** Callback when redirect is about to happen */
  onRedirect?: (role: string, path: string) => void
}

interface UseSecureRedirectReturn {
  isRedirecting: boolean
  redirectUser: () => void
  canAccess: (requiredRole?: 'owner' | 'employee') => boolean
}

/**
 * Custom hook for secure role-based redirects
 * Handles user authentication, email verification, and role-based routing
 */
export const useSecureRedirect = (options: UseSecureRedirectOptions = {}): UseSecureRedirectReturn => {
  const {
    redirectOnMount = true,
    ownerPath = '/dashboard/home',
    employeePath = '/form',
    onRedirect,
  } = options

  const navigate = useNavigate()
  const { user, loading: authLoading } = useAuth()
  const { profile, isLoading: profileLoading, error: profileError } = useUserProfile()
  const [isRedirecting, setIsRedirecting] = useState(false)

  /**
   * Performs the actual redirect based on user role
   */
  const redirectUser = () => {
    // Don't redirect if still loading
    if (authLoading || profileLoading || isRedirecting) {
      console.log('Redirect skipped - still loading or already redirecting')
      return
    }

    // Don't redirect if no user
    if (!user) {
      console.log('Redirect skipped - no user')
      return
    }

    // Check if email is verified
    if (!user.email_confirmed_at) {
      console.log('Email not confirmed, redirecting to verification notice')
      setIsRedirecting(true)
      navigate('/email-verification-notice', { replace: true })
      setTimeout(() => setIsRedirecting(false), 500)
      return
    }

    // Don't redirect if profile has error or is missing
    if (profileError || !profile) {
      console.warn('Redirect skipped - profile error or missing:', profileError)
      return
    }

    // Check if user is approved - FIXED: Only redirect to pending approval if estado is explicitly "pendiente"
    if (profile.estado === 'pendiente') {
      console.log('User not approved, redirecting to pending approval page')
      setIsRedirecting(true)
      navigate('/pending-approval', { replace: true })
      setTimeout(() => setIsRedirecting(false), 500)
      return
    }

    setIsRedirecting(true)

    // Determine redirect path based on role
    const isOwner = profile.role === 'owner'
    const redirectPath = isOwner ? ownerPath : employeePath

    console.log(`Redirecting user with role "${profile.role}" to: ${redirectPath}`)
    
    // Call callback if provided
    onRedirect?.(profile.role, redirectPath)

    // Perform redirect
    navigate(redirectPath, { replace: true })
    
    // Reset redirecting state after a short delay
    setTimeout(() => setIsRedirecting(false), 500)
  }

  /**
   * Checks if user can access a specific role-protected route
   */
  const canAccess = (requiredRole?: 'owner' | 'employee'): boolean => {
    if (!user || !profile || !user.email_confirmed_at || profileError) {
      return false
    }
    
    // FIXED: Only block access if estado is explicitly "pendiente"
    if (profile.estado === 'pendiente') {
      return false
    }

    if (!requiredRole) {
      return true // No specific role required
    }

    return profile.role === requiredRole
  }

  // Auto-redirect on mount if enabled and all data is ready
  useEffect(() => {
    if (
      redirectOnMount && 
      !authLoading && 
      !profileLoading && 
      !isRedirecting &&
      user && 
      profile && 
      !profileError
    ) {
      redirectUser()
    }
  }, [redirectOnMount, authLoading, profileLoading, user, profile, profileError, isRedirecting])

  return {
    isRedirecting,
    redirectUser,
    canAccess,
  }
}