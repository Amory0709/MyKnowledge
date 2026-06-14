# Agent Learning Workspace 🌀

> 我的 agent 工程学习 workspace。从这里开始。

---

## 📚 文档索引

### 核心知识地图
- **[framework.md](./framework.md)** — 9 层 Agent Engineering Framework（顶层知识地图，2026-06 建）

### 学习路线
- **[ai-agent-from-scratch.md](./ai-agent-from-scratch.md)** — 从零搭建 Agent（4 阶段路线图）

### 调研笔记
- **[ai-agent-research.md](./ai-agent-research.md)** — Agent 领域研究（Memento / Supermemory / Hive Mind）
- **[ecc-agent-harness.md](./ecc-agent-harness.md)** — ECC 系统（Agent Harness 性能优化）
- **[openmythos.md](./openmythos.md)** — OpenMythos 架构研究（RDT / MoE）

### 工作目录
- **[cards/](./cards/)** — 概念卡片（每张讲清一个概念）
- **[inbox/](./inbox/)** — 每日信息收集（标题 + 一句话 + 链接）
- **[weekly/](./weekly/)** — 每周复盘

---

## 📑 笔记按层索引

| 层 | 笔记 |
|---|---|
| **L1 模型** | [openmythos.md](./openmythos.md) — RDT 架构 |
| **L4 记忆** | [ai-agent-research.md](./ai-agent-research.md) — Memento / Supermemory |
| **L6 编排** | [ai-agent-research.md](./ai-agent-research.md) — Hive Mind |
| **L9 Harness** | [ecc-agent-harness.md](./ecc-agent-harness.md) — ECC 系统 |
| **路线图** | [ai-agent-from-scratch.md](./ai-agent-from-scratch.md) — 4 阶段路线 |

**待补层**：L2 交互 / L3 推理 / L5 工具 / L7 生产 / L8 应用

---

## 🎯 9 层框架速览

| 层 | 名称 | 一句话 |
|---|---|---|
| **L9** | Harness | 包裹 LLM 的整个工程系统 |
| L8 | 应用 | 具体 agent 形态（编码/浏览器/研究...） |
| L7 | 生产 | 可观测性 / 评估 / 成本 / 安全 |
| L6 | 编排 | 多 agent 协作 + 框架 |
| L5 | 工具 | Function calling / MCP / 沙箱 |
| L4 | 记忆 | RAG / episodic / semantic |
| L3 | 推理 | CoT / ReAct / Reflexion |
| L2 | 交互 | Messages / Prompt / Schema |
| L1 | 模型 | LLM 本身 |

完整内容 → [framework.md](./framework.md)

---

## 🗂️ 工作流

**每天（< 5 分钟）**
- 看到 agent 相关推文/文章/视频 → 丢进 `inbox/YYYY-MM-DD.md`
- 格式：`- [标题](链接) — 一句话摘要`

**周末（30-60 分钟）**
- Triage inbox：⭐ 必学 / 📖 感兴趣 / 🗑 跳过
- ⭐ 项目 → 在 `cards/<concept>.md` 写一张概念卡片
- 在 `weekly/YYYY-Wxx.md` 复盘

**新概念写卡片时**
- 标 `主层: Lx`、`跨层: Ly, Lz`
- 跨层关系标注清楚
- 找已有的笔记关联（[ai-agent-from-scratch.md](./ai-agent-from-scratch.md) 等）

---

## 🔗 与 Ori 的协作

我在 `~/.openclaw/topSecret/myOffice/memory/agent-learning/` 下有镜像。Ori 能直接读取这个仓库的笔记。

需要 Ori 帮忙时：
- **苏格拉底教练**：扔解释给 Ori，追问逼真懂
- **卡片生成器**：扔文章给 Ori，提炼成卡片
- **关联分析师**：学了一个概念，Ori 帮找连接
- **代码 reviewer**：写 demo，Ori 挑刺

---

_Last updated: 2026-06-14_
