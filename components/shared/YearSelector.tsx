import { SupportedYear } from '@/api/dashboardInfo';
import { useDarkMode } from '@/context/DarkModeContext';
import React, { useRef, useState } from 'react';
import {
    NativeScrollEvent,
    NativeSyntheticEvent,
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
  const scrollViewRef = useRef<ScrollView>(null);
  const [scrollState, setScrollState] = useState({
    showLeftShadow: false,
    showRightShadow: true,
  });

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const isAtStart = contentOffset.x <= 5;
    const isAtEnd = contentOffset.x >= contentSize.width - layoutMeasurement.width - 5;

    setScrollState({
      showLeftShadow: !isAtStart,
      showRightShadow: !isAtEnd,
    });
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: isDarkMode ? '#9CA3AF' : '#6B7280' }]}>
        Season
      </Text>
      <View style={styles.scrollContainer}>
        <ScrollView
          ref={scrollViewRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.yearList}
          onScroll={handleScroll}
          scrollEventThrottle={16}
        >
          {[...availableYears].reverse().map((year) => (
            <TouchableOpacity
              key={year}
              style={[
                styles.yearButton,
                selectedYear === year && {
                  backgroundColor: isDarkMode ? '#3B4251' : '#E5E7EB',
                },
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
                  fontWeight: selectedYear === year ? '500' : 'normal',
                }
              ]}>
                {year}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        {scrollState.showLeftShadow && (
          <View style={styles.fadeLeft}>
            <View style={[styles.fadeSegment, { backgroundColor: isDarkMode ? 'rgba(42, 42, 42, 0.98)' : 'rgba(255, 255, 255, 0.99)' }]} />
            <View style={[styles.fadeSegment, { backgroundColor: isDarkMode ? 'rgba(42, 42, 42, 0.92)' : 'rgba(255, 255, 255, 0.95)' }]} />
            <View style={[styles.fadeSegment, { backgroundColor: isDarkMode ? 'rgba(42, 42, 42, 0.84)' : 'rgba(255, 255, 255, 0.88)' }]} />
            <View style={[styles.fadeSegment, { backgroundColor: isDarkMode ? 'rgba(42, 42, 42, 0.74)' : 'rgba(255, 255, 255, 0.79)' }]} />
            <View style={[styles.fadeSegment, { backgroundColor: isDarkMode ? 'rgba(42, 42, 42, 0.62)' : 'rgba(255, 255, 255, 0.68)' }]} />
            <View style={[styles.fadeSegment, { backgroundColor: isDarkMode ? 'rgba(42, 42, 42, 0.48)' : 'rgba(255, 255, 255, 0.54)' }]} />
            <View style={[styles.fadeSegment, { backgroundColor: isDarkMode ? 'rgba(42, 42, 42, 0.35)' : 'rgba(255, 255, 255, 0.39)' }]} />
            <View style={[styles.fadeSegment, { backgroundColor: isDarkMode ? 'rgba(42, 42, 42, 0.24)' : 'rgba(255, 255, 255, 0.26)' }]} />
            <View style={[styles.fadeSegment, { backgroundColor: isDarkMode ? 'rgba(42, 42, 42, 0.14)' : 'rgba(255, 255, 255, 0.15)' }]} />
            <View style={[styles.fadeSegment, { backgroundColor: isDarkMode ? 'rgba(42, 42, 42, 0.06)' : 'rgba(255, 255, 255, 0.06)' }]} />
            <View style={[styles.fadeSegment, { backgroundColor: isDarkMode ? 'rgba(42, 42, 42, 0.02)' : 'rgba(255, 255, 255, 0.02)' }]} />
            <View style={[styles.fadeSegment, { backgroundColor: isDarkMode ? 'rgba(42, 42, 42, 0)' : 'rgba(255, 255, 255, 0)' }]} />
          </View>
        )}
        {scrollState.showRightShadow && (
          <View style={styles.fadeRight}>
            <View style={[styles.fadeSegment, { backgroundColor: isDarkMode ? 'rgba(42, 42, 42, 0)' : 'rgba(255, 255, 255, 0)' }]} />
            <View style={[styles.fadeSegment, { backgroundColor: isDarkMode ? 'rgba(42, 42, 42, 0.02)' : 'rgba(255, 255, 255, 0.02)' }]} />
            <View style={[styles.fadeSegment, { backgroundColor: isDarkMode ? 'rgba(42, 42, 42, 0.06)' : 'rgba(255, 255, 255, 0.06)' }]} />
            <View style={[styles.fadeSegment, { backgroundColor: isDarkMode ? 'rgba(42, 42, 42, 0.14)' : 'rgba(255, 255, 255, 0.15)' }]} />
            <View style={[styles.fadeSegment, { backgroundColor: isDarkMode ? 'rgba(42, 42, 42, 0.24)' : 'rgba(255, 255, 255, 0.26)' }]} />
            <View style={[styles.fadeSegment, { backgroundColor: isDarkMode ? 'rgba(42, 42, 42, 0.35)' : 'rgba(255, 255, 255, 0.39)' }]} />
            <View style={[styles.fadeSegment, { backgroundColor: isDarkMode ? 'rgba(42, 42, 42, 0.48)' : 'rgba(255, 255, 255, 0.54)' }]} />
            <View style={[styles.fadeSegment, { backgroundColor: isDarkMode ? 'rgba(42, 42, 42, 0.62)' : 'rgba(255, 255, 255, 0.68)' }]} />
            <View style={[styles.fadeSegment, { backgroundColor: isDarkMode ? 'rgba(42, 42, 42, 0.74)' : 'rgba(255, 255, 255, 0.79)' }]} />
            <View style={[styles.fadeSegment, { backgroundColor: isDarkMode ? 'rgba(42, 42, 42, 0.84)' : 'rgba(255, 255, 255, 0.88)' }]} />
            <View style={[styles.fadeSegment, { backgroundColor: isDarkMode ? 'rgba(42, 42, 42, 0.92)' : 'rgba(255, 255, 255, 0.95)' }]} />
            <View style={[styles.fadeSegment, { backgroundColor: isDarkMode ? 'rgba(42, 42, 42, 0.98)' : 'rgba(255, 255, 255, 0.99)' }]} />
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    // fontWeight: '600',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  scrollContainer: {
    position: 'relative',
    borderRadius: 8,
    overflow: 'hidden',
  },
  fadeLeft: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 48,
    flexDirection: 'row',
    zIndex: 1,
  },
  fadeRight: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 48,
    flexDirection: 'row',
    zIndex: 1,
  },
  fadeSegment: {
    flex: 1,
  },
  yearList: {
    gap: 8,
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  yearButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    minWidth: 48,
    alignItems: 'center',
  },
  yearButtonText: {
    fontSize: 14,
    textAlign: 'center',
  },
});