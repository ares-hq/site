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
import Left from '../../assets/icons/caret-left.svg';
import Right from '../../assets/icons/caret-right.svg';
import { SupportedYear } from '@/api/utils/types';

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
    showRightShadow: false,
    needsScroll: false,
    contentOffset: 0,
    contentSize: 0,
    layoutWidth: 0,
  });

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const isAtStart = contentOffset.x <= 5;
    const isAtEnd = contentOffset.x >= contentSize.width - layoutMeasurement.width - 5;
    const needsScroll = contentSize.width > layoutMeasurement.width;

    setScrollState(prev => ({
      ...prev,
      showLeftShadow: !isAtStart && needsScroll,
      showRightShadow: !isAtEnd && needsScroll,
      needsScroll,
      contentOffset: contentOffset.x,
      contentSize: contentSize.width,
      layoutWidth: layoutMeasurement.width,
    }));
  };

  const handleLayout = (event: any) => {
    const { width } = event.nativeEvent.layout;
    setScrollState(prev => {
      const needsScroll = prev.contentSize > width;
      const showRightShadow = needsScroll && prev.contentOffset < prev.contentSize - width - 5;
      const showLeftShadow = needsScroll && prev.contentOffset > 5;
      return {
        ...prev,
        layoutWidth: width,
        needsScroll,
        showLeftShadow,
        showRightShadow,
      };
    });
  };

  const scrollLeft = () => {
    const newX = Math.max(0, scrollState.contentOffset - 200);
    scrollViewRef.current?.scrollTo({ x: newX, animated: true });
  };

  const scrollRight = () => {
    const maxScroll = Math.max(0, scrollState.contentSize - scrollState.layoutWidth);
    const newX = Math.min(maxScroll, scrollState.contentOffset + 100);
    scrollViewRef.current?.scrollTo({ x: newX, animated: true });
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: isDarkMode ? '#9CA3AF' : '#6B7280' }]}>
        Season
      </Text>
      <View style={styles.scrollWrapper}>
        {scrollState.needsScroll && (
          <TouchableOpacity
            style={[styles.arrowButton, {paddingRight: 10}]}
            onPress={scrollLeft}
            activeOpacity={scrollState.showLeftShadow ? 0.7 : 0.5}
            disabled={!scrollState.showLeftShadow}
          >
            <Left height={15} width={15} fill={scrollState.showLeftShadow ? (isDarkMode ? '#F9FAFB' : '#111827') : (isDarkMode ? '#4B5563' : '#D1D5DB')} />
          </TouchableOpacity>
        )}
        <View style={styles.scrollContainer} onLayout={handleLayout}>
          <ScrollView
            ref={scrollViewRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.yearList}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            onContentSizeChange={(contentWidth, contentHeight) => {
              setScrollState(prev => {
                const needsScroll = contentWidth > prev.layoutWidth;
                const showRightShadow = needsScroll && prev.contentOffset < contentWidth - prev.layoutWidth - 5;
                const showLeftShadow = needsScroll && prev.contentOffset > 5;
                return {
                  ...prev,
                  contentSize: contentWidth,
                  needsScroll,
                  showLeftShadow,
                  showRightShadow,
                };
              });
            }}
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
                onPress={() => {
                  onYearChange(year);
                  const reversedYears = [...availableYears].reverse();
                  const index = reversedYears.indexOf(year);
                  const buttonWidth = 75;
                  const buttonX = 4 + index * buttonWidth;
                  const buttonCenterX = buttonX + buttonWidth / 2;
                  const targetX = Math.max(0, Math.min(scrollState.contentSize - scrollState.layoutWidth, buttonCenterX - scrollState.layoutWidth / 2));
                  scrollViewRef.current?.scrollTo({ x: targetX, animated: true });
                }}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.yearButtonText,
                  {
                    color: selectedYear === year
                      ? (isDarkMode ? '#F9FAFB' : '#111827')
                      : (isDarkMode ? '#D1D5DB' : '#6B7280'),
                  }
                ]}>
                  {year}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          {scrollState.showLeftShadow && (
          <View style={styles.fadeLeft} pointerEvents="none">
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
          <View style={styles.fadeRight} pointerEvents="none">
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
        {scrollState.needsScroll && (
          <TouchableOpacity
            style={[styles.arrowButton, {paddingLeft: 10}]}
            onPress={scrollRight}
            activeOpacity={scrollState.showRightShadow ? 0.7 : 0.5}
            disabled={!scrollState.showRightShadow}
          >
            <Right height={15} width={15} fill={scrollState.showRightShadow ? (isDarkMode ? '#F9FAFB' : '#111827') : (isDarkMode ? '#4B5563' : '#D1D5DB')} />
          </TouchableOpacity>
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
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  scrollWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 0,
  },
  scrollContainer: {
    flex: 1,
    position: 'relative',
    borderRadius: 8,
    overflow: 'hidden',
  },
  arrowButton: {
    // width: 30,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
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
    // paddingHorizontal: 4,
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