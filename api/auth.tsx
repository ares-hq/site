import { useEffect, useState } from 'react';
import { supabase } from './dashboardInfo';

export function useIsLoggedIn(): boolean {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsLoggedIn(!!session);
    };

    checkSession();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session);
    });

    return () => {
      listener?.subscription.unsubscribe();
    };
  }, []);

  return isLoggedIn;
}

export async function resetPasswordWithEmail(email: string) {
  return await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: 'https://ares-bot.com/auth/signin',
  });
}