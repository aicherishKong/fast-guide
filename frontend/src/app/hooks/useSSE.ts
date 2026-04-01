import { useState, useCallback, useRef } from 'react';

interface UseSSEOptions {
  onChunk?: (chunk: string) => void;
  onDone?: () => void;
  onError?: (error: string) => void;
}

export function useSSE() {
  const [content, setContent] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  const startStreaming = useCallback((url: string, options: UseSSEOptions = {}) => {
    setIsStreaming(true);
    setError(null);
    setContent('');

    // Mock SSE 流式输出
    const mockContent = "这是模拟的流式内容输出。在真实环境中，这里会连接到后端的 SSE 接口，逐字输出AI生成的内容。";
    let index = 0;

    const interval = setInterval(() => {
      if (index < mockContent.length) {
        const char = mockContent[index];
        setContent(prev => prev + char);
        options.onChunk?.(char);
        index++;
      } else {
        clearInterval(interval);
        setIsStreaming(false);
        options.onDone?.();
      }
    }, 50);

    return () => {
      clearInterval(interval);
      setIsStreaming(false);
    };
  }, []);

  const reset = useCallback(() => {
    setContent('');
    setError(null);
    setIsStreaming(false);
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
  }, []);

  return {
    content,
    isStreaming,
    error,
    startStreaming,
    reset,
  };
}
