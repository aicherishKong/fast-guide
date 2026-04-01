import { useEffect, useState } from 'react';

interface StreamingTextProps {
  content: string;
  isStreaming: boolean;
  className?: string;
}

export function StreamingText({ content, isStreaming, className = '' }: StreamingTextProps) {
  const [showCursor, setShowCursor] = useState(true);

  useEffect(() => {
    if (!isStreaming) {
      setShowCursor(false);
      return;
    }

    const interval = setInterval(() => {
      setShowCursor(prev => !prev);
    }, 500);

    return () => clearInterval(interval);
  }, [isStreaming]);

  return (
    <div className={`whitespace-pre-wrap ${className}`}>
      {content}
      {isStreaming && (
        <span className={`inline-block w-0.5 h-5 bg-current ml-0.5 ${showCursor ? 'opacity-100' : 'opacity-0'}`} />
      )}
    </div>
  );
}
