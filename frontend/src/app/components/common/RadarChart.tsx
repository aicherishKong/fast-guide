import { Radar, RadarChart as RechartsRadar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';

interface RadarChartProps {
  data: {
    dimension: string;
    score: number;
  }[];
  className?: string;
}

export function RadarChart({ data, className = '' }: RadarChartProps) {
  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsRadar data={data}>
          <PolarGrid stroke="#e5e7eb" />
          <PolarAngleAxis 
            dataKey="dimension" 
            tick={{ fill: '#6b7280', fontSize: 12 }}
          />
          <PolarRadiusAxis 
            angle={90} 
            domain={[0, 100]}
            tick={{ fill: '#6b7280', fontSize: 10 }}
          />
          <Radar 
            name="得分" 
            dataKey="score" 
            stroke="#3b82f6" 
            fill="#3b82f6" 
            fillOpacity={0.6}
          />
        </RechartsRadar>
      </ResponsiveContainer>
    </div>
  );
}
