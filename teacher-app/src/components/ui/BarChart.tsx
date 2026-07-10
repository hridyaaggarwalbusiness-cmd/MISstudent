import React from 'react';
import { View, ScrollView } from 'react-native';
import Svg, { Rect, Line, Text as SvgText } from 'react-native-svg';
import { AppText } from './AppText';
import { colors } from '@theme';

export interface BarChartDatum {
  label: string;
  value: number; // 0-100
}

interface BarChartProps {
  data: BarChartDatum[];
  height?: number;
  barColor?: string;
  maxValue?: number;
}

const BAR_WIDTH = 22;
const BAR_GAP = 22;
const GRID_STEPS = [0, 25, 50, 75, 100];
const TOP_PADDING = 20; // headroom so value labels never clip on near-max bars
const X_LABEL_SPACE = 20;

export function BarChart({
  data,
  height = 200,
  barColor = colors.primary,
  maxValue = 100,
}: BarChartProps) {
  const plotHeight = height - X_LABEL_SPACE - TOP_PADDING;
  const baseline = TOP_PADDING + plotHeight;
  const contentWidth = Math.max(data.length * (BAR_WIDTH + BAR_GAP) + BAR_GAP, 300);

  return (
    <View style={{ flexDirection: 'row' }}>
      <View
        style={{
          width: 26,
          height: plotHeight,
          marginTop: TOP_PADDING,
          justifyContent: 'space-between',
        }}
      >
        {[...GRID_STEPS].reverse().map((step) => (
          <AppText key={step} variant="tiny" color={colors.textTertiary} align="right">
            {step}
          </AppText>
        ))}
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={{ width: contentWidth }}>
          <Svg width={contentWidth} height={height}>
            {GRID_STEPS.map((step) => {
              const y = baseline - (step / maxValue) * plotHeight;
              return (
                <Line
                  key={step}
                  x1={0}
                  x2={contentWidth}
                  y1={y}
                  y2={y}
                  stroke={colors.borderSoft}
                  strokeWidth={1}
                />
              );
            })}
            {data.map((d, i) => {
              const barH = Math.max((d.value / maxValue) * plotHeight, 4);
              const x = BAR_GAP + i * (BAR_WIDTH + BAR_GAP) - BAR_WIDTH / 2;
              const y = baseline - barH;
              return (
                <React.Fragment key={d.label + i}>
                  <SvgText
                    x={x + BAR_WIDTH / 2}
                    y={Math.max(y - 8, 12)}
                    fontSize={11}
                    fontWeight="600"
                    fill={colors.textSecondary}
                    textAnchor="middle"
                  >
                    {Math.round(d.value)}
                  </SvgText>
                  <Rect x={x} y={y} width={BAR_WIDTH} height={barH} rx={4} fill={barColor} />
                </React.Fragment>
              );
            })}
          </Svg>
          <View style={{ flexDirection: 'row', marginTop: -X_LABEL_SPACE }}>
            {data.map((d, i) => (
              <View key={d.label + i} style={{ width: BAR_WIDTH + BAR_GAP, alignItems: 'center' }}>
                <AppText variant="tiny" color={colors.textSecondary} numberOfLines={1}>
                  {d.label}
                </AppText>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
