import { useState, useEffect } from "react"
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

// Cache
const profileCache = { userProfile: null as UserProfile | null }

export const useUserProfile = (isLoggedIn: boolean) => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchUserProfile = async () => {
    if (!isLoggedIn) {
      setLoading(false)
      return
    }

    if (profileCache.userProfile) {
      setUserProfile(profileCache.userProfile)
      setLoading(false)
      return
    }

    try {
      const teamNumber = await getCurrentUserTeam()
      const teamAccountRole = await getCurrentUserRole()
      const image = await getImage(teamNumber || -1)
      const name = await getName()
      
      let profile: UserProfile

      if (teamNumber) {
        const teamName = await fetchTeamName(teamNumber)
        profile = {
          team_number: "#" + teamNumber.toString(),
          team_name: teamName,
          team_role: teamAccountRole ?? undefined,
          profile_picture: image ?? undefined,
          display_name: name,
        }
      } else {
        profile = {
          display_name: name ?? undefined,
          team_role: "Select Team",
          profile_picture: image ?? undefined,
        }
      }

      profileCache.userProfile = profile
      setUserProfile(profile)
    } catch (error) {
      console.error("Error fetching user profile:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUserProfile()
  }, [isLoggedIn])

  return {
    userProfile,
    loading,
    profileCache,
    refetchProfile: fetchUserProfile,
  }
}