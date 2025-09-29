import {
  fetchTeamName,
  getCurrentUserRole,
  getCurrentUserTeam,
  getImage,
  getName,
} from "@/api/dashboardInfo"
import { useCallback, useEffect, useRef, useState } from "react"

export type UserProfile = {
  team_number?: string
  display_name?: string
  profile_picture?: string
  team_name?: string
  team_role?: string
}

// Simplified cache - just store the data, no complex logic
let profileCache: UserProfile | null = null

export const useUserProfile = (isLoggedIn: boolean, refreshInterval: number = 5000) => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(profileCache)
  const [loading, setLoading] = useState(!profileCache) // Only show loading if no cached data
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const isMountedRef = useRef(true)

  const fetchUserProfile = useCallback(async (isInitialLoad = false) => {
    if (!isLoggedIn) {
      setUserProfile(null)
      setLoading(false)
      profileCache = null
      return
    }

    // Only show loading on initial load when there's no cached data
    if (isInitialLoad && !profileCache) {
      setLoading(true)
    }

    try {
      // Safely attempt to get user data, ignoring errors
      let teamNumber: number | null = null
      let teamAccountRole: string | null = null
      let name: string | null = null

      try {
        teamNumber = await getCurrentUserTeam()
      } catch (error) {
        console.warn("Could not fetch user team (this is ok for spectators):", error)
      }

      try {
        teamAccountRole = await getCurrentUserRole()
      } catch (error) {
        console.warn("Could not fetch user role (this is ok for spectators):", error)
      }

      try {
        name = await getName()
      } catch (error) {
        console.warn("Could not fetch user name (this is ok):", error)
      }

      let profile: UserProfile
      if (teamNumber && teamNumber > 0) {
        // User has a valid team - try to get team info
        let teamName: string | null = null
        let image: string | null = null

        try {
          const fetchedTeamName = await fetchTeamName(teamNumber, 2024)
          teamName = fetchedTeamName || null
        } catch (error) {
          console.warn("Could not fetch team name:", error)
        }

        try {
          const fetchedImage = await getImage(teamNumber, 2024)
          image = fetchedImage || null
        } catch (error) {
          console.warn("Could not fetch team image:", error)
        }

        profile = {
          team_number: "#" + teamNumber.toString(),
          team_name: teamName || undefined,
          team_role: teamAccountRole || undefined,
          profile_picture: image || undefined,
          display_name: name || undefined,
        }
      } else {
        // User is a spectator - minimal profile
        let image: string | null = null
        
        try {
          const fetchedImage = await getImage(-1, 2024)
          image = fetchedImage || null
        } catch (error) {
          console.warn("Could not fetch default image:", error)
        }

        profile = {
          display_name: name || undefined,
          team_role: teamAccountRole || undefined,
          profile_picture: image || undefined,
        }
      }

      // Update cache and state
      profileCache = profile
      if (isMountedRef.current) {
        setUserProfile(profile)
        setLoading(false)
      }
    } catch (error) {
      console.error("Error fetching user profile:", error)
      
      // Create a minimal fallback profile so the UI doesn't break
      const fallbackProfile: UserProfile = {
        display_name: undefined,
        team_role: undefined,
        profile_picture: undefined,
      }
      
      profileCache = fallbackProfile
      if (isMountedRef.current) {
        setUserProfile(fallbackProfile)
        setLoading(false)
      }
    }
  }, [isLoggedIn])

  const clearCache = useCallback(() => {
    profileCache = null
    setUserProfile(null)
  }, [])

  const updateCache = useCallback((updates: Partial<UserProfile>) => {
    if (profileCache) {
      profileCache = { ...profileCache, ...updates }
      setUserProfile(profileCache)
    }
  }, [])

  const forceRefresh = useCallback(() => {
    fetchUserProfile(false)
  }, [fetchUserProfile])

  // Effect to handle login state changes and initial fetch
  useEffect(() => {
    if (!isLoggedIn) {
      // Clear everything when logged out
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      clearCache()
      setLoading(false)
      return
    }

    // Initial fetch on login
    fetchUserProfile(true)

    // Set up background refresh interval (no loading state)
    intervalRef.current = setInterval(() => {
      fetchUserProfile(false) // Background refresh, no loading
    }, refreshInterval)

    // Cleanup interval on unmount or login state change
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [isLoggedIn, refreshInterval, fetchUserProfile])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  return {
    userProfile,
    loading,
    refetchProfile: forceRefresh,
    clearCache,
    updateCache,
  }
}