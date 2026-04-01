# 05 产品原型规范

> 阶段目标：定义每个页面的布局、组件和交互细节，作为前端实现的依据。

## 输出文件清单

| 文件 | 内容 | 状态 |
|------|------|------|
| `prototype_spec.md` | 各页面的布局规范、组件说明、交互描述 | 待完成 |
| `component_list.md` | 全量组件清单、复用关系、Props 定义 | 待完成 |
| `design_tokens.md` | 颜色、字体、间距等 Design Token 定义 | 待完成 |

## 页面清单

| 页面 | 路由 | 优先级 |
|------|------|--------|
| 登录/注册 | `/login`, `/register` | P0 |
| 简历库 | `/resumes` | P0 |
| 简历优化 | `/resumes/:id/optimize` | P0 |
| 面试配置 | `/interviews/new` | P0 |
| 面试进行中 | `/interviews/:id/session` | P0 |
| 面试报告 | `/interviews/:id/report` | P0 |
| 训练计划 | `/training/:id` | P1 |
| 复测 | `/training/:id/retest` | P1 |
| 仪表板 | `/dashboard` | P2 |

## 完成标准

- [ ] P0 页面的原型规范全部完成
- [ ] 通用组件（ScoreRing、StreamingText 等）Props 定义完成
- [ ] Design Token 与 Tailwind 配置对应关系明确
