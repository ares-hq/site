import { SupportedYear } from '@/api/dashboardInfo';
import { useDarkMode } from '@/context/DarkModeContext';
import React from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface YearSelectorProps {
  selectedYear: SupportedYear;
  availableYears: SupportedYear[];
  onYearChange: (year: SupportedYear) => void;
}

export const YearSelector: React.FC<YearSelectorProps> = ({
  selectedYear,
  availableYears,
  onYearChange,
}) => {
  const { isDarkMode } = useDarkMode();

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: isDarkMode ? '#9CA3AF' : '#6B7280' }]}>
        Season
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.yearList}
      >
        {[...availableYears].reverse().map((year) => (
          <TouchableOpacity
            key={year}
            style={[
              styles.yearButton,
              {
                backgroundColor: selectedYear === year
                  ? (isDarkMode ? '#4B5563' : '#F3F4F6')
                  : 'transparent',
                borderColor: selectedYear === year
                  ? (isDarkMode ? '#9CA3AF' : '#D1D5DB')
                  : 'transparent',
              }
            ]}
            onPress={() => onYearChange(year)}
            activeOpacity={0.7}
          >
            <Text style={[
              styles.yearButtonText,
              {
                color: selectedYear === year
                  ? (isDarkMode ? '#F9FAFB' : '#111827')
                  : (isDarkMode ? '#D1D5DB' : '#6B7280'),
                fontWeight: selectedYear === year ? '700' : '500',
              }
            ]}>
              {year}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  yearList: {
    gap: 8,
    paddingVertical: 4,
  },
  yearButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    minWidth: 48,
    alignItems: 'center',
  },
  yearButtonText: {
    fontSize: 14,
    textAlign: 'center',
  },
});