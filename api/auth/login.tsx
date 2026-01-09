import { supabase } from '../dashboardInfo';

// ---------- Auth Utilities ----------

export const signInWithEmail = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  return { data, error };
};

export const signInWithGoogle = async () => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
  });
  if (error) throw error;
  return data;
};

export const signInWithApple = async () => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'apple'
  });
  if (error) {
    console.error('Apple sign-in error:', error);
    throw new Error(error.message || 'Apple sign-in failed');
  }
  return data;
};

export interface OnboardingParams {
  email: string
  password: string
  selectedTeam: string | null
  accountPlan: string
  displayName: string 
}

export const handleContinueToSupabase = async (
  params: OnboardingParams
): Promise<{ success: boolean; error?: string }> => {
  const { email, password, selectedTeam, displayName, accountPlan } = params

  // Step 1: Create user account
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        displayName: displayName || null,
      },
    },
  })

  if (signUpError) {
    console.error("Sign-up error:", signUpError)
    return { success: false, error: signUpError.message }
  }

  const user = signUpData.user
  if (!user) {
    return { success: false, error: "User creation failed." }
  }

  // Step 2: Save onboarding data
  const teamData = {
    id: user.id,
    currentTeam: selectedTeam || null,
    accountType: accountPlan,
  }

  const { error: insertError } = await supabase.from("user_teams").upsert(teamData)

  if (insertError) {
    console.error("Error saving onboarding info:", insertError)
    return { success: false, error: insertError.message }
  }

  return { success: true }
}