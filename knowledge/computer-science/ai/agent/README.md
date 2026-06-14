# Agent Learning Workspace 🌀

> 我的 agent 工程学习 workspace。从这里开始。

---

## 📚 核心文档

- **[framework.md](./framework.md)** — 9 层 Agent Engineering Framework（顶层知识地图，2026-06 建）
- **[framework.en.md](./framework.en.md)** — English version
- **[learning-loop.md](./learning-loop.md)** — 6 步学习 loop + 风险应对 + TODO

## 🗂️ 9 层文件夹

| 层 | 文件夹 | 主题 |
|---|---|---|
| **L9** | [L9-application/](./L9-application/) | 应用形态（frontier） |
| **L8** | [L8-harness/](./L8-harness/) | Harness（系统工程） |
| **L7** | [L7-production/](./L7-production/) | 生产化 |
| **L6** | [L6-orchestration/](./L6-orchestration/) | 编排 |
| **L5** | [L5-tools/](./L5-tools/) | 工具 |
| **L4** | [L4-memory/](./L4-memory/) | 记忆 |
| **L3** | [L3-reasoning/](./L3-reasoning/) | 推理 |
| **L2** | [L2-interaction/](./L2-interaction/) | 交互 |
| **L1** | [L1-model/](./L1-model/) | 模型 |

每层文件夹的 README 简介该层；该层相关笔记也放在这里。

## 🛠️ 工作目录

- **[cards/](./cards/)** — 概念卡片（每张讲清一个概念）
- **[inbox/](./inbox/)** — 每日信息收集（标题 + 一句话 + 链接）
- **[weekly/](./weekly/)** — 每周复盘

## 🎯 9 层框架速览

| 层 | 名称 | 一句话 |
|---|---|---|
| **L8** | Harness | 包裹 LLM 的整个工程系统 |
| **L9** | 应用 | 具体 agent 形态（frontier） |
| L7 | 生产 | 可观测性 / 评估 / 成本 / 安全 |
| L6 | 编排 | 多 agent 协作 + 框架 |
| L5 | 工具 | Function calling / MCP / 沙箱 |
| L4 | 记忆 | RAG / episodic / semantic |
| L3 | 推理 | CoT / ReAct / Reflexion |
| L2 | 交互 | Messages / Prompt / Schema |
| L1 | 模型 | LLM 本身 |

完整内容 → [framework.md](./framework.md)

## 🗂️ 工作流

### 看到新东西时（每天 < 5 分钟）
- 推文/文章/视频 → 丢进 `inbox/YYYY-MM-DD.md`
- 格式：`- [标题](链接) — 一句话摘要`

### 周末 triage（30-60 分钟）
- ⭐ 必学 → 转 `cards/<concept>.md` 或放进对应层文件夹
- 📖 感兴趣 → 排进下周
- 🗑 跳过 → 删

### 归档时问 3 个问题
1. **它解决哪一层的问题？**（主落点）
2. **它和哪几层有交互？**（跨层影响）
3. **我已知 vs 未知的边界在哪？**（⭐ 必学 vs 📖 感兴趣 vs 🗑 跳过）

### 归档示例

**新论文："Agent self-correction via trajectory reflection"**
- 主落点：L8 Harness > Verification & Safety
- 跨层：L3 推理 > Reflexion、L7 生产 > Eval
- 标签：⭐ 必学

**新发布："LangGraph v2 with built-in checkpointing"**
- 主落点：L8 Harness > State & Memory > Checkpoint
- 跨层：L6 编排（框架）、L7 生产
- 标签：📖 感兴趣

**新工具："MCP - Model Context Protocol"**
- 主落点：L8 Harness > Tool Orchestration
- 跨层：L5 工具（schema）
- 标签：⭐ 必学

### 📋 文档约定

- 笔记属于哪层 → 放进 `Lx-xxx/` 文件夹
- 概念卡片 → 放 `cards/<concept-name>.md`，文件名 kebab-case
- 卡片里标注：`主层: Lx`、`跨层: Ly, Lz`
- 每日 inbox → `inbox/YYYY-MM-DD.md`
- 每周复盘 → `weekly/YYYY-Wxx.md`
- 季度复盘 → 用 framework 当 checklist，看哪层还薄弱

## 🔗 与 Ori 的协作

我在 `~/.openclaw/topSecret/myOffice/memory/agent-learning/` 下有镜像。Ori 能直接读取这个仓库的笔记。

需要 Ori 帮忙时：
- **苏格拉底教练**：扔解释给 Ori，追问逼真懂
- **卡片生成器**：扔文章给 Ori，提炼成卡片
- **关联分析师**：学了一个概念，Ori 帮找连接
- **代码 reviewer**：写 demo，Ori 挑刺

---

_Last updated: 2026-06-14_
