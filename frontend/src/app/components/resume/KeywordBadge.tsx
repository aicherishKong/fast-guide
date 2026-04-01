import { Badge } from '../ui/badge';

interface KeywordBadgeProps {
  keyword: string;
  type: 'hit' | 'missing';
  onClick?: () => void;
}

export function KeywordBadge({ keyword, type, onClick }: KeywordBadgeProps) {
  return (
    <Badge
      variant={type === 'hit' ? 'default' : 'destructive'}
      className={`cursor-pointer ${
        type === 'hit' 
          ? 'bg-green-100 text-green-800 hover:bg-green-200 border-green-300' 
          : 'bg-red-100 text-red-800 hover:bg-red-200 border-red-300'
      }`}
      onClick={onClick}
    >
      {keyword}
    </Badge>
  );
}
