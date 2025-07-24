import { useState, useEffect } from 'react'
import { getUserProfile, type UserProfile } from '@lib/supabase/auth'
import { useAuth } from '@app/providers/AuthContext'
import { supabase } from '@lib/supabase/config'

interface UseUserProfileReturn {
  profile: UserProfile | null
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
}

/**
 * Custom hook to fetch and manage user profile data
 * Automatically fetches profile when user changes and handles loading/error states
 */
export const useUserProfile = (): UseUserProfileReturn => {
  const { user, loading: authLoading } = useAuth()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasAttemptedFetch, setHasAttemptedFetch] = useState(false)

  const fetchProfile = async () => {
    // Don't fetch if auth is still loading or no user
    if (authLoading || !user?.id) {
      return
    }

    // Don't fetch if already attempted for this user
    if (hasAttemptedFetch && profile?.id === user.id) {
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      console.log('Fetching profile for user:', user.id)
      const userProfile = await getUserProfile(user.id)
      
      if (userProfile) {
        console.log('Profile fetched successfully:', userProfile)
        
        // Check if user metadata has display_name but profile doesn't
        if (user.user_metadata?.display_name && !userProfile.display_name) {
          console.log('Syncing display_name from user metadata to profile')
          
          // Update profile with display_name from user metadata
          const { error: updateError } = await supabase
            .from('profiles')
            .update({ display_name: user.user_metadata.display_name })
            .eq('id', user.id)
            
          if (updateError) {
            console.error('Error syncing display_name to profile:', updateError)
          } else {
            // Update local profile object
            userProfile.display_name = user.user_metadata.display_name
          }
        }
        
        // Check if profile has display_name but user metadata doesn't
        if (userProfile.display_name && (!user.user_metadata?.display_name || user.user_metadata.display_name !== userProfile.display_name)) {
          console.log('Syncing display_name from profile to user metadata')
          
          // Update user metadata with display_name from profile
          const { error: updateError } = await supabase.auth.updateUser({
            data: { display_name: userProfile.display_name }
          })
          
          if (updateError) {
            console.error('Error syncing display_name to user metadata:', updateError)
          }
        }
        
        setProfile(userProfile)
        setError(null)
      } else {
        console.warn('No profile found for user:', user.id)
        setError('No se encontró el perfil del usuario')
        setProfile(null)
      }
    } catch (err) {
      console.error('Error fetching user profile:', err)
      setError('Error al cargar el perfil del usuario')
      setProfile(null)
    } finally {
      setIsLoading(false)
      setHasAttemptedFetch(true)
    }
  }

  // Reset state when user changes
  useEffect(() => {
    if (!user) {
      setProfile(null)
      setError(null)
      setIsLoading(false)
      setHasAttemptedFetch(false)
      return
    }

    // If user changed, reset and fetch new profile
    if (profile && profile.id !== user.id) {
      setProfile(null)
      setError(null)
      setHasAttemptedFetch(false)
    }

    // Only fetch if we haven't attempted yet for this user
    if (!hasAttemptedFetch && !authLoading) {
      fetchProfile()
    }
  }, [user?.id, authLoading])

  const refetch = async () => {
    setHasAttemptedFetch(false)
    await fetchProfile()
  }

  return {
    profile,
    isLoading: authLoading || isLoading,
    error,
    refetch,
  }
}