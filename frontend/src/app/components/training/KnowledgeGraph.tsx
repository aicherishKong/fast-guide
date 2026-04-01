import { useCallback, useMemo } from 'react';
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
} from 'reactflow';
import 'reactflow/dist/style.css';
import { CheckCircle2, Circle, Play } from 'lucide-react';
import { useNavigate } from 'react-router';

interface KnowledgeItem {
  id: string;
  title: string;
  difficulty: string;
  estimatedTime: string;
  status: 'completed' | 'in-progress' | 'pending';
  dependencies?: string[];
}

interface KnowledgeGraphProps {
  knowledgeItems: KnowledgeItem[];
  planId: string;
}

// 自定义节点组件
function KnowledgeNode({ data }: { data: any }) {
  const navigate = useNavigate();
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500 border-green-600';
      case 'in-progress':
        return 'bg-blue-500 border-blue-600';
      default:
        return 'bg-gray-300 border-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-white" />;
      case 'in-progress':
        return <Play className="h-4 w-4 text-white" />;
      default:
        return <Circle className="h-4 w-4 text-white" />;
    }
  };

  const statusColor = getStatusColor(data.status);

  return (
    <div
      onClick={() => navigate(`/training/${data.planId}/items/${data.id}`)}
      className="cursor-pointer group"
    >
      <div className={`px-4 py-3 rounded-lg border-2 ${statusColor} shadow-lg hover:shadow-xl transition-all min-w-[180px] max-w-[220px]`}>
        <div className="flex items-center gap-2 mb-1">
          {getStatusIcon(data.status)}
          <span className="text-xs font-medium text-white">
            {data.difficulty}
          </span>
        </div>
        <div className="text-sm font-medium text-white line-clamp-2 mb-1">
          {data.title}
        </div>
        <div className="text-xs text-white/80">{data.estimatedTime}</div>
      </div>
    </div>
  );
}

const nodeTypes: NodeTypes = {
  knowledgeNode: KnowledgeNode,
};

export function KnowledgeGraph({ knowledgeItems, planId }: KnowledgeGraphProps) {
  // 生成节点位置（层级布局）
  const generateNodes = useCallback((): Node[] => {
    const levelWidth = 300;
    const levelHeight = 150;
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

  // 生成边
  const generateEdges = useCallback((): Edge[] => {
    const edges: Edge[] = [];
    
    knowledgeItems.forEach(item => {
      if (item.dependencies && item.dependencies.length > 0) {
        item.dependencies.forEach(depId => {
          edges.push({
            id: `${depId}-${item.id}`,
            source: depId,
            target: item.id,
            type: 'smoothstep',
            animated: item.status === 'in-progress',
            style: { 
              stroke: item.status === 'completed' ? '#22c55e' : 
                     item.status === 'in-progress' ? '#3b82f6' : '#9ca3af',
              strokeWidth: 2,
            },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: item.status === 'completed' ? '#22c55e' : 
                     item.status === 'in-progress' ? '#3b82f6' : '#9ca3af',
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

  return (
    <div className="w-full h-full min-h-[500px] bg-gray-50 rounded-lg">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.5}
        maxZoom={1.5}
        defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#e5e7eb" gap={16} />
        <Controls />
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
        />
        <Panel position="top-left" className="bg-white/90 rounded-lg shadow-md p-3 m-2">
          <div className="text-sm font-medium mb-2">知识图谱</div>
          <div className="text-xs text-muted-foreground">点击节点查看详情</div>
        </Panel>
      </ReactFlow>
    </div>
  );
}
