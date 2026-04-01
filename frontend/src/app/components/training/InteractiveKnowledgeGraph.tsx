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
import { CheckCircle2, Circle, Play, Search, Filter, X } from 'lucide-react';
import { useNavigate } from 'react-router';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';

interface KnowledgeItem {
  id: string;
  title: string;
  difficulty: string;
  estimatedTime: string;
  status: 'completed' | 'in-progress' | 'pending';
  dependencies?: string[];
  category?: string;
}

interface InteractiveKnowledgeGraphProps {
  knowledgeItems: KnowledgeItem[];
  planId: string;
}

// 自定义节点组件
function SearchableKnowledgeNode({ data, selected }: { data: any; selected: boolean }) {
  const navigate = useNavigate();
  
  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'completed':
        return {
          bg: 'bg-gradient-to-br from-green-400 to-green-600',
          border: 'border-green-700',
        };
      case 'in-progress':
        return {
          bg: 'bg-gradient-to-br from-blue-400 to-blue-600',
          border: 'border-blue-700',
        };
      default:
        return {
          bg: 'bg-gradient-to-br from-gray-300 to-gray-500',
          border: 'border-gray-600',
        };
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

  const statusStyle = getStatusStyle(data.status);
  const isHighlighted = data.isHighlighted;
  const isDimmed = data.isDimmed;

  return (
    <div
      onClick={() => navigate(`/training/${data.planId}/items/${data.id}`)}
      className="cursor-pointer group"
    >
      <div 
        className={`
          ${statusStyle.bg} ${statusStyle.border} 
          px-4 py-3 rounded-xl border-2 
          shadow-lg hover:shadow-xl
          transition-all duration-200
          min-w-[180px] max-w-[220px]
          ${selected ? 'scale-110 shadow-2xl ring-4 ring-white' : ''}
          ${isHighlighted ? 'ring-4 ring-yellow-400 scale-105' : ''}
          ${isDimmed ? 'opacity-30' : 'opacity-100'}
        `}
      >
        <div className="flex items-center justify-between mb-2">
          {getStatusIcon(data.status)}
          <Badge variant="secondary" className="text-xs bg-white/20 text-white border-white/30">
            {data.difficulty}
          </Badge>
        </div>
        
        <div className="text-sm font-semibold text-white line-clamp-2 mb-1">
          {data.title}
        </div>
        
        <div className="flex items-center justify-between text-xs text-white/90">
          <span>{data.estimatedTime}</span>
          {data.category && (
            <span className="px-1.5 py-0.5 bg-white/20 rounded">
              {data.category}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

const nodeTypes: NodeTypes = {
  knowledgeNode: SearchableKnowledgeNode,
};

export function InteractiveKnowledgeGraph({ 
  knowledgeItems, 
  planId 
}: InteractiveKnowledgeGraphProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>(['completed', 'in-progress', 'pending']);
  const [selectedDifficulties, setSelectedDifficulties] = useState<string[]>(['简单', '中等', '困难']);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  // 获取所有唯一的分类
  const allCategories = useMemo(() => {
    const categories = new Set(knowledgeItems.map(item => item.category).filter(Boolean));
    return Array.from(categories) as string[];
  }, [knowledgeItems]);

  // 初始化选中所有分类
  useMemo(() => {
    if (allCategories.length > 0 && selectedCategories.length === 0) {
      setSelectedCategories(allCategories);
    }
  }, [allCategories, selectedCategories.length]);

  // 过滤项目
  const filteredItems = useMemo(() => {
    return knowledgeItems.filter(item => {
      const matchesSearch = searchQuery === '' || 
        item.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = selectedStatuses.includes(item.status);
      const matchesDifficulty = selectedDifficulties.includes(item.difficulty);
      const matchesCategory = !item.category || selectedCategories.includes(item.category);
      
      return matchesSearch && matchesStatus && matchesDifficulty && matchesCategory;
    });
  }, [knowledgeItems, searchQuery, selectedStatuses, selectedDifficulties, selectedCategories]);

  // 生成节点
  const generateNodes = useCallback((): Node[] => {
    const levelWidth = 300;
    const levelHeight = 150;
    const itemsByLevel: { [key: number]: KnowledgeItem[] } = {};
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

    knowledgeItems.forEach(item => {
      const level = calculateLevel(item);
      if (!itemsByLevel[level]) {
        itemsByLevel[level] = [];
      }
      itemsByLevel[level].push(item);
    });

    const nodes: Node[] = [];
    const filteredIds = new Set(filteredItems.map(item => item.id));
    const highlightedIds = searchQuery 
      ? new Set(filteredItems.map(item => item.id))
      : new Set();

    Object.entries(itemsByLevel).forEach(([level, items]) => {
      const levelNum = parseInt(level);
      items.forEach((item, index) => {
        const totalInLevel = items.length;
        const xOffset = (index - (totalInLevel - 1) / 2) * levelWidth;
        
        const isInFilteredSet = filteredIds.has(item.id);
        const isHighlighted = searchQuery !== '' && highlightedIds.has(item.id);
        const isDimmed = !isInFilteredSet;
        
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
            isHighlighted,
            isDimmed,
          },
          hidden: false, // 保持所有节点可见，只是改变不透明度
        });
      });
    });

    return nodes;
  }, [knowledgeItems, planId, filteredItems, searchQuery]);

  // 生成边
  const generateEdges = useCallback((): Edge[] => {
    const edges: Edge[] = [];
    const filteredIds = new Set(filteredItems.map(item => item.id));
    
    knowledgeItems.forEach(item => {
      if (item.dependencies && item.dependencies.length > 0) {
        item.dependencies.forEach(depId => {
          const isVisible = filteredIds.has(item.id) && filteredIds.has(depId);
          const isCompleted = item.status === 'completed';
          const isActive = item.status === 'in-progress';
          
          edges.push({
            id: `${depId}-${item.id}`,
            source: depId,
            target: item.id,
            type: 'smoothstep',
            animated: isActive && isVisible,
            style: { 
              stroke: isCompleted ? '#22c55e' : isActive ? '#3b82f6' : '#9ca3af',
              strokeWidth: isActive ? 3 : 2,
              opacity: isVisible ? 1 : 0.1,
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
  }, [knowledgeItems, filteredItems]);

  const initialNodes = useMemo(() => generateNodes(), [generateNodes]);
  const initialEdges = useMemo(() => generateEdges(), [generateEdges]);

  const [nodes] = useNodesState(initialNodes);
  const [edges] = useEdgesState(initialEdges);

  const handleStatusToggle = (status: string) => {
    setSelectedStatuses(prev => 
      prev.includes(status) 
        ? prev.filter(s => s !== status)
        : [...prev, status]
    );
  };

  const handleDifficultyToggle = (difficulty: string) => {
    setSelectedDifficulties(prev => 
      prev.includes(difficulty) 
        ? prev.filter(d => d !== difficulty)
        : [...prev, difficulty]
    );
  };

  const handleCategoryToggle = (category: string) => {
    setSelectedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const clearAllFilters = () => {
    setSearchQuery('');
    setSelectedStatuses(['completed', 'in-progress', 'pending']);
    setSelectedDifficulties(['简单', '中等', '困难']);
    setSelectedCategories(allCategories);
  };

  return (
    <div className="w-full h-full min-h-[600px] bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl overflow-hidden">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.4}
        maxZoom={1.5}
        defaultViewport={{ x: 0, y: 0, zoom: 0.75 }}
        connectionLineType={ConnectionLineType.SmoothStep}
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#d1d5db" gap={20} size={1} />
        <Controls className="bg-white shadow-lg rounded-lg" />
        <MiniMap
          nodeColor={(node) => {
            if (node.data.isDimmed) return '#e5e7eb';
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
        
        {/* 搜索和过滤面板 */}
        <Panel position="top-left" className="bg-white rounded-lg shadow-lg p-4 m-3 w-80">
          <div className="space-y-3">
            {/* 搜索框 */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜索知识点..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-9"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                  onClick={() => setSearchQuery('')}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>

            {/* 过滤器 */}
            <div className="flex gap-2">
              {/* 状态过滤 */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="flex-1">
                    <Filter className="mr-2 h-3 w-3" />
                    状态 ({selectedStatuses.length})
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuLabel>选择状态</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuCheckboxItem
                    checked={selectedStatuses.includes('pending')}
                    onCheckedChange={() => handleStatusToggle('pending')}
                  >
                    待学习
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={selectedStatuses.includes('in-progress')}
                    onCheckedChange={() => handleStatusToggle('in-progress')}
                  >
                    进行中
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={selectedStatuses.includes('completed')}
                    onCheckedChange={() => handleStatusToggle('completed')}
                  >
                    已完成
                  </DropdownMenuCheckboxItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* 难度过滤 */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="flex-1">
                    <Filter className="mr-2 h-3 w-3" />
                    难度 ({selectedDifficulties.length})
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuLabel>选择难度</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuCheckboxItem
                    checked={selectedDifficulties.includes('简单')}
                    onCheckedChange={() => handleDifficultyToggle('简单')}
                  >
                    简单
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={selectedDifficulties.includes('中等')}
                    onCheckedChange={() => handleDifficultyToggle('中等')}
                  >
                    中等
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={selectedDifficulties.includes('困难')}
                    onCheckedChange={() => handleDifficultyToggle('困难')}
                  >
                    困难
                  </DropdownMenuCheckboxItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* 清除所有过滤器 */}
            {(searchQuery || selectedStatuses.length < 3 || selectedDifficulties.length < 3) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllFilters}
                className="w-full"
              >
                <X className="mr-2 h-3 w-3" />
                清除所有过滤
              </Button>
            )}

            {/* 结果统计 */}
            <div className="pt-2 border-t text-xs text-muted-foreground">
              显示 {filteredItems.length} / {knowledgeItems.length} 个知识点
            </div>
          </div>
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
