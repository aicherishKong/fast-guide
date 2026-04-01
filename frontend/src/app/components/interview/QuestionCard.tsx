import { Badge } from '../ui/badge';
import { Clock } from 'lucide-react';

interface QuestionCardProps {
  question: string;
  type: string;
  suggestedTime: number;
  className?: string;
}

export function QuestionCard({ question, type, suggestedTime, className = '' }: QuestionCardProps) {
  return (
    <div className={`border rounded-lg p-6 bg-white ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        <Badge variant="outline">{type}</Badge>
        <span className="flex items-center gap-1 text-sm text-muted-foreground">
          <Clock className="h-3 w-3" />
          建议用时 {suggestedTime} 分钟
        </span>
      </div>
      <p className="text-lg leading-relaxed">{question}</p>
    </div>
  );
}
