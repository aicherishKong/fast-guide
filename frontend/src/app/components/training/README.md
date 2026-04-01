# 知识图谱可视化组件

本目录包含三个基于 React Flow 的知识图谱可视化组件，用于展示知识点之间的依赖关系和学习进度。

## 组件说明

### 1. KnowledgeGraph (基础版)
**文件**: `KnowledgeGraph.tsx`

最简单的知识图谱实现，适合快速集成。

**特性**:
- ✅ 节点状态可视化（待学习/进行中/已完成）
- ✅ 依赖关系展示
- ✅ 点击节点跳转
- ✅ 自动布局
- ✅ 迷你地图
- ✅ 缩放和平移控制

**使用示例**:
```tsx
import { KnowledgeGraph } from './components/training/KnowledgeGraph';

const knowledgeItems = [
  {
    id: '1',
    title: 'React Hooks 深入原理',
    difficulty: '中等',
    estimatedTime: '30 分钟',
    status: 'completed',
    dependencies: [],
  },
  // ... more items
];

<KnowledgeGraph 
  knowledgeItems={knowledgeItems} 
  planId="plan-1" 
/>
```

### 2. AdvancedKnowledgeGraph (增强版)
**文件**: `AdvancedKnowledgeGraph.tsx`

功能更丰富的知识图谱，提供更好的视觉效果和统计信息。

**特性**:
- ✅ 所有基础版功能
- ✅ 渐变色节点样式
- ✅ 节点选中高亮
- ✅ 动画边效果（进行中状态）
- ✅ 统计面板（完成数/进行中/总时长）
- ✅ 分类标签支持
- ✅ 难度图标
- ✅ 更精美的 UI 设计

**使用示例**:
```tsx
import { AdvancedKnowledgeGraph } from './components/training/AdvancedKnowledgeGraph';

<AdvancedKnowledgeGraph 
  knowledgeItems={knowledgeItems} 
  planId="plan-1"
  showStats={true}
/>
```

### 3. InteractiveKnowledgeGraph (交互式)
**文件**: `InteractiveKnowledgeGraph.tsx`

最完整的实现，包含搜索和过滤功能，适合大量知识点的场景。

**特性**:
- ✅ 所有增强版功能
- ✅ 实时搜索
- ✅ 多维度过滤（状态/难度/分类）
- ✅ 高亮匹配节点
- ✅ 淡化非匹配节点
- ✅ 过滤器组合
- ✅ 一键清除过滤
- ✅ 结果统计

**使用示例**:
```tsx
import { InteractiveKnowledgeGraph } from './components/training/InteractiveKnowledgeGraph';

<InteractiveKnowledgeGraph 
  knowledgeItems={knowledgeItems} 
  planId="plan-1"
/>
```

## 数据结构

所有组件都使用相同的数据结构：

```typescript
interface KnowledgeItem {
  id: string;                    // 唯一标识
  title: string;                 // 知识点标题
  difficulty: string;            // 难度等级（简单/中等/困难）
  estimatedTime: string;         // 预估学习时长
  status: 'completed' | 'in-progress' | 'pending';  // 学习状态
  dependencies?: string[];       // 依赖的知识点 ID 数组
  category?: string;             // 可选的分类标签
}
```

## 依赖关系说明

`dependencies` 字段定义了知识点之间的依赖关系：

```typescript
const knowledgeItems = [
  {
    id: '1',
    title: 'React 基础',
    dependencies: [],  // 无依赖，会显示在最上层
  },
  {
    id: '2',
    title: 'React Hooks',
    dependencies: ['1'],  // 依赖 React 基础
  },
  {
    id: '3',
    title: 'React 性能优化',
    dependencies: ['1', '2'],  // 依赖多个知识点
  },
];
```

## 布局算法

所有组件使用相同的层级布局算法（Layered Layout）：

1. **层级计算**: 无依赖的节点在第 0 层，有依赖的节点在其最大依赖层级 + 1
2. **水平分布**: 同一层的节点均匀分布
3. **自动适配**: 使用 `fitView` 自动调整视图以显示所有节点

## 样式定制

### 节点颜色

- 待学习: 灰色渐变 (`gray-300` → `gray-500`)
- 进行中: 蓝色渐变 (`blue-400` → `blue-600`)
- 已完成: 绿色渐变 (`green-400` → `green-600`)

### 边样式

- 待学习路径: 灰色静态线条
- 进行中路径: 蓝色动画线条
- 已完成路径: 绿色静态线条

## 最佳实践

### 1. 选择合适的组件

- **小型项目** (< 10 个知识点): 使用 `KnowledgeGraph`
- **中型项目** (10-30 个知识点): 使用 `AdvancedKnowledgeGraph`
- **大型项目** (> 30 个知识点): 使用 `InteractiveKnowledgeGraph`

### 2. 性能优化

```tsx
// 使用 useMemo 避免不必要的重新计算
const knowledgeItems = useMemo(() => [...], [dependencies]);

// 为大型图谱设置合适的初始缩放
<InteractiveKnowledgeGraph 
  knowledgeItems={knowledgeItems} 
  planId="plan-1"
  defaultViewport={{ x: 0, y: 0, zoom: 0.5 }}
/>
```

### 3. 响应式设计

```tsx
// 为图谱设置合适的高度
<div className="h-[500px] lg:h-[700px]">
  <AdvancedKnowledgeGraph {...props} />
</div>
```

### 4. 依赖关系建议

- 避免循环依赖
- 保持依赖层级不超过 5 层
- 每个节点的直接依赖不超过 3 个

## 事件处理

所有组件都支持点击节点跳转到详情页：

```tsx
// 节点点击会自动跳转到
navigate(`/training/${planId}/items/${nodeId}`)
```

## CSS 依赖

组件依赖 React Flow 的样式文件：

```tsx
import 'reactflow/dist/style.css';
```

确保在项目中正确导入。

## 进阶使用

### 自定义节点样式

可以通过修改 `nodeTypes` 来自定义节点外观：

```tsx
const customNodeTypes = {
  knowledgeNode: CustomKnowledgeNode,
};

<ReactFlow nodeTypes={customNodeTypes} {...props} />
```

### 添加自定义控制

使用 React Flow 的 `Panel` 组件添加自定义控制：

```tsx
<Panel position="top-right" className="custom-controls">
  <Button onClick={handleCustomAction}>自定义操作</Button>
</Panel>
```

## 故障排除

### 1. 节点不显示

- 检查 `knowledgeItems` 是否为空
- 确认 React Flow 样式已正确导入
- 检查容器是否设置了高度

### 2. 布局混乱

- 检查 `dependencies` 是否包含无效的 ID
- 确保没有循环依赖
- 尝试调整 `levelWidth` 和 `levelHeight` 参数

### 3. 性能问题

- 对于大型图谱（> 50 个节点），考虑分页或分组显示
- 使用 `useMemo` 优化数据计算
- 减少不必要的状态更新

## 相关文档

- [React Flow 官方文档](https://reactflow.dev)
- [项目设计规范](/src/imports/frontend_design_spec-v1.0.md)
