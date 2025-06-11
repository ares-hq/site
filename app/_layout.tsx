import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, Animated, ScrollView, TouchableOpacity, Text, Dimensions } from 'react-native';
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

  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [activePage, setActivePage] = useState('DIVE');
  const [screenWidth, setScreenWidth] = useState(Dimensions.get('window').width);
  
  const sidebarTranslateX = useRef(new Animated.Value(sidebarVisible ? 0 : -209)).current;
  const overlayOpacity = useRef(new Animated.Value(sidebarVisible ? 1 : 0)).current;
  const sidebarWidth = useRef(new Animated.Value(180)).current;

  const isDesktop = screenWidth > 800;

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenWidth(window.width);
    });

    return () => subscription?.remove();
  }, []);

  useEffect(() => {
    if (isDesktop) {
      Animated.timing(sidebarWidth, {
        toValue: sidebarVisible ? 209 : 0,
        duration: 200,
        useNativeDriver: false,
      }).start();
    }
  }, [sidebarVisible, isDesktop, sidebarWidth]);

  useEffect(() => {
    if (!isDesktop) {
      Animated.parallel([
        Animated.timing(sidebarTranslateX, {
          toValue: sidebarVisible ? 0 : -209,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(overlayOpacity, {
          toValue: sidebarVisible ? 1 : 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [sidebarVisible, isDesktop, sidebarTranslateX, overlayOpacity]);

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

  if (!fontsLoaded) return null;

  if (isDesktop) {
    return (
      <View style={styles2.container}>
        <Animated.View style={[styles2.sidebar, { width: sidebarWidth }]}>
          {sidebarVisible && <LeftSidebar navigateToPage={setActivePage} />}
        </Animated.View>

        <View style={styles2.contentArea}>
          <HeaderBar 
            toggleSidebar={() => setSidebarVisible(!sidebarVisible)} 
            currentPage={activePage}
          />
          <ScrollView contentContainerStyle={styles2.scrollContent}>
            <View style={styles2.pageContent}>
              {renderPage()}
              {children}
            </View>
            <Footer />
          </ScrollView>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Main content area */}
      <View style={styles.contentArea}>
        <HeaderBar 
          toggleSidebar={() => setSidebarVisible(!sidebarVisible)} 
          currentPage={activePage}
        />
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.pageContent}>
            {renderPage()}
            {children}
          </View>
          <Footer />
        </ScrollView>
      </View>

      {/* Blur overlay - only visible when sidebar is open */}
      {sidebarVisible && (
        <Animated.View 
          style={[
            styles.blurOverlay, 
            { opacity: overlayOpacity }
          ]} 
          pointerEvents={sidebarVisible ? 'auto' : 'none'}
        />
      )}

      {/* Sidebar - positioned absolutely to overlay content */}
      <Animated.View 
        style={[
          styles.sidebar, 
          { transform: [{ translateX: sidebarTranslateX }] }
        ]}
      >
        <LeftSidebar navigateToPage={setActivePage} />
        
        {/* Floating close button */}
        {sidebarVisible && (
          <Animated.View 
            style={[
              styles.closeButton,
              { opacity: overlayOpacity }
            ]}
          >
            <TouchableOpacity
              style={styles.closeButtonTouch}
              onPress={() => setSidebarVisible(false)}
              activeOpacity={0.7}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </Animated.View>
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
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
  sidebar: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 209,
    height: '100%',
    backgroundColor: '#fff',
    zIndex: 1000,
    elevation: 10, // Android shadow
  },
  blurOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    zIndex: 999,
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: -45,
    zIndex: 1001,
  },
  closeButtonTouch: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
  },
});

const styles2 = StyleSheet.create({
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