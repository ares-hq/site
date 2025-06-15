import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';

interface ServiceStatus {
  name: string;
  url?: string;
  status: 'Checking...' | 'Operational' | 'Down';
  uptime: number; // simulate 100%
  lastChecked: string;
}

const services = [
  { name: 'ARES Frontend', url: 'https://ares-bot.com' },
  { name: 'ARES API (Query)', url: 'https://api.ares-bot.com' },
  { name: 'ARES API (Studio)', url: 'https://studio.ares-bot.com' },
  { name: 'Cloudflare', url: 'https://www.cloudflarestatus.com/api/v2/status.json' },
];

const REFRESH_INTERVAL = 120000;

const StatusScreen = () => {
  const [statuses, setStatuses] = useState<ServiceStatus[]>([]);
  const [countdown, setCountdown] = useState(REFRESH_INTERVAL / 1000);

  const fetchStatus = async () => {
    const now = new Date().toLocaleTimeString();

    const updated = await Promise.all(
      services.map(async (s) => {
        if (s.name === 'Cloudflare') {
          try {
            const res = await fetch(s.url!, { cache: 'no-store' });
            const json = await res.json();
            const status: 'Operational' | 'Down' =
              json.status?.indicator === 'none' ? 'Operational' : 'Down';
            return {
              ...s,
              status,
              uptime: 100,
              lastChecked: now,
            } as ServiceStatus;
          } catch {
            return { ...s, status: 'Down' as const, uptime: 0, lastChecked: now };
          }
        } else {
          try {
            const res = await fetch(s.url!, { method: 'HEAD', cache: 'no-store' });
            const status: 'Operational' | 'Down' = res.ok ? 'Operational' : 'Down';
            return {
              ...s,
              status,
              uptime: res.ok ? 100 : 0,
              lastChecked: now,
            } as ServiceStatus;
          } catch {
            return { ...s, status: 'Down' as const, uptime: 0, lastChecked: now };
          }
        }
      })
    );

    setStatuses(updated);
    setCountdown(REFRESH_INTERVAL / 1000);
  };

  useEffect(() => {
    fetchStatus();
    const refreshTimer = setInterval(fetchStatus, REFRESH_INTERVAL);
    const countDownTimer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => {
      clearInterval(refreshTimer);
      clearInterval(countDownTimer);
    };
  }, []);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>FTCScout Status</Text>
      <View style={styles.statusBox}>
        <Text style={styles.statusIcon}>✅</Text>
        <Text style={styles.statusText}>All Systems Operational</Text>
      </View>

      <Text style={styles.sectionHeader}>Services</Text>

      {statuses.map((service) => (
        <View key={service.name} style={styles.serviceCard}>
          <View style={styles.serviceHeader}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>100%</Text>
            </View>
            <Text style={styles.serviceName}>{service.name}</Text>
          </View>
          <View style={styles.uptimeBar}>
            {Array.from({ length: 30 }).map((_, i) => (
              <View
                key={i}
                style={[
                  styles.uptimeBarBlock,
                  { backgroundColor: service.status === 'Operational' ? '#22c55e' : '#ef4444' },
                ]}
              />
            ))}
          </View>
          <View style={styles.times}>
            <Text style={styles.timeText}>{service.lastChecked}</Text>
            <Text style={styles.timeText}>now</Text>
          </View>
        </View>
      ))}

      <Text style={styles.cloudflare}>
        Additional detail about Cloudflare status available at{' '}
        <Text style={{ color: '#3b82f6' }}>cloudflarestatus.com</Text>
      </Text>

      <Text style={styles.footer}>Last Updated: {new Date().toLocaleString()}</Text>
      <Text style={styles.footer}>Refresh in: {countdown}s</Text>
      <TouchableOpacity style={styles.button} onPress={fetchStatus}>
        <Text style={styles.buttonText}>🔄 Refresh now</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
    padding: 16,
  },
  title: {
    fontSize: 24,
    color: '#f9fafb',
    fontWeight: '700',
    marginBottom: 12,
  },
  statusBox: {
    flexDirection: 'row',
    backgroundColor: '#1f2937',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  statusIcon: {
    fontSize: 20,
    marginRight: 8,
    color: '#22c55e',
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#d1fae5',
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f3f4f6',
    marginBottom: 8,
  },
  serviceCard: {
    backgroundColor: '#1f2937',
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
  },
  serviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  badge: {
    backgroundColor: '#22c55e',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 8,
  },
  badgeText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12,
  },
  serviceName: {
    color: '#e5e7eb',
    fontSize: 14,
    fontWeight: '600',
  },
  uptimeBar: {
    flexDirection: 'row',
    gap: 2,
    flexWrap: 'wrap',
    marginBottom: 6,
  },
  uptimeBarBlock: {
    width: 4,
    height: 12,
    borderRadius: 1,
  },
  times: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeText: {
    color: '#9ca3af',
    fontSize: 11,
  },
  cloudflare: {
    color: '#9ca3af',
    fontSize: 12,
    marginTop: 8,
  },
  footer: {
    marginTop: 4,
    color: '#6b7280',
    fontSize: 12,
  },
  button: {
    marginTop: 10,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#374151',
    borderRadius: 6,
  },
  buttonText: {
    color: '#d1d5db',
    fontSize: 13,
    fontWeight: '600',
  },
});

export default StatusScreen;