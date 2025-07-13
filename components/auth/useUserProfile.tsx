import { useState, useEffect, useCallback, useRef } from "react"
import {
  fetchTeamName,
  getCurrentUserRole,
  getCurrentUserTeam,
  getImage,
  getName,
} from "@/api/dashboardInfo"

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
      const [teamNumber, teamAccountRole, name] = await Promise.all([
        getCurrentUserTeam(),
        getCurrentUserRole(),
        getName()
      ])

      let profile: UserProfile
      if (teamNumber) {
        const [teamName, image] = await Promise.all([
          fetchTeamName(teamNumber),
          getImage(teamNumber)
        ])
        profile = {
          team_number: "#" + teamNumber.toString(),
          team_name: teamName,
          team_role: teamAccountRole ?? undefined,
          profile_picture: image ?? undefined,
          display_name: name ?? undefined,
        }
      } else {
        const image = await getImage(-1)
        profile = {
          display_name: name,
          team_role: teamAccountRole ?? "Player",
          profile_picture: image ?? undefined,
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
      if (isMountedRef.current) {
        // Don't clear existing data on error, just stop loading
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