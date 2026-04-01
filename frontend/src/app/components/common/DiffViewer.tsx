import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';

interface DiffViewerProps {
  original: string;
  modified: string;
  className?: string;
}

export function DiffViewer({ original, modified, className = '' }: DiffViewerProps) {
  const getDiff = () => {
    const origLines = original.split('\n');
    const modLines = modified.split('\n');
    const maxLines = Math.max(origLines.length, modLines.length);
    
    const diffs = [];
    for (let i = 0; i < maxLines; i++) {
      const origLine = origLines[i] || '';
      const modLine = modLines[i] || '';
      
      if (origLine !== modLine) {
        diffs.push({
          lineNum: i + 1,
          original: origLine,
          modified: modLine,
          type: !origLine ? 'added' : !modLine ? 'removed' : 'changed'
        });
      }
    }
    
    return diffs;
  };

  const diffs = getDiff();

  return (
    <div className={className}>
      <Tabs defaultValue="side-by-side">
        <TabsList className="mb-4">
          <TabsTrigger value="side-by-side">对比视图</TabsTrigger>
          <TabsTrigger value="original">原文</TabsTrigger>
          <TabsTrigger value="modified">改写版</TabsTrigger>
        </TabsList>

        <TabsContent value="side-by-side" className="space-y-0">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium text-sm text-muted-foreground mb-2">原文</h4>
              <div className="border rounded-lg p-4 bg-gray-50 max-h-96 overflow-y-auto">
                <pre className="whitespace-pre-wrap text-sm font-mono">{original}</pre>
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-sm text-muted-foreground mb-2">改写版</h4>
              <div className="border rounded-lg p-4 bg-green-50 max-h-96 overflow-y-auto">
                <pre className="whitespace-pre-wrap text-sm font-mono">{modified}</pre>
              </div>
            </div>
          </div>
          
          {diffs.length > 0 && (
            <div className="mt-4 border rounded-lg p-4">
              <h4 className="font-medium text-sm mb-2">改动摘要</h4>
              <div className="space-y-1 text-sm">
                {diffs.slice(0, 5).map((diff, idx) => (
                  <div key={idx} className={`p-2 rounded ${
                    diff.type === 'added' ? 'bg-green-100 text-green-800' :
                    diff.type === 'removed' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    <span className="font-mono">行 {diff.lineNum}: </span>
                    {diff.type === 'added' && '新增内容'}
                    {diff.type === 'removed' && '删除内容'}
                    {diff.type === 'changed' && '修改内容'}
                  </div>
                ))}
                {diffs.length > 5 && (
                  <p className="text-muted-foreground text-xs">还有 {diffs.length - 5} 处改动...</p>
                )}
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="original">
          <div className="border rounded-lg p-4 bg-gray-50 max-h-96 overflow-y-auto">
            <pre className="whitespace-pre-wrap text-sm font-mono">{original}</pre>
          </div>
        </TabsContent>

        <TabsContent value="modified">
          <div className="border rounded-lg p-4 bg-green-50 max-h-96 overflow-y-auto">
            <pre className="whitespace-pre-wrap text-sm font-mono">{modified}</pre>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
