import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, Animated, ScrollView } from 'react-native';
import LeftSidebar from '@/components/leftSidebar';
import HeaderBar from '@/components/header';
import { useFonts } from 'expo-font';
import TRanks from '@/screens/tranks';
import TAuto from '@/screens/tauto';
import TTele from '@/screens/ttele';
import TEndgame from '@/screens/tendgame';
import MRanks from '@/screens/mranks';
import Qual from '@/screens/qual';
import Age from '@/screens/age';
import IntoTheDeep from '@/screens/intothedeep';
import Premier from '@/screens/premier';
import Finals from '@/screens/finals';
import Footer from '@/components/footer';
import App from '@/screens/app';
import Discord from '@/screens/discord';
import ScoutSheet from '@/screens/scoutSheet';

export default function Layout({ children }: { children: React.ReactNode }) {
  const [fontsLoaded] = useFonts({
    InterRegular: require('@/assets/fonts/Inter/static/Inter_18pt-Thin.ttf'),
  });

  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [activePage, setActivePage] = useState('DIVE');
  const sidebarWidth = useRef(new Animated.Value(180)).current;

  const renderPage = () => {
    switch (activePage) {
      case 'Teams':
        return <TRanks />;
      case 'Matches':
        return <MRanks />;
      case 'Auto':
        return <TAuto />;
      case 'TeleOP':
        return <TTele />;
      case 'Endgame':
        return <TEndgame />;
      case 'Qualifiers':
        return <Qual />;
      case 'Premier':
        return <Premier />;
      case 'Finals':
        return <Finals />;
      case 'AGE':
        return <Age />;
      case 'DIVE':
        return <IntoTheDeep />;
      case 'App':
        return <App />;
      case 'Discord':
        return <Discord />;
      case 'ScoutSheet':
        return <ScoutSheet />;
      default:
        return <TRanks />;
    }
  };

  useEffect(() => {
    Animated.timing(sidebarWidth, {
      toValue: sidebarVisible ? 209 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [sidebarVisible]);

  if (!fontsLoaded) return null;

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.sidebar, { width: sidebarWidth }]}>
        {sidebarVisible && <LeftSidebar navigateToPage={setActivePage} />}
      </Animated.View>

      <View style={styles.contentArea}>
        <HeaderBar toggleSidebar={() => setSidebarVisible(!sidebarVisible)} currentPage={activePage}/>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.pageContent}>
            {renderPage()}
            {children}
          </View>
          <Footer />
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  sidebar: {
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  contentArea: {
    flex: 1,
    flexDirection: 'column',
  },
  pageContent: {
    flex: 1,
    padding: 20,
        backgroundColor: '#fff',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'space-between',
  },
});