import { Progress } from '../ui/progress';

interface RubricScoreProps {
  scores: {
    completeness: number;
    accuracy: number;
    depth: number;
    clarity: number;
  };
  className?: string;
}

export function RubricScore({ scores, className = '' }: RubricScoreProps) {
  const dimensions = [
    { name: '完整性', key: 'completeness' as const },
    { name: '准确性', key: 'accuracy' as const },
    { name: '深度', key: 'depth' as const },
    { name: '表达清晰度', key: 'clarity' as const },
  ];

  return (
    <div className={`space-y-3 ${className}`}>
      {dimensions.map((dim) => (
        <div key={dim.key} className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span>{dim.name}</span>
            <span className="font-medium">{scores[dim.key]}/100</span>
          </div>
          <Progress value={scores[dim.key]} className="h-2" />
        </div>
      ))}
    </div>
  );
}
