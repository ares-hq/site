// StatusScreen.tsx (Enhanced with real API monitoring and Dark Mode)
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Pressable,
} from 'react-native';
import { useDarkMode } from '@/context/DarkModeContext'; // Add this import

interface ServiceStatus {
  name: string;
  url?: string;
  status: 'Checking...' | 'Operational' | 'Degraded' | 'Down';
  uptime: number;
  responseTime: number | null;
  lastChecked: string;
  errorMessage?: string;
  statusHistory: boolean[]; // Last 24 checks for timeline
}

interface ServiceConfig {
  name: string;
  url: string;
  checkType: 'HEAD' | 'GET' | 'POST' | 'API_HEALTH';
  healthEndpoint?: string;
  expectedStatus?: number;
  timeout?: number;
}

const services: ServiceConfig[] = [
  { 
    name: 'ARES Frontend', 
    url: 'https://ares-bot.com',
    checkType: 'HEAD',
    timeout: 10000
  },
  { 
    name: 'ARES API (Query)', 
    url: 'https://api.ares-bot.com',
    checkType: 'HEAD',
    healthEndpoint: 'https://api.ares-bot.com/',
    timeout: 8000
  },
  { 
    name: 'ARES API (Studio)', 
    url: 'https://studio.ares-bot.com',
    checkType: 'GET',
    timeout: 8000
  },
  { 
    name: 'Cloudflare', 
    url: 'https://www.cloudflarestatus.com/api',
    checkType: 'GET',
    timeout: 5000
  },
];

const REFRESH_INTERVAL = 120000;
const MAX_HISTORY_LENGTH = 24;

const StatusScreen = () => {
  const { isDarkMode } = useDarkMode(); // Add dark mode context
  const [statuses, setStatuses] = useState<ServiceStatus[]>([]);
  const [countdown, setCountdown] = useState(REFRESH_INTERVAL / 1000);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null);

  useEffect(() => {
    const initialStatuses: ServiceStatus[] = services.map(service => ({
      name: service.name,
      url: service.url,
      status: 'Checking...',
      uptime: 0,
      responseTime: null,
      lastChecked: 'Never',
      statusHistory: []
    }));
    setStatuses(initialStatuses);
  }, []);

  const checkServiceHealth = async (service: ServiceConfig): Promise<Partial<ServiceStatus>> => {
    const startTime = performance.now();
    
    try {
      let response: Response;
      
      switch (service.checkType) {
        case 'HEAD':
          response = await fetch(service.url, {
            method: 'HEAD',
            cache: 'no-store',
            signal: AbortSignal.timeout(service.timeout || 10000)
          });
          break;
          
        case 'GET':
          response = await fetch(service.url, {
            method: 'GET',
            redirect: 'manual',
            cache: 'no-store',
            signal: AbortSignal.timeout(service.timeout || 10000)
          });
          break;
          
        default:
          response = await fetch(service.url, {
            method: 'GET',
            cache: 'no-store',
            signal: AbortSignal.timeout(service.timeout || 10000)
          });
      }

      const responseTime = Math.round(performance.now() - startTime);
      
      if (response.ok || response.status === 401 || response.status === 0) {
        return {
          status: 'Operational',
          responseTime,
          uptime: 100
        };
      } else if (response.status >= 200 && response.status < 400) {
        return {
          status: 'Operational',
          responseTime,
          uptime: 100
        };
      } else if (response.status === 401 || response.status === 403) {
        return {
          status: 'Operational',
          responseTime,
          uptime: 100,
          errorMessage: `Auth required (${response.status})`
        };
      } else if (response.status >= 400 && response.status < 500) {
        return {
          status: 'Degraded',
          responseTime,
          uptime: 75,
          errorMessage: `HTTP ${response.status}`
        };
      } else if (response.status >= 500) {
        return {
          status: 'Down',
          responseTime,
          uptime: 0,
          errorMessage: `HTTP ${response.status}`
        };
      } else {
        return {
          status: 'Degraded',
          responseTime,
          uptime: 50,
          errorMessage: `HTTP ${response.status}`
        };
      }
      
    } catch (error) {
      const responseTime = Math.round(performance.now() - startTime);
      let errorMessage = 'Network error';
      
      if (error instanceof Error) {
        if (error.name === 'TimeoutError') {
          errorMessage = 'Request timeout';
        } else if (error.message.includes('Failed to fetch')) {
          errorMessage = 'Connection failed';
        } else {
          errorMessage = error.message;
        }
      }
      
      return {
        status: 'Down',
        responseTime: responseTime > 0 ? responseTime : null,
        uptime: 0,
        errorMessage
      };
    }
  };

  const fetchAllStatuses = useCallback(async () => {
    setIsRefreshing(true);
    const now = new Date();
    const timeString = now.toLocaleTimeString();

    try {
      const statusChecks = services.map(async (service) => {
        const result = await checkServiceHealth(service);
        
        return (prevStatus: ServiceStatus) => {
          if (prevStatus.name !== service.name) return prevStatus;
          
          const newHistory = [...prevStatus.statusHistory];
          newHistory.push(result.status === 'Operational');
          if (newHistory.length > MAX_HISTORY_LENGTH) {
            newHistory.shift();
          }
          
          return {
            ...prevStatus,
            ...result,
            lastChecked: timeString,
            statusHistory: newHistory
          };
        };
      });

      const updates = await Promise.all(statusChecks);
      
      setStatuses(prev => 
        prev.map(status => {
          const update = updates.find(u => {
            const testResult = u(status);
            return testResult !== status;
          });
          return update ? update(status) : status;
        })
      );

      setLastUpdateTime(now);
      setCountdown(REFRESH_INTERVAL / 1000);
      
    } catch (error) {
      console.error('Error fetching statuses:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAllStatuses();
    
    const refreshTimer = setInterval(fetchAllStatuses, REFRESH_INTERVAL);
    const countdownTimer = setInterval(() => {
      setCountdown(prev => prev > 0 ? prev - 1 : 0);
    }, 1000);

    return () => {
      clearInterval(refreshTimer);
      clearInterval(countdownTimer);
    };
  }, [fetchAllStatuses]);

  const getOverallStatus = (): { status: string; color: string } => {
    const operationalCount = statuses.filter(s => s.status === 'Operational').length;
    const degradedCount = statuses.filter(s => s.status === 'Degraded').length;
    const downCount = statuses.filter(s => s.status === 'Down').length;
    
    if (downCount > 0) {
      return { status: 'Service Disruption', color: isDarkMode ? '#F87171' : '#B91C1C' };
    } else if (degradedCount > 0) {
      return { status: 'Partial Outage', color: isDarkMode ? '#FBBF24' : '#D97706' };
    } else if (operationalCount === statuses.length && statuses.length > 0) {
      return { status: 'All Systems Operational', color: isDarkMode ? '#34D399' : '#15803D' };
    } else {
      return { status: 'Checking Systems...', color: isDarkMode ? '#9CA3AF' : '#6B7280' };
    }
  };

  const formatResponseTime = (time: number | null): string => {
    if (time === null) return 'N/A';
    if (time < 1000) return `${time}ms`;
    return `${(time / 1000).toFixed(1)}s`;
  };

  const overallStatus = getOverallStatus();

  const HoverLink = ({ name, url }: { name: string; url?: string }) => {
    const [hovered, setHovered] = useState(false);

    return (
      <Pressable
        onPress={() => Linking.openURL(url || '#')}
        onHoverIn={() => setHovered(true)}
        onHoverOut={() => setHovered(false)}
      >
        <Text style={[
          styles.link, 
          { color: isDarkMode ? '#60A5FA' : '#3B82F6' },
          hovered && styles.linkHover
        ]}>
          {name}
        </Text>
      </Pressable>
    );
  };

  const getStatusBadgeColors = (status: string) => {
    if (status === 'Operational') {
      return {
        backgroundColor: isDarkMode ? '#064E3B' : '#DCFCE7',
        textColor: isDarkMode ? '#34D399' : '#15803D'
      };
    } else if (status === 'Degraded') {
      return {
        backgroundColor: isDarkMode ? '#451A03' : '#FEF3C7',
        textColor: isDarkMode ? '#FBBF24' : '#D97706'
      };
    } else {
      return {
        backgroundColor: isDarkMode ? '#7F1D1D' : '#FEE2E2',
        textColor: isDarkMode ? '#F87171' : '#B91C1C'
      };
    }
  };

  return (
    <ScrollView style={[
      styles.container,
      { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : '#F8FAFC' }
    ]}>
      <View style={styles.header}>
        <Text style={[
          styles.title,
          { color: isDarkMode ? '#F9FAFB' : '#111827' }
        ]}>
          System Status
        </Text>
        {isRefreshing && <ActivityIndicator size="small" color={isDarkMode ? '#60A5FA' : '#3B82F6'} />}
      </View>

      <View style={[
        styles.overallBox,
        { backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.04)' : '#F1F5F9' }
      ]}>
        <Text style={[styles.overallStatus, { color: overallStatus.color }]}>
          {overallStatus.status}
        </Text>
      </View>

      {statuses.map((service) => {
        const badgeColors = getStatusBadgeColors(service.status);
        
        return (
          <View key={service.name} style={[
            styles.card,
            { backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.04)' : '#FFFFFF' }
          ]}>
            <View style={styles.cardHeader}>
              <Text style={[
                styles.cardTitle,
                { color: isDarkMode ? '#F9FAFB' : '#1F2937' }
              ]}>
                <HoverLink name={service.name} url={service.url} />
              </Text>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: badgeColors.backgroundColor }
                ]}
              >
                <Text
                  style={{
                    color: badgeColors.textColor,
                    fontWeight: '600',
                    fontSize: 12,
                  }}
                >
                  {service.status}
                </Text>
              </View>
            </View>

            {service.status !== 'Checking...' && (
              <>
                <View style={styles.metricsRow}>
                  <Text style={[
                    styles.metricText,
                    { color: isDarkMode ? '#D1D5DB' : '#6B7280' }
                  ]}>
                    Response: {formatResponseTime(service.responseTime)}
                  </Text>
                  <Text style={[
                    styles.metricText,
                    { color: isDarkMode ? '#D1D5DB' : '#6B7280' }
                  ]}>
                    Uptime: {service.uptime}%
                  </Text>
                </View>

                {service.errorMessage && (
                  <Text style={[
                    styles.errorText,
                    { color: isDarkMode ? '#F87171' : '#EF4444' }
                  ]}>
                    Error: {service.errorMessage}
                  </Text>
                )}
              </>
            )}

            <View style={styles.footerRow}>
              <Text style={[
                styles.footerText,
                { color: isDarkMode ? '#9CA3AF' : '#9CA3AF' }
              ]}>
                Last checked: {service.lastChecked}
              </Text>
            </View>
          </View>
        );
      })}

      <Text style={[
        styles.note,
        { color: isDarkMode ? '#D1D5DB' : '#6B7280' }
      ]}>
        Status history shows the last 12 checks. Green = operational, Red = down.
      </Text>

      <Text style={[
        styles.note,
        { color: isDarkMode ? '#D1D5DB' : '#6B7280' }
      ]}>
        Additional Cloudflare status details at{' '}
        <TouchableOpacity onPress={() => Linking.openURL('https://www.cloudflarestatus.com')}>
          <Text style={[
            styles.link,
            { color: isDarkMode ? '#60A5FA' : '#3B82F6' }
          ]}>
            cloudflarestatus.com
          </Text>
        </TouchableOpacity>
      </Text>

      {lastUpdateTime && (
        <Text style={[
          styles.timestamp,
          { color: isDarkMode ? '#9CA3AF' : '#9CA3AF' }
        ]}>
          Last Updated: {lastUpdateTime.toLocaleString()}
        </Text>
      )}
      
      <Text style={[
        styles.timestamp,
        { color: isDarkMode ? '#9CA3AF' : '#9CA3AF' }
      ]}>
        Next refresh in: {countdown}s
      </Text>

      <TouchableOpacity 
        style={[
          styles.refreshButton,
          { backgroundColor: isDarkMode ? '#4B5563' : '#E5E7EB' },
          isRefreshing && styles.refreshButtonDisabled
        ]} 
        onPress={fetchAllStatuses}
        disabled={isRefreshing}
      >
        <Text style={[
          styles.refreshText,
          { color: isDarkMode ? '#F9FAFB' : '#1F2937' }
        ]}>
          {isRefreshing ? 'Refreshing...' : 'Refresh now'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
  overallBox: {
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
  },
  overallStatus: {
    fontWeight: '600',
    fontSize: 16,
  },
  card: {
    padding: 14,
    borderRadius: 12,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    fontWeight: '600',
    fontSize: 15,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  metricText: {
    fontSize: 12,
    fontWeight: '500',
  },
  linkHover: {
    textDecorationLine: 'underline',
  },
  errorText: {
    fontSize: 11,
    fontStyle: 'italic',
    marginBottom: 6,
  },
  timeline: {
    flexDirection: 'row',
    marginVertical: 8,
    gap: 2,
  },
  timelineBar: {
    width: 4,
    height: 20,
    borderRadius: 2,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  footerText: {
    fontSize: 11,
  },
  note: {
    fontSize: 12,
    marginTop: 8,
    lineHeight: 16,
  },
  link: {
    textDecorationLine: 'none',
  },
  timestamp: {
    fontSize: 12,
    marginTop: 4,
  },
  refreshButton: {
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  refreshButtonDisabled: {
    opacity: 0.6,
  },
  refreshText: {
    fontSize: 13,
    fontWeight: '500',
  },
});

export default StatusScreen;
