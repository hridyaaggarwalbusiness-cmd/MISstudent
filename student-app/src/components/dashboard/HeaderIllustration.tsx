import React from 'react';
import Svg, { Circle, Rect, Polygon, Line, Ellipse } from 'react-native-svg';

// Soft decorative background illustration behind the Home screen greeting -
// sun, clouds, a school building with clock/flag, and flanking trees.
export function HeaderIllustration({ width = 240, height = 170 }: { width?: number; height?: number }) {
  return (
    <Svg width={width} height={height} viewBox="0 0 240 170">
      <Circle cx={190} cy={38} r={22} fill="#FDE9C8" opacity={0.85} />
      <Circle cx={190} cy={38} r={30} fill="#FDE9C8" opacity={0.3} />

      <Ellipse cx={70} cy={40} rx={34} ry={14} fill="#FFFFFF" opacity={0.55} />
      <Ellipse cx={140} cy={30} rx={26} ry={11} fill="#FFFFFF" opacity={0.5} />

      <Ellipse cx={120} cy={158} rx={95} ry={9} fill="#DCD3F7" opacity={0.4} />

      <Rect x={30} y={110} width={7} height={26} rx={2} fill="#B9A6F0" opacity={0.4} />
      <Circle cx={34} cy={98} r={19} fill="#B7E4C7" opacity={0.65} />
      <Circle cx={20} cy={110} r={13} fill="#A3DBB4" opacity={0.6} />

      <Rect x={196} y={112} width={7} height={24} rx={2} fill="#B9A6F0" opacity={0.4} />
      <Circle cx={200} cy={100} r={17} fill="#B7E4C7" opacity={0.65} />
      <Circle cx={214} cy={112} r={11} fill="#A3DBB4" opacity={0.6} />

      <Rect x={78} y={78} width={86} height={60} rx={6} fill="#FFFFFF" opacity={0.85} stroke="#C9BCEF" strokeWidth={1.5} />
      <Polygon points="72,78 121,42 170,78" fill="#C6B6F5" opacity={0.85} />
      <Circle cx={121} cy={42} r={9} fill="#FFFFFF" opacity={0.9} stroke="#C6B6F5" strokeWidth={1.5} />
      <Line x1={121} y1={38} x2={121} y2={42} stroke="#8B7CB8" strokeWidth={1.2} opacity={0.85} />
      <Line x1={121} y1={42} x2={124} y2={42} stroke="#8B7CB8" strokeWidth={1.2} opacity={0.85} />
      <Line x1={121} y1={30} x2={121} y2={14} stroke="#8B7CB8" strokeWidth={1.5} opacity={0.85} />
      <Polygon points="121,14 135,19 121,24" fill="#F2A65A" opacity={0.9} />

      <Rect x={88} y={90} width={13} height={13} rx={2} fill="#E4D9FB" opacity={0.9} />
      <Rect x={141} y={90} width={13} height={13} rx={2} fill="#E4D9FB" opacity={0.9} />
      <Rect x={112} y={112} width={20} height={26} rx={3} fill="#C6B6F5" opacity={0.9} />
    </Svg>
  );
}
