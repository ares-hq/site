import { View } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';

SplashScreen.preventAutoHideAsync();

export default function Index() {
  return (
    <View style={{ flex: 1, flexDirection: 'row' }} />
  );
}