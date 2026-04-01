import { Progress } from '../ui/progress';

interface ScorePanelProps {
  scores: {
    relevance: number;
    keywords: number;
    structure: number;
    quantification: number;
  };
  className?: string;
}

export function ScorePanel({ scores, className = '' }: ScorePanelProps) {
  const dimensions = [
    { name: '相关性', key: 'relevance' as const, color: 'bg-blue-500' },
    { name: '关键词匹配', key: 'keywords' as const, color: 'bg-green-500' },
    { name: '结构完整性', key: 'structure' as const, color: 'bg-yellow-500' },
    { name: '量化表达', key: 'quantification' as const, color: 'bg-purple-500' },
  ];

  return (
    <div className={`space-y-4 ${className}`}>
      {dimensions.map((dim) => (
        <div key={dim.key} className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">{dim.name}</span>
            <span className="text-muted-foreground">{scores[dim.key]}/100</span>
          </div>
          <div className="relative">
            <Progress value={scores[dim.key]} className="h-2" />
            <div 
              className={`absolute top-0 left-0 h-2 rounded-full transition-all ${dim.color}`}
              style={{ width: `${scores[dim.key]}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
