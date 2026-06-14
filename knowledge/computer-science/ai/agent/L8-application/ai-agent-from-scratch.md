---
type: 路线图
covers: [L1, L2, L3, L4, L5, L6, L7, L8, L9]
tags: [roadmap, learning-path, scratch, from-zero]
date: 2026-06-14
---

# AI Agent 从零搭建

> 学习从工程角度搭建一个生产级别的 AI Agent 系统

---

## 🎯 目标

从零开始，理解并实现一个可用的 Agent 系统

## 📚 学习路线

### Phase 1：基础概念（1-2天）
- [ ] 理解 Agent 核心要素：LLM + Tools + Memory + Planning
- [ ] 8个设计模式：Prompt Chainer / Router / Parallel / Orchestrator / Evaluator-Optimizer / ReAct / Human-in-the-Loop / Semantic Router
- [ ] 参考：Google Agent Design Patterns

### Phase 2：最小可运行 Agent（3-5天）
- [ ] 用 Python + OpenAI 构建最简 Agent（ReAct 模式）
- [ ] 实现 Tool Calling
- [ ] 加 Memory（简单会话历史）
- [ ] 参考：Microsoft AI Agents for Beginners

### Phase 3：多 Agent 协作（5-7天）
- [ ] Router 模式：意图识别 + 分发
- [ ] Orchestrator-Workers 模式
- [ ] 并行执行
- [ ] 参考：ECC 系统（60+ 子 agent）

### Phase 4：生产级改进（持续）
- [ ] Memory 持久化（向量数据库）
- [ ] Human-in-the-Loop 安全机制
- [ ] Evaluator-Optimizer 自动优化
- [ ] Hooks 系统（参考 ECC hooks）
- [ ] 监控、日志、重试机制

---

## 📖 参考资料

| 资源 | 链接 |
|------|------|
| Google 设计模式 | https://docs.cloud.google.com/architecture/choose-design-pattern-agentic-ai-system |
| Microsoft 课程 | https://github.com/microsoft/ai-agents-for-beginners |
| ECC 系统 | https://github.com/affaan-m/ECC |

---

## 🗂️ 项目结构

```
ai-agent-from-scratch/
├── 01-basics/           # Phase 1 笔记
├── 02-minimal-agent/     # Phase 2 代码
├── 03-multi-agent/      # Phase 3 代码
└── 04-production/      # Phase 4 改进
```

---

## 💡 核心认知

1. **Agent = LLM + Tools + Memory + Planning**
2. **ReAct 是基础**：推理 → 行动 → 观察 → 反思
3. **从简单开始**：先跑起来，再迭代复杂
4. **Design Pattern > 框架**：先理解模式，再选工具