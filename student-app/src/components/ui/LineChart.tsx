import React from 'react';
import { View } from 'react-native';
import Svg, { Line, Polyline, Polygon, Circle, Text as SvgText } from 'react-native-svg';
import { AppText } from './AppText';
import { colors } from '@theme';

export interface LineChartDatum {
  label: string;
  value: number; // 0-100
}

interface LineChartProps {
  data: LineChartDatum[];
  height?: number;
  lineColor?: string;
  maxValue?: number;
}

const GRID_STEPS = [0, 25, 50, 75, 100];

export function LineChart({
  data,
  height = 180,
  lineColor = colors.primary,
  maxValue = 100,
}: LineChartProps) {
  const chartHeight = height - 30;
  const chartWidth = 300;
  const paddingX = 16;
  const usableWidth = chartWidth - paddingX * 2;

  if (data.length === 0) return null;

  const points = data.map((d, i) => {
    const x = paddingX + (data.length === 1 ? usableWidth / 2 : (i / (data.length - 1)) * usableWidth);
    const y = chartHeight - (Math.max(0, Math.min(maxValue, d.value)) / maxValue) * chartHeight;
    return { x, y, ...d };
  });

  const polylinePoints = points.map((p) => `${p.x},${p.y}`).join(' ');
  const areaPoints = `${paddingX},${chartHeight} ${polylinePoints} ${chartWidth - paddingX},${chartHeight}`;
  const last = points[points.length - 1];

  return (
    <View>
      <View style={{ flexDirection: 'row' }}>
        <View style={{ width: 26, height: chartHeight, justifyContent: 'space-between', paddingBottom: 2 }}>
          {[...GRID_STEPS].reverse().map((step) => (
            <AppText key={step} variant="tiny" color={colors.textTertiary} align="right">
              {step}
            </AppText>
          ))}
        </View>
        <Svg width={chartWidth} height={height} viewBox={`0 0 ${chartWidth} ${height}`}>
          {GRID_STEPS.map((step) => {
            const y = chartHeight - (step / maxValue) * chartHeight;
            return (
              <Line
                key={step}
                x1={0}
                x2={chartWidth}
                y1={y}
                y2={y}
                stroke={colors.borderSoft}
                strokeWidth={1}
              />
            );
          })}
          <Polygon points={areaPoints} fill={lineColor} fillOpacity={0.1} />
          <Polyline
            points={polylinePoints}
            fill="none"
            stroke={lineColor}
            strokeWidth={2.5}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          {points.map((p, i) => (
            <Circle
              key={i}
              cx={p.x}
              cy={p.y}
              r={i === points.length - 1 ? 5 : 4}
              fill={lineColor}
              stroke={colors.surface}
              strokeWidth={2}
            />
          ))}
          {last && (
            <SvgText
              x={Math.min(last.x, chartWidth - 20)}
              y={Math.max(last.y - 12, 12)}
              fontSize={11}
              fontWeight="700"
              fill={colors.textPrimary}
              textAnchor="middle"
            >
              {Math.round(last.value)}
            </SvgText>
          )}
        </Svg>
      </View>
      <View style={{ flexDirection: 'row', paddingLeft: 26, justifyContent: 'space-between' }}>
        {data.map((d, i) => (
          <AppText key={d.label + i} variant="tiny" color={colors.textSecondary}>
            {d.label}
          </AppText>
        ))}
      </View>
    </View>
  );
}
