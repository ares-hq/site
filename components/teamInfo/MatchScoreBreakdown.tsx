import { MatchInfo } from '@/api/utils/types';
import { useDarkMode } from '@/context/DarkModeContext';
import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';

interface MatchScoreBreakdownProps {
  match: MatchInfo;
  matchScoreDetails: any;
  loadingScores: boolean;
}

export default function MatchScoreBreakdown({
  match,
  matchScoreDetails,
  loadingScores,
}: MatchScoreBreakdownProps) {
  const { isDarkMode } = useDarkMode();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  // Only auto-expand Point Totals by default
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set([
    'Point Totals'
  ]));

  const toggleCategory = (title: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(title)) {
        newSet.delete(title);
      } else {
        newSet.add(title);
      }
      return newSet;
    });
  };

  // Get data for both alliances
  let redData, blueData;
  if (matchScoreDetails?.alliances && matchScoreDetails.alliances.length >= 2) {
    // API response has alliances array: [0] = blue, [1] = red
    redData = matchScoreDetails.alliances[1] || {};
    blueData = matchScoreDetails.alliances[0] || {};
  } else {
    // Fallback to match object directly
    redData = match.redAlliance || {};
    blueData = match.blueAlliance || {};
  }

  // Ensure data objects exist to prevent undefined errors
  redData = redData || {};
  blueData = blueData || {};

  // Determine season/year from match date to filter relevant fields
  const getSeasonFromDate = (dateString: string): number => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    // FTC seasons typically run from fall to spring, so:
    // Matches in year X before ~June are season X-1
    // Matches in year X after ~June are season X
    const month = date.getMonth() + 1; // getMonth() returns 0-11
    return month < 6 ? year - 1 : year;
  };

  const matchSeason = match?.date ? getSeasonFromDate(match.date) : new Date().getFullYear();
  
  // Check if this is a practice match
  const isPracticeMatch = match?.matchType?.toUpperCase() === 'PRACTICE';

  // Filter point totals based on season
  const getRelevantPointTotals = (season: number): string[] => {
    const allPointTotals = ['totalPoints', 'autoPoints', 'dcPoints', 'teleopPoints', 'driverControlledPoints', 'endgamePoints', 'endGamePoints', 'prePenaltyTotal', 'preFoulTotal'];
    
    // For practice matches, only show total points (no auto points)
    if (isPracticeMatch) {
      return ['totalPoints'];
    }
    
    // Season-specific point total fields
    const seasonFields: { [key: number]: string[] } = {
      2019: ['totalPoints', 'autoPoints', 'teleopPoints', 'endgamePoints'],
      2020: ['totalPoints', 'autoPoints', 'teleopPoints', 'endgamePoints'],
      2021: ['totalPoints', 'autoPoints', 'teleopPoints', 'endgamePoints'],
      2022: ['totalPoints', 'autoPoints', 'dcPoints', 'endgamePoints'],
      2023: ['totalPoints', 'autoPoints', 'teleopPoints', 'endgamePoints'],
      2024: ['totalPoints', 'autoPoints', 'teleopPoints', 'endgamePoints'],
      2025: ['totalPoints', 'autoPoints', 'teleopPoints', 'endgamePoints'],
    };
    
    return seasonFields[season] || ['totalPoints', 'autoPoints', 'teleopPoints', 'endgamePoints']; // fallback
  };

  // Get season-specific categories
  const getSeasonCategories = (season: number) => {
    const baseCategories = [
      {
        title: 'Point Totals',
        color: '#F59E0B',
        fields: loadingScores ? getRelevantPointTotals(matchSeason) : (isPracticeMatch ? ['totalPoints'] : ['totalPoints', 'autoPoints', 'dcPoints', 'teleopPoints', 'driverControlledPoints', 'endgamePoints', 'endGamePoints', 'prePenaltyTotal', 'preFoulTotal']),
        highlight: true,
        collapsible: true
      }
    ];

    // For practice matches, only show Point Totals and Penalties
    if (isPracticeMatch) {
      return [
        ...baseCategories,
        {
          title: 'Penalties & Fouls',
          color: '#DC2626',
          fields: ['foulPointsCommitted'],
          collapsible: true
        }
      ];
    }

    const seasonSpecificCategories: { [key: number]: any[] } = {
      2019: [
        ...baseCategories,
        {
          title: 'Autonomous',
          color: '#8B5CF6',
          fields: ['robot1Auto', 'robot2Auto', 'navigated1', 'navigated2', 'autoStones', 'autoDelivered', 'autoPlaced'],
          collapsible: true
        },
        {
          title: 'Teleoperated',
          color: '#0369A1',
          fields: ['driverControlledDelivered', 'driverControlledPlaced'],
          collapsible: true
        },
        {
          title: 'Endgame',
          color: '#EA580C',
          fields: ['robot1Parked', 'robot2Parked', 'parkingPoints', 'capstonePoints', 'foundationRepositioned', 'foundationMoved', 'repositionedPoints'],
          collapsible: true
        },
        {
          title: 'Penalties & Fouls',
          color: '#DC2626',
          fields: ['minorPenalties', 'majorPenalties', 'penaltyPoints'],
          collapsible: true
        }
      ],
      2020: [
        ...baseCategories,
        {
          title: 'Autonomous',
          color: '#8B5CF6',
          fields: ['robot1Auto', 'robot2Auto', 'navigated1', 'navigated2', 'autoPowerShotLeft', 'autoPowerShotCenter', 'autoPowerShotRight', 'autoWobblePoints'],
          collapsible: true
        },
        {
          title: 'Teleoperated',
          color: '#0369A1',
          fields: ['driverControlledStorageFreight', 'driverControlledAllianceHubPoints', 'driverControlledSharedHubPoints'],
          collapsible: true
        },
        {
          title: 'Endgame',
          color: '#EA580C',
          fields: ['endgameParked', 'endgameParked1', 'endgameParked2', 'endPowerShotLeft', 'endPowerShotCenter', 'endPowerShotRight', 'wobbleEndPoints', 'wobbleRings1', 'wobbleRings2', 'wobbleDelivered1', 'wobbleDelivered2'],
          collapsible: true
        },
        {
          title: 'Penalties & Fouls',
          color: '#DC2626',
          fields: ['minorPenalties', 'majorPenalties', 'penaltyPoints'],
          collapsible: true
        }
      ],
      2021: [
        ...baseCategories,
        {
          title: 'Autonomous',
          color: '#8B5CF6',
          fields: ['robot1Auto', 'robot2Auto', 'navigated1', 'navigated2','autoStorageFreight', 'autoFreight1', 'autoFreight2', 'autoFreight3'],
          collapsible: true
        },
        // {
        //   title: 'Autonomous Scoring',
        //   color: '#059669',
        //   fields: [],
        //   collapsible: true
        // },
        {
          title: 'Teleoperated',
          color: '#0369A1',
          fields: ['driverControlledStorageFreight', 'driverControlledFreight1', 'driverControlledFreight2', 'driverControlledFreight3', 'driverControlledAllianceHubPoints', 'driverControlledSharedHubPoints'],
          collapsible: true
        },
        {
          title: 'Endgame',
          color: '#EA580C',
          fields: ['endgameParked', 'endgameParked1', 'endgameParked2', 'carousel', 'capped', 'cappingPoints'],
          collapsible: true
        },
        {
          title: 'Penalties & Fouls',
          color: '#DC2626',
          fields: ['minorPenalties', 'majorPenalties', 'penaltyPoints'],
          collapsible: true
        }
      ],
      2022: [
        ...baseCategories,
        {
          title: 'Autonomous',
          color: '#8B5CF6',
          fields: ['robot1Auto', 'robot2Auto', 'navigated1', 'navigated2', 'autoTerminal', 'autoJunctions'],
          collapsible: true
        },
        {
          title: 'Teleoperated',
          color: '#0369A1',
          fields: ['dcJunctions', 'dcTerminal'],
          collapsible: true
        },
        {
          title: 'Endgame',
          color: '#EA580C',
          fields: ['egNavigated', 'egNavigated1', 'egNavigated2', 'circuit', 'allianceBalanced', 'beacons', 'ownedJunctions'],
          collapsible: true
        },
        {
          title: 'Penalties & Fouls',
          color: '#DC2626',
          fields: ['minorPenalties', 'majorPenalties', 'penaltyPointsCommitted'],
          collapsible: true
        }
      ],
      2023: [
        ...baseCategories,
        {
          title: 'Autonomous',
          color: '#8B5CF6',
          fields: ['robot1Auto', 'robot2Auto', 'navigated1', 'navigated2', 'autoLeavePoints', 'autoBackdrop', 'autoBackstage'],
          collapsible: true
        },
        {
          title: 'Teleoperated',
          color: '#0369A1',
          fields: ['dcBackdrop', 'dcBackstage'],
          collapsible: true
        },
        {
          title: 'Endgame',
          color: '#EA580C',
          fields: ['endgameParked', 'endgameParked1', 'endgameParked2', 'mosaics', 'setBonusPoints', 'ownershipPoints', 'tallestSkyscraper', 'skyscraperBonusPoints'],
          collapsible: true
        },
        {
          title: 'Penalties & Fouls',
          color: '#DC2626',
          fields: ['minorPenalties', 'majorPenalties', 'penaltyPointsCommitted'],
          collapsible: true
        }
      ],
      2024: [
        ...baseCategories,
        {
          title: 'Autonomous',
          color: '#8B5CF6',
          fields: ['robot1Auto', 'robot2Auto', 'navigated1', 'navigated2', 'autoLeavePoints', 'autoSampleNet', 'autoSampleLow', 'autoSampleHigh', 'autoSpecimenLow', 'autoSpecimenHigh'],
          collapsible: true
        },
        {
          title: 'Teleoperated',
          color: '#0369A1',
          fields: ['robot1Teleop', 'robot2Teleop', 'teleopSampleNet', 'teleopSampleLow', 'teleopSampleHigh', 'teleopSpecimenLow', 'teleopSpecimenHigh'],
          collapsible: true
        },
        {
          title: 'Endgame',
          color: '#EA580C',
          fields: ['teleopParkPoints', 'teleopAscentPoints'],
          collapsible: true
        },
        {
          title: 'Penalties & Fouls',
          color: '#DC2626',
          fields: ['minorFouls', 'majorFouls', 'foulPointsCommitted'],
          collapsible: true
        }
      ],
      2025: [
        ...baseCategories,
        {
          title: 'Autonomous',
          color: '#8B5CF6',
          fields: ['robot1Auto', 'robot2Auto', 'navigated1', 'navigated2', 'autoLeavePoints', 'initSignalSleeve', 'initSignalSleeve1', 'initSignalSleeve2', 'barcodeElement', 'barcodeElement1', 'barcodeElement2', 'spikeMarkPixel', 'spikeMarkPixel1', 'spikeMarkPixel2', 'targetBackdropPixel', 'targetBackdropPixel1', 'targetBackdropPixel2', 'autoClassifiedArtifacts', 'autoOverflowArtifacts', 'autoClassifierState', 'autoPatternPoints'],
          collapsible: true
        },
        {
          title: 'Teleoperated',
          color: '#0369A1',
          fields: ['robot1Teleop', 'robot2Teleop', 'teleopClassifiedArtifacts', 'teleopOverflowArtifacts', 'teleopDepotArtifacts', 'teleopClassifierState', 'teleopPatternPoints'],
          collapsible: true
        },
        {
          title: 'Endgame',
          color: '#EA580C',
          fields: ['egNavigated', 'egNavigated1', 'egNavigated2', 'egLocationPoints', 'drone', 'drone1', 'drone2', 'movementRP', 'goalRP', 'patternRP'],
          collapsible: true
        },
        {
          title: 'Penalties & Fouls',
          color: '#DC2626',
          fields: ['minorFouls', 'majorFouls', 'foulPointsCommitted'],
          collapsible: true
        }
      ]
    };

    return seasonSpecificCategories[season] || seasonSpecificCategories[2025]; // fallback to latest season
  };

  // Categories with colors - season-specific
  const categories = getSeasonCategories(matchSeason);

  const formatLabel = (key: string): string => {
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .replace(/\s+/g, ' ')
      .replace(/Dc /g, 'DC ')
      .replace(/Eg /g, 'EG ')
      .replace(/Opr/g, 'OPR')
      .replace(/1/g, ' 1')
      .replace(/2/g, ' 2')
      .replace(/3/g, ' 3')
      .trim();
  };

  const formatValue = (value: any, fieldName: string): { display: string | React.ReactNode, color?: string } => {
    if (value === undefined || value === null) {
      return { display: loadingScores ? '--' : '' };
    }

    // Handle boolean values with checkmarks
    if (typeof value === 'boolean') {
      return { display: value ? '✓' : '✗', color: value ? '#10B981' : '#9CA3AF' };
    }

    // Special handling for junction arrays (2022 Power Play auto junctions)
    if (Array.isArray(value) && fieldName.toLowerCase().includes('junction')) {
      const flattenArray = (arr: any[]): string[] => {
        return arr.flatMap(item => Array.isArray(item) ? item : [item]);
      };
      const flattened = flattenArray(value);
      const coneCount = flattened.filter(item => item === 'MY_CONE').length;
      return { display: coneCount.toString() };
    }

    // Special handling for classifier state arrays (2025 Into the Deep)
    if ((Array.isArray(value) || typeof value === 'string') && fieldName.toLowerCase().includes('classifier')) {
      let items: string[] = [];
      if (typeof value === 'string') {
        items = value.split(',').map(item => item.trim());
      } else {
        items = value;
      }
      
      // Flatten any multi-value items
      const flattened: string[] = [];
      items.forEach((item: string) => {
        const parts = item.split(/\s+/).filter(part => part.length > 0);
        flattened.push(...parts);
      });
      
      // Convert to abbreviations
      const abbreviations: { [key: string]: string } = {
        'NONE': 'N',
        'PURPLE': 'P', 
        'GREEN': 'G',
        'YELLOW': 'Y'
      };
      
      const sequence = flattened.map(item => abbreviations[item] || item.charAt(0)).join('');
      
      // Truncate if too long for display
      const maxLength = 12;
      const display = sequence.length > maxLength ? sequence.substring(0, maxLength) + '...' : sequence;
      
      return { display };
    }

    // Special handling for auto stones (2019)
    if (Array.isArray(value) && fieldName === 'autoStones') {
      // Convert to compact format: SKYSTONE -> S, NONE -> N
      const compactStones = value.map(stone => {
        const stoneUpper = String(stone).toUpperCase();
        if (stoneUpper === 'SKYSTONE') return 'S';
        if (stoneUpper === 'NONE') return 'N';
        return String(stone).charAt(0);
      }).join('');
      return { display: compactStones };
    }

    // Handle arrays
    if (Array.isArray(value)) {
      if (value.length === 0) return { display: 'None' };
      return { display: value.join(', ') };
    }

    // Handle numeric values
    if (typeof value === 'number') {
      return { display: String(value) };
    }

    // Handle strings - capitalize properly and shorten long field names
    const strValue = String(value).trim();
    
    // Shorten specific long field names (case-insensitive)
    const shortenedNames: { [key: string]: string } = {
      'in_warehouse': 'Completely',
      'completely_in_warehouse': 'Warehouse',
      'completely_in_storage': 'Storage',
      'team_shipping_element': 'Shipping Element',
      'partially_in_warehouse': 'Partial',
      'not_in_warehouse': 'Not',
      'none': 'None',
      'my_cone': 'Cone',
      'opponent_cone': 'Opp Cone',
      'observation_zone': 'Observation'
    };
    
    // Check both exact match and lowercase match
    const lowerStrValue = strValue.toLowerCase();
    if (shortenedNames[strValue] || shortenedNames[lowerStrValue]) {
      const shortened = shortenedNames[strValue] || shortenedNames[lowerStrValue];
      return { display: shortened };
    }
    
    if (strValue === strValue.toUpperCase() && strValue.length > 2) {
      // Convert all-caps to title case
      return { display: strValue.charAt(0) + strValue.slice(1).toLowerCase() };
    }

    return { display: strValue };
  };

  const renderCategory = (category: any) => {
    const fieldsToRender = category.fields.filter((field: string) => {
      const redValue = redData?.[field];
      const blueValue = blueData?.[field];
      
      // While loading, show all fields for this season/year
      if (loadingScores) {
        return true;
      }
      
      // Always show Penalties & Fouls fields, even if no data
      if (category.title === 'Penalties & Fouls') {
        return true;
      }
      
      // After loading, only show fields where at least one alliance has data
      return (redValue !== undefined && redValue !== null) || (blueValue !== undefined && blueValue !== null);
    });

    if (fieldsToRender.length === 0 && category.title !== 'Penalties & Fouls') return null;

    const isExpanded = expandedCategories.has(category.title);

    // All categories are now expandable
    return (
      <View key={category.title} style={[styles.category, { gap: isMobile ? 2 : 3 }]}>
        <TouchableOpacity 
          style={[styles.categoryHeader, { 
            backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
            paddingVertical: isMobile ? 4 : 6,
            paddingHorizontal: isMobile ? 6 : 8,
          }]}
          onPress={() => toggleCategory(category.title)}
          activeOpacity={0.7}
        >
          <Text style={[styles.categoryTitle, { 
            color: category.color,
            fontSize: isMobile ? 10 : 11,
          }]}>
            {category.title}
          </Text>
          <View style={[styles.dropdownIcon, { 
            width: isMobile ? 16 : 18,
            height: isMobile ? 16 : 18,
          }]}>
            <Text style={[styles.dropdownArrow, { 
              color: category.color,
              fontSize: isMobile ? 10 : 12,
              transform: [{ rotate: isExpanded ? '90deg' : '0deg' }],
            }]}>
              ›
            </Text>
          </View>
        </TouchableOpacity>
        {isExpanded && fieldsToRender.map((field: string) => {
          const redValue = redData?.[field];
          const blueValue = blueData?.[field];
          const redFormatted = formatValue(redValue, field);
          const blueFormatted = formatValue(blueValue, field);
          
          const redBgColor = isDarkMode ? 'rgba(239, 68, 68, 0.15)' : 'rgba(220, 38, 38, 0.1)';
          const blueBgColor = isDarkMode ? 'rgba(59, 130, 246, 0.15)' : 'rgba(37, 99, 235, 0.1)';
          
          return (
            <View key={field} style={[styles.statRow, category.highlight && styles.highlightRow, {
              paddingVertical: isMobile ? 2 : 3,
              paddingHorizontal: isMobile ? 2 : 4,
            }]}>
              <Text style={[styles.statLabel, { 
                color: isDarkMode ? '#9CA3AF' : '#6B7280',
                fontSize: isMobile ? 9 : 10,
                marginRight: isMobile ? 6 : 8,
              }]} numberOfLines={1}>
                {formatLabel(field)}
              </Text>
              <View style={[styles.valuesContainer, { gap: isMobile ? 4 : 6 }]}>
                <View style={[styles.valueCell, { 
                  backgroundColor: redBgColor, 
                  borderWidth: 1, 
                  borderColor: isDarkMode ? 'rgba(239, 68, 68, 0.3)' : 'rgba(220, 38, 38, 0.2)',
                  paddingHorizontal: isMobile ? 4 : 6,
                  paddingVertical: isMobile ? 2 : 3,
                  width: isMobile ? 80 : 105,
                }]}>
                  <Text style={[styles.statValue, { 
                    color: redFormatted.color || (isDarkMode ? '#FCA5A5' : '#DC2626'), 
                    fontSize: isMobile ? 9 : 10,
                  }, category.highlight && styles.highlightValue]}>
                    {redFormatted.display}
                  </Text>
                </View>
                <View style={[styles.valueCell, { 
                  backgroundColor: blueBgColor, 
                  borderWidth: 1, 
                  borderColor: isDarkMode ? 'rgba(59, 130, 246, 0.3)' : 'rgba(37, 99, 235, 0.2)',
                  paddingHorizontal: isMobile ? 4 : 6,
                  paddingVertical: isMobile ? 2 : 3,
                  width: isMobile ? 80 : 105,
                }]}>
                  <Text style={[styles.statValue, { 
                    color: blueFormatted.color || (isDarkMode ? '#93C5FD' : '#2563EB'),
                    fontSize: isMobile ? 9 : 10,
                  }, category.highlight && styles.highlightValue]}>
                    {blueFormatted.display}
                  </Text>
                </View>
              </View>
            </View>
          );
        })}
      </View>
    );
  };

  return (
    <View style={[
      styles.scoreBreakdown,
      {
        borderTopWidth: 0,
        borderBottomWidth: 1,
        borderBottomColor: isDarkMode ? '#374151' : '#E5E7EB',
        paddingHorizontal: isMobile ? 8 : 12,
        paddingVertical: isMobile ? 6 : 8,
      }
    ]}>
      <View style={[styles.categoriesContainer, { gap: isMobile ? 6 : 8 }]}>
        {categories.map(renderCategory)}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  scoreBreakdown: {
    // Responsive padding handled inline
  },
  categoriesContainer: {
    // Responsive gap handled inline
  },
  category: {
    // Responsive gap handled inline
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 6,
    marginHorizontal: -2,
    // Responsive padding handled inline
  },
  categoryTitle: {
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    // Responsive fontSize handled inline
  },
  dropdownIcon: {
    alignItems: 'center',
    justifyContent: 'center',
    // Responsive dimensions handled inline
  },
  dropdownArrow: {
    fontWeight: '600',
    // Responsive fontSize and transform handled inline
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 4,
    marginHorizontal: 2,
    // Responsive padding handled inline
  },
  statLabel: {
    fontWeight: '500',
    flex: 2,
    // Responsive fontSize and margin handled inline
  },
  valuesContainer: {
    flexDirection: 'row',
    flex: 1,
    justifyContent: 'flex-end',
    // Responsive gap handled inline
  },
  valueCell: {
    borderRadius: 4,
    alignItems: 'center',
    // Responsive padding and width handled inline
  },
  statValue: {
    fontWeight: '600',
    textAlign: 'center',
    // Responsive fontSize handled inline
  },
  highlightRow: {
    backgroundColor: 'rgba(245, 158, 11, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.2)',
  },
  highlightValue: {
    fontWeight: '700',
    // Responsive fontSize handled inline
  },
});

