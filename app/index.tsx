import * as SplashScreen from 'expo-splash-screen';
import TRanks from './analytics/teams/tranks';
import LandingPage from '@/components/welcome';

SplashScreen.preventAutoHideAsync();

export default function Index() {
  return (
    <>
      <LandingPage />
      <TRanks />
    </>
  );
}