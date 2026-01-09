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

export async function getFavoritesForUser(userId: string) {
  const { data, error } = await supabase
    .from('user_teams')
    .select('favorites')
    .eq('id', userId)
    .single();

  if (error || !data?.favorites) {
    return { data: [], error };
  }

  const favoritesArray = data.favorites
    .split(',')
    .map((item: string) => item.trim())
    .filter((item: string) => item.length > 0);

  return { data: favoritesArray, error: null };
}

export async function toggleFavorite(userId: string, item: string) {
  const { data, error } = await supabase
    .from('user_teams')
    .select('favorites')
    .eq('id', userId)
    .single();

  if (error) return { error };

  let favorites: string[] = data?.favorites
    ? data.favorites.split(',').map((s: string) => s.trim()).filter(Boolean)
    : [];

  const index = favorites.indexOf(item);
  if (index > -1) {
    favorites.splice(index, 1);
  } else {
    favorites.push(item);
  }

  const updatedFavorites = favorites.join(',');

  const { error: updateError } = await supabase
    .from('user_teams')
    .update({ favorites: updatedFavorites })
    .eq('id', userId);

  return {
    action: index > -1 ? 'removed' : 'added',
    error: updateError,
  };
}