import React from 'react';
import Svg, { Ellipse, Rect, Circle, Polygon, Line } from 'react-native-svg';

// Decorative building-and-trees illustration for the Today's Snapshot card.
export function SchoolIllustration({ width = 130, height = 100 }: { width?: number; height?: number }) {
  return (
    <Svg width={width} height={height} viewBox="0 0 160 120">
      <Ellipse cx={80} cy={112} rx={72} ry={7} fill="#DCD3F7" opacity={0.7} />

      <Rect x={16} y={78} width={6} height={18} rx={2} fill="#B9A6F0" opacity={0.6} />
      <Circle cx={19} cy={70} r={15} fill="#B7E4C7" />
      <Circle cx={9} cy={78} r={10} fill="#A3DBB4" />

      <Rect x={136} y={80} width={6} height={16} rx={2} fill="#B9A6F0" opacity={0.6} />
      <Circle cx={139} cy={72} r={13} fill="#B7E4C7" />
      <Circle cx={149} cy={80} r={9} fill="#A3DBB4" />

      <Rect x={45} y={58} width={70} height={48} rx={6} fill="#FFFFFF" stroke="#C9BCEF" strokeWidth={1.5} />
      <Polygon points="40,58 80,30 120,58" fill="#C6B6F5" />
      <Circle cx={80} cy={30} r={8} fill="#FFFFFF" stroke="#C6B6F5" strokeWidth={1.5} />
      <Line x1={80} y1={26} x2={80} y2={30} stroke="#8B7CB8" strokeWidth={1.2} />
      <Line x1={80} y1={30} x2={83} y2={30} stroke="#8B7CB8" strokeWidth={1.2} />
      <Line x1={80} y1={20} x2={80} y2={8} stroke="#8B7CB8" strokeWidth={1.5} />
      <Polygon points="80,8 92,12 80,16" fill="#F2A65A" />

      <Rect x={53} y={68} width={12} height={12} rx={2} fill="#E4D9FB" />
      <Rect x={95} y={68} width={12} height={12} rx={2} fill="#E4D9FB" />
      <Rect x={71} y={86} width={18} height={20} rx={3} fill="#C6B6F5" />
    </Svg>
  );
}
