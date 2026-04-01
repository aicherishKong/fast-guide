import { useCallback, useState, useMemo } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Panel,
  MarkerType,
  NodeTypes,
  ConnectionLineType,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { CheckCircle2, Circle, Play, Info, Clock, Zap } from 'lucide-react';
import { useNavigate } from 'react-router';
import { Badge } from '../ui/badge';
import { Card } from '../ui/card';

interface KnowledgeItem {
  id: string;
  title: string;
  difficulty: string;
  estimatedTime: string;
  status: 'completed' | 'in-progress' | 'pending';
  dependencies?: string[];
  category?: string;
}

interface AdvancedKnowledgeGraphProps {
  knowledgeItems: KnowledgeItem[];
  planId: string;
  showStats?: boolean;
}

// 增强的自定义节点组件
function AdvancedKnowledgeNode({ data, selected }: { data: any; selected: boolean }) {
  const navigate = useNavigate();
  
  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'completed':
        return {
          bg: 'bg-gradient-to-br from-green-400 to-green-600',
          border: 'border-green-700',
          shadow: 'shadow-green-500/50',
        };
      case 'in-progress':
        return {
          bg: 'bg-gradient-to-br from-blue-400 to-blue-600',
          border: 'border-blue-700',
          shadow: 'shadow-blue-500/50',
        };
      default:
        return {
          bg: 'bg-gradient-to-br from-gray-300 to-gray-500',
          border: 'border-gray-600',
          shadow: 'shadow-gray-400/50',
        };
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-5 w-5 text-white" />;
      case 'in-progress':
        return <Play className="h-5 w-5 text-white" />;
      default:
        return <Circle className="h-5 w-5 text-white" />;
    }
  };

  const getDifficultyIcon = (difficulty: string) => {
    switch (difficulty) {
      case '困难':
        return <Zap className="h-3 w-3" />;
      default:
        return <Info className="h-3 w-3" />;
    }
  };

  const statusStyle = getStatusStyle(data.status);

  return (
    <div
      onClick={() => navigate(`/training/${data.planId}/items/${data.id}`)}
      className="cursor-pointer group"
    >
      <div 
        className={`
          ${statusStyle.bg} ${statusStyle.border} 
          px-5 py-4 rounded-xl border-2 
          shadow-lg ${selected ? statusStyle.shadow + ' shadow-2xl scale-105' : 'hover:shadow-xl'}
          transition-all duration-200
          min-w-[200px] max-w-[240px]
        `}
      >
        {/* 头部图标和难度 */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1">
            {getStatusIcon(data.status)}
          </div>
          <div className="flex items-center gap-1 px-2 py-1 bg-white/20 rounded-md">
            {getDifficultyIcon(data.difficulty)}
            <span className="text-xs font-medium text-white">
              {data.difficulty}
            </span>
          </div>
        </div>
        
        {/* 标题 */}
        <div className="text-sm font-semibold text-white line-clamp-2 mb-2 leading-tight">
          {data.title}
        </div>
        
        {/* 底部时间和分类 */}
        <div className="flex items-center justify-between text-xs text-white/90">
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>{data.estimatedTime}</span>
          </div>
          {data.category && (
            <Badge variant="secondary" className="text-xs px-1.5 py-0 h-5 bg-white/20 text-white border-white/30">
              {data.category}
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}

const nodeTypes: NodeTypes = {
  knowledgeNode: AdvancedKnowledgeNode,
};

export function AdvancedKnowledgeGraph({ 
  knowledgeItems, 
  planId,
  showStats = true 
}: AdvancedKnowledgeGraphProps) {
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  // 生成节点位置（改进的层级布局算法）
  const generateNodes = useCallback((): Node[] => {
    const levelWidth = 320;
    const levelHeight = 180;
    const itemsByLevel: { [key: number]: KnowledgeItem[] } = {};

    // 计算每个节点的层级
    const itemLevels = new Map<string, number>();
    
    const calculateLevel = (item: KnowledgeItem): number => {
      if (itemLevels.has(item.id)) {
        return itemLevels.get(item.id)!;
      }

      if (!item.dependencies || item.dependencies.length === 0) {
        itemLevels.set(item.id, 0);
        return 0;
      }

      const maxDependencyLevel = Math.max(
        ...item.dependencies.map(depId => {
          const depItem = knowledgeItems.find(i => i.id === depId);
          return depItem ? calculateLevel(depItem) : 0;
        })
      );

      const level = maxDependencyLevel + 1;
      itemLevels.set(item.id, level);
      return level;
    };

    // 为所有项目计算层级
    knowledgeItems.forEach(item => {
      const level = calculateLevel(item);
      if (!itemsByLevel[level]) {
        itemsByLevel[level] = [];
      }
      itemsByLevel[level].push(item);
    });

    // 生成节点
    const nodes: Node[] = [];
    Object.entries(itemsByLevel).forEach(([level, items]) => {
      const levelNum = parseInt(level);
      items.forEach((item, index) => {
        const totalInLevel = items.length;
        const xOffset = (index - (totalInLevel - 1) / 2) * levelWidth;
        
        nodes.push({
          id: item.id,
          type: 'knowledgeNode',
          position: { 
            x: xOffset,
            y: levelNum * levelHeight 
          },
          data: {
            ...item,
            planId,
          },
        });
      });
    });

    return nodes;
  }, [knowledgeItems, planId]);

  // 生成边（增强样式）
  const generateEdges = useCallback((): Edge[] => {
    const edges: Edge[] = [];
    
    knowledgeItems.forEach(item => {
      if (item.dependencies && item.dependencies.length > 0) {
        item.dependencies.forEach(depId => {
          const isCompleted = item.status === 'completed';
          const isActive = item.status === 'in-progress';
          
          edges.push({
            id: `${depId}-${item.id}`,
            source: depId,
            target: item.id,
            type: 'smoothstep',
            animated: isActive,
            style: { 
              stroke: isCompleted ? '#22c55e' : isActive ? '#3b82f6' : '#9ca3af',
              strokeWidth: isActive ? 3 : 2,
            },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              width: 20,
              height: 20,
              color: isCompleted ? '#22c55e' : isActive ? '#3b82f6' : '#9ca3af',
            },
          });
        });
      }
    });

    return edges;
  }, [knowledgeItems]);

  const initialNodes = useMemo(() => generateNodes(), [generateNodes]);
  const initialEdges = useMemo(() => generateEdges(), [generateEdges]);

  const [nodes] = useNodesState(initialNodes);
  const [edges] = useEdgesState(initialEdges);

  // 统计数据
  const stats = useMemo(() => {
    const completed = knowledgeItems.filter(i => i.status === 'completed').length;
    const inProgress = knowledgeItems.filter(i => i.status === 'in-progress').length;
    const pending = knowledgeItems.filter(i => i.status === 'pending').length;
    const totalTime = knowledgeItems.reduce((sum, item) => {
      const minutes = parseInt(item.estimatedTime);
      return sum + (isNaN(minutes) ? 0 : minutes);
    }, 0);

    return { completed, inProgress, pending, totalTime };
  }, [knowledgeItems]);

  const onNodeClick = useCallback((_: any, node: Node) => {
    setSelectedNode(node.id);
  }, []);

  return (
    <div className="w-full h-full min-h-[600px] bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl overflow-hidden">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodeClick={onNodeClick}
        fitView
        minZoom={0.4}
        maxZoom={1.5}
        defaultViewport={{ x: 0, y: 0, zoom: 0.75 }}
        connectionLineType={ConnectionLineType.SmoothStep}
        proOptions={{ hideAttribution: true }}
      >
        <Background 
          color="#d1d5db" 
          gap={20}
          size={1}
        />
        <Controls className="bg-white shadow-lg rounded-lg" />
        <MiniMap
          nodeColor={(node) => {
            switch (node.data.status) {
              case 'completed':
                return '#22c55e';
              case 'in-progress':
                return '#3b82f6';
              default:
                return '#9ca3af';
            }
          }}
          maskColor="rgba(0, 0, 0, 0.1)"
          className="bg-white shadow-lg rounded-lg"
        />
        
        {/* 顶部面板 */}
        <Panel position="top-left" className="bg-white rounded-lg shadow-lg p-4 m-3 max-w-xs">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1 h-6 bg-blue-500 rounded-full" />
            <div>
              <div className="font-semibold">知识图谱可视化</div>
              <div className="text-xs text-muted-foreground">
                {knowledgeItems.length} 个知识点
              </div>
            </div>
          </div>
          
          {showStats && (
            <div className="space-y-2 pt-3 border-t">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">已完成</span>
                <span className="font-semibold text-green-600">{stats.completed}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">进行中</span>
                <span className="font-semibold text-blue-600">{stats.inProgress}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">待学习</span>
                <span className="font-semibold text-gray-600">{stats.pending}</span>
              </div>
              <div className="flex items-center justify-between text-sm pt-2 border-t">
                <span className="text-muted-foreground">预计总时长</span>
                <span className="font-semibold">{stats.totalTime} 分钟</span>
              </div>
            </div>
          )}
        </Panel>

        {/* 图例 */}
        <Panel position="bottom-right" className="bg-white rounded-lg shadow-lg p-3 m-3">
          <div className="text-xs font-medium mb-2">状态图例</div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-gradient-to-br from-gray-300 to-gray-500" />
              <span className="text-xs">待学习</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-gradient-to-br from-blue-400 to-blue-600" />
              <span className="text-xs">进行中</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-gradient-to-br from-green-400 to-green-600" />
              <span className="text-xs">已完成</span>
            </div>
          </div>
        </Panel>
      </ReactFlow>
    </div>
  );
}
