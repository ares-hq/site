import { MatchInfo } from '@/api/utils/types';
import { useTheme } from '@/components/shared/theme';
import { Feather } from '@expo/vector-icons';
import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';

interface MatchScoreBreakdownProps {
  match: MatchInfo;
  matchScoreDetails: any;
  loadingScores: boolean;
}

// Alliance readout colours — match the shared TeamPill palette.
const ALLIANCE = {
  red: { light: '#DC2626', dark: '#F87171' },
  blue: { light: '#2563EB', dark: '#60A5FA' },
} as const;

export default function MatchScoreBreakdown({
  match,
  matchScoreDetails,
  loadingScores,
}: MatchScoreBreakdownProps) {
  const t = useTheme();
  const c = t.c;
  const isDarkMode = t.isDark;
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  const redText = isDarkMode ? ALLIANCE.red.dark : ALLIANCE.red.light;
  const blueText = isDarkMode ? ALLIANCE.blue.dark : ALLIANCE.blue.light;

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
      const maxLength = 10;
      const display = sequence.length > maxLength ? sequence.substring(0, maxLength) + '…' : sequence;
      
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

  const valW = isMobile ? 92 : 118;

  const renderCategory = (category: any, catIdx: number) => {
    const fieldsToRender = category.fields.filter((field: string) => {
      const redValue = redData?.[field];
      const blueValue = blueData?.[field];

      // While loading, show all fields for this season/year
      if (loadingScores) return true;
      // Always show Penalties & Fouls fields, even if no data
      if (category.title === 'Penalties & Fouls') return true;
      // After loading, only show fields where at least one alliance has data
      return (redValue !== undefined && redValue !== null) || (blueValue !== undefined && blueValue !== null);
    });

    if (fieldsToRender.length === 0 && category.title !== 'Penalties & Fouls') return null;

    const isExpanded = expandedCategories.has(category.title);
    const emphasise = !!category.highlight;

    return (
      <View key={category.title} style={styles.category}>
        <TouchableOpacity
          style={styles.categoryHeader}
          onPress={() => toggleCategory(category.title)}
          activeOpacity={0.6}
        >
          <Text style={[styles.categoryTitle, { color: c.text, fontSize: isMobile ? 12 : 12.5 }]}>
            {category.title}
          </Text>
          <Feather
            name="chevron-down"
            size={14}
            color={c.textFaint}
            style={{ transform: [{ rotate: isExpanded ? '180deg' : '0deg' }] }}
          />
        </TouchableOpacity>
        {catIdx < categories.length - 1 && (
          <View style={[styles.catDivider, { backgroundColor: c.border }]} />
        )}

        {isExpanded &&
          fieldsToRender.map((field: string, idx: number) => {
            const redFormatted = formatValue(redData?.[field], field);
            const blueFormatted = formatValue(blueData?.[field], field);
            return (
              <View
                key={field}
                style={[styles.statRow, idx % 2 === 1 && { backgroundColor: c.bgSubtle }]}
              >
                <Text style={[styles.statLabel, { color: c.textMuted }]} numberOfLines={1}>
                  {formatLabel(field)}
                </Text>
                <Text
                  style={[styles.statValue, { width: valW, color: redFormatted.color || redText, fontWeight: emphasise ? '700' : '600' }]}
                  numberOfLines={1}
                >
                  {redFormatted.display}
                </Text>
                <Text
                  style={[styles.statValue, { width: valW, color: blueFormatted.color || blueText, fontWeight: emphasise ? '700' : '600' }]}
                  numberOfLines={1}
                >
                  {blueFormatted.display}
                </Text>
              </View>
            );
          })}
      </View>
    );
  };

  return (
    <View style={[styles.scoreBreakdown, { borderBottomColor: c.hairline }]}>
      <View style={[styles.colHead, { borderBottomColor: c.border }]}>
        <View style={{ flex: 1 }} />
        <Text style={[styles.colHeadTxt, { width: valW, color: redText }]}>Red</Text>
        <Text style={[styles.colHeadTxt, { width: valW, color: blueText }]}>Blue</Text>
      </View>
      <View style={styles.categoriesContainer}>
        {categories.map(renderCategory)}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  scoreBreakdown: {
    borderBottomWidth: 1,
    paddingTop: 2,
    paddingBottom: 6,
    width: '100%',
  },
  colHead: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingBottom: 9,
    borderBottomWidth: 1,
  },
  colHeadTxt: {
    paddingHorizontal: 7,
    textAlign: 'right',
    fontSize: 11,
    fontWeight: '700',
  },
  categoriesContainer: {
    gap: 4,
    marginTop: 2,
  },
  category: {},
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 40,
    paddingHorizontal: 12,
  },
  categoryTitle: {
    fontWeight: '700',
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 36,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  catDivider: { height: 1, marginHorizontal: 12 },
  statLabel: {
    flex: 1,
    paddingHorizontal: 7,
    fontSize: 13,
    fontWeight: '500',
  },
  statValue: {
    paddingHorizontal: 7,
    textAlign: 'right',
    fontSize: 13,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
});

