import * as SplashScreen from 'expo-splash-screen';
import { View, StyleSheet } from 'react-native';
import LandingPage from '@/components/welcome';
import { useDarkMode } from '@/context/DarkModeContext';

SplashScreen.preventAutoHideAsync();

export default function Index() {
  const { isDarkMode } = useDarkMode();
  return (
    <View style={styles.container}>
      <LandingPage darkMode={isDarkMode}/>
    </View>
  ); 
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
  },
  loadingOverlay: {
    flex: 1,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  loadingContainer: {
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#3B82F6',
    fontWeight: '600',
  },
});