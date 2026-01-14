import Footer from '@/components/footer';
import HeaderBar from '@/components/header';
import LeftSidebar from '@/components/leftSidebar';
import { DarkModeProvider, useDarkMode } from '@/context/DarkModeContext';
import { useFonts } from 'expo-font';
import { router, Slot, usePathname } from 'expo-router';
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  View,
  Platform
} from 'react-native';
import Cancel from '../assets/icons/x-circle.svg';

export const PageTitleContext = createContext<{
  customSuffix?: string;
  setPageTitleInfo: (info: { customSuffix?: string }) => void;
}>({
  setPageTitleInfo: () => {},
});

export function usePageTitleContext() {
  return useContext(PageTitleContext);
}

export default function Layout() {
  const [customSuffix, setCustomSuffix] = useState<string>();

  return (
    <DarkModeProvider>
      <PageTitleContext.Provider
        value={{
          customSuffix,
          setPageTitleInfo: (info) => {
            setCustomSuffix(info.customSuffix);
          },
        }}
      >
        <InnerLayout />
      </PageTitleContext.Provider>
    </DarkModeProvider>
  );
}

function InnerLayout() {
  const { isDarkMode, isLoading } = useDarkMode(); 
  const [fontsLoaded] = useFonts({
    InterRegular: require('@/assets/fonts/Inter/static/Inter_18pt-Thin.ttf'),
  });

  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [screenWidth, setScreenWidth] = useState(Dimensions.get('window').width);
  const pathname = usePathname();
  const [refreshing, setRefreshing] = useState(false);
  const { customSuffix } = usePageTitleContext();
  
  const theme = {
    backgroundColor: isDarkMode ? 'rgba(42, 42, 42, 1)' : '#F8FAFC',
    contentBackground: isDarkMode ? 'rgba(42, 42, 42, 0.8)' : '#F8FAFC',
    pageBackground: isDarkMode ? 'rgba(42, 42, 42, 1)' : '#fff',
    sidebarBackground: isDarkMode ? 'rgba(42, 42, 42, 1)' : '#fff',
    closeButtonBackground: isDarkMode ? 'rgba(42, 42, 42, 0.8)' : '#fff',
    closeButtonTouchBackground: isDarkMode ? 'rgba(42, 42, 42, 1)' : '#fff',
    iconFill: isDarkMode ? '#fff' : '#000',
  };

  // FIX: Safari background color sync
  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      document.body.style.backgroundColor = theme.backgroundColor;
      document.documentElement.style.backgroundColor = theme.backgroundColor;
      
      // Update meta theme-color for Safari mobile address bar
      const metaTheme = document.querySelector('meta[name="theme-color"]');
      if (metaTheme) {
        metaTheme.setAttribute('content', theme.backgroundColor);
      }
    }
  }, [isDarkMode, theme.backgroundColor]);

  const routeLabels: Record<string, string> = {
    index: 'Home', age: 'AGE', intothedeep: 'DIVE', energize: 'ENERGIZE',
    forward: 'FORWARD', gameChangers: 'GAMECHANGERS', inshow: 'INSHOW',
    rise: 'RISE', discord: 'Discord', app: 'App', ScoutSheet: 'ScoutSheet',
    tranks: 'Teams', tauto: 'Auto', ttele: 'TeleOp', tendgame: 'Endgame',
    mranks: 'Matches', qual: 'Qualifiers', finals: 'Finals', premier: 'Premier',
    tac: 'Terms & Conditions', privacy: 'Privacy Policy', systemstatus: 'Systems Status',
  };
  
  const currentPage = routeLabels[pathname?.split('/').pop() || ''] || '';
  const sidebarTranslateX = useRef(new Animated.Value(sidebarVisible ? 0 : -209)).current;
  const overlayOpacity = useRef(new Animated.Value(sidebarVisible ? 1 : 0)).current;
  const sidebarWidth = useRef(new Animated.Value(180)).current;

  useEffect(() => {
    const pathSegments = pathname?.split('/').filter(Boolean) || [];
    const lastSegment = pathSegments[pathSegments.length - 1] || 'index';
    const pageTitle = routeLabels[lastSegment] || 'ARES';
    const isDashboard = pathname?.includes('/dashboards/');
    const isRankingsPage = ['tranks', 'mranks', 'tauto', 'ttele', 'tendgame'].includes(lastSegment);
    
    let fullTitle = pageTitle;
    if (isDashboard) {
      fullTitle = customSuffix ? `${customSuffix}` : 'Team';
    } else if (isRankingsPage && customSuffix) {
      fullTitle += ` - ${customSuffix}`;
    }
    
    if (typeof document !== 'undefined') {
      document.title = `${fullTitle} | ARES`;
    }
  }, [pathname, customSuffix]);

  const isDesktop = screenWidth > 800;

  const onRefresh = async () => {
    setRefreshing(true);
    router.replace(usePathname() as any);
    setRefreshing(false);
  };

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
  }, [sidebarVisible, isDesktop]);

  useEffect(() => {
    if (!isDesktop) {
      Animated.parallel([
        Animated.timing(sidebarTranslateX, {
          toValue: sidebarVisible ? 0 : -209,
          duration: 200,
          useNativeDriver: false,
        }),
        Animated.timing(overlayOpacity, {
          toValue: sidebarVisible ? 1 : 0,
          duration: 200,
          useNativeDriver: false,
        }),
      ]).start();
    }
  }, [sidebarVisible, isDesktop]);

  if (!fontsLoaded || isLoading) {
    return <View style={[styles.loadingContainer, { backgroundColor: theme.backgroundColor }]} />;
  }

  // barStyle logic fixed: 'light-content' shows white text on dark background
  const barStyle = isDarkMode ? 'light-content' : 'dark-content';

  if (pathname.includes('/auth')) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.backgroundColor }}>
        <StatusBar barStyle={barStyle} backgroundColor={theme.backgroundColor} />
        <Slot />
      </View>
    );
  }
  
  if (isDesktop) {
    return (
      <View style={[styles2.container, { backgroundColor: theme.backgroundColor }]}>
        <StatusBar barStyle={barStyle} backgroundColor={theme.backgroundColor} />
        <Animated.View style={[styles2.sidebar, { width: sidebarWidth, backgroundColor: theme.sidebarBackground }]}>
          {sidebarVisible && <LeftSidebar close={() => setSidebarVisible(false)} />}
        </Animated.View>

        <View style={[styles2.contentArea, { backgroundColor: theme.contentBackground }]}>
          <HeaderBar toggleSidebar={() => setSidebarVisible(!sidebarVisible)} currentPage={currentPage} />
          <ScrollView 
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            contentContainerStyle={[styles2.scrollContent, { backgroundColor: theme.backgroundColor }]}
          >
            <View style={[styles.pageContent, { backgroundColor: theme.pageBackground }]}>
              <Slot />
            </View>
            <Footer />
          </ScrollView>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundColor }]}>
      <StatusBar barStyle={barStyle} backgroundColor={theme.backgroundColor} />
      <View style={[styles.contentArea, { backgroundColor: theme.backgroundColor }]}>
        <HeaderBar toggleSidebar={() => setSidebarVisible(!sidebarVisible)} currentPage={currentPage} />
        <ScrollView 
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={[styles.scrollContent, { backgroundColor: theme.backgroundColor }]}
        >
          <View style={[styles.pageContent, { backgroundColor: theme.pageBackground }]}>
            <Slot />
          </View>
          <Footer />
        </ScrollView>
      </View>

      {sidebarVisible && (
        <Animated.View style={[styles.blurOverlay, { opacity: overlayOpacity }]}>
          <TouchableOpacity style={{ flex: 1 }} onPress={() => setSidebarVisible(false)} activeOpacity={1} />
        </Animated.View>
      )}

      <Animated.View style={[styles.sidebar, { transform: [{ translateX: sidebarTranslateX }], backgroundColor: theme.sidebarBackground }]}>
        <LeftSidebar close={() => setSidebarVisible(false)} />
        {sidebarVisible && (
          <Animated.View style={[styles.closeButton, { opacity: overlayOpacity, backgroundColor: theme.closeButtonBackground }]}>
            <TouchableOpacity style={[styles.closeButtonTouch, { backgroundColor: theme.closeButtonTouchBackground }]} onPress={() => setSidebarVisible(false)}>
              <Cancel width={16} height={16} fill={theme.iconFill} />
            </TouchableOpacity>
          </Animated.View>
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { flex: 1, flexDirection: 'row' },
  contentArea: { flex: 1, flexDirection: 'column' },
  pageContent: { flex: 1, padding: 15 },
  scrollContent: { flexGrow: 1, justifyContent: 'space-between' },
  sidebar: { position: 'absolute', top: 0, left: 0, width: 209, height: '100%', zIndex: 1000 },
  blurOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.3)', zIndex: 999 },
  closeButton: { position: 'absolute', top: 10, right: -40, zIndex: 1001, borderRadius: 6 },
  closeButtonTouch: { width: 30, height: 30, borderRadius: 6, justifyContent: 'center', alignItems: 'center' },
});

const styles2 = StyleSheet.create({
  container: { flexDirection: 'row', flex: 1 },
  sidebar: { overflow: 'hidden' },
  contentArea: { flex: 1, flexDirection: 'column' },
  pageContent: { flex: 1, padding: 20 },
  scrollContent: { flexGrow: 1, justifyContent: 'space-between' },
});