# Agent Engineering Framework

> 9-layer 知识地图。活文档，随领域演化更新。

> **命名参考业界术语**：Agent Harness（LangChain / MongoDB / Firecrawl / arXiv 2603.05344 通用）

---

## 心智模型：演进路径

不是"9 层堆在一起"，而是**一步一步加能力**。每一"+X"都是对前一阶段限制的回应：

```
LLM                                              2020
  │ + Prompt Engineering                        2022
  ▼                                                (CoT, system prompt)
Prompted LLM
  │ + Tool Use / Function Calling               2023
  ▼
Tool-Using LLM
  │ + Agentic Loop (ReAct)                      2023
  ▼
Single Agent
  │ + Memory / RAG                              2023-24
  ▼
Persistent Agent
  │ + Multi-Agent Orchestration                 2024
  ▼
Multi-Agent System
  │ + Harness Engineering                       2024-25
  ▼
Production-Grade Agent  ← 今天的 frontier
                              (Claude Code, Devin, Codex)
```

### 8 阶段详解

| # | 阶段 | 时期 | 加了什么 | 框架层 | 解决什么问题 | 代表里程碑 |
|---|---|---|---|---|---|---|
| 1 | **LLM** | 2020-22 | 基础文本生成 | L1 | — | GPT-3 (2020) |
| 2 | **+ Prompt** | 2022-23 | 行为塑形 | L2 | LLM 太"原始" | CoT (Jan 2022) |
| 3 | **+ Tool** | 2023 | 行动能力 | L5 | LLM 只能说不能做 | Function Calling (2023) |
| 4 | **+ Loop** | 2023 | 自主循环 | L8 > Loop | 单次回答不能完成多步 | ReAct (2022 paper, 2023 落地) |
| 5 | **+ Memory** | 2023-24 | 持续记忆 | L4 | agent 每次从零开始 | RAG, vector DB |
| 6 | **+ Multi** | 2024 | 多 agent 协作 | L6 | 单 agent 处理不了复杂任务 | AutoGen, CrewAI (2024) |
| 7 | **+ Harness** | 2024-25 | 系统工程 | L8 | 整套 agent 跑不稳 | ECC, Claude Code, OpenAI Agents SDK |
| 8 | **= Frontier** | 2026+ | 生产级应用 | L9 | — | Claude Code, Devin, Codex |

### 关键洞察

- **L8 Harness 不是一开始就有**——它是其他层成熟后**事后总结的纪律**，不是设计的起点
- 每一"+X"都是对前一阶段**实际限制**的回应（LLM 不够好 → 加 prompt；单次回答不够 → 加 loop；agent 失忆 → 加 memory）
- **9 层是横向切面**（同时存在的组件），**演进是纵向时序**（先后发明的历史）—— 两种视图互补
- 你现在学 agent，本质是**从 L1 出发，按这张演进图逐层补上**

---

## 9 层详解

### 🧱 L1 模型层
LLM 本身的能力边界
- 主流模型横评（GPT / Claude / Gemini / Mistral / 开源）
- Context window、tokens、cost 模型
- 能力上限 / 典型失败模式

### 💬 L2 交互层
- Messages 结构（system / user / assistant / tool）
- Prompt 工程
- Function calling schema
- Streaming、结构化输出（JSON mode、tool use）

### 🧠 L3 推理层
- CoT、ToT
- ReAct、Plan-and-Execute、Reflexion
- 任务分解

### 💾 L4 记忆层
- Context window 管理
- RAG（vector DB / BM25 / hybrid）
- 长期 vs 短期 / episodic vs semantic
- 摘要压缩
- "Memory as a tool" vs "Memory as state"

### 🔧 L5 工具层
- Function calling 机制
- 工具设计原则（原子、可组合、类型化）
- MCP（Model Context Protocol）
- 代码沙箱、浏览器 / GUI / 文件系统 / shell

### 🤝 L6 编排层
- 单 agent 循环
- 拓扑：supervisor / swarm / hierarchical
- Handoff、消息传递、共享状态
- 框架：LangGraph / OpenAI Agents SDK / CrewAI / Pydantic AI

### 🏭 L7 生产层
- 可观测性（trace / span / LangSmith / Langfuse）
- 评估（offline evals + online metrics）
- 成本 / 延迟、caching
- 安全（guardrails、prompt injection 防御）
- 错误处理、重试、降级

### 🟢 L8 Harness（系统工程）
**定义**：包裹 LLM 的整个工程系统。*"Agent = Model + Harness"*（LangChain）

**子组件**：

**1. Context Engineering** — 给模型正确的"输入面"
- Token 管理（预算、压缩、剪枝）
- System prompt 构造
- 历史消息组装
- 主动遗忘（active pruning）

**2. Tool Orchestration** — 工具的包装与调度
- 动态 scoping（什么时候暴露哪些工具）
- 沙箱（sandboxing）
- 参数校验
- 错误处理与重试

**3. State & Memory** — 跨时间的连续性
- 持久化状态
- Checkpoint-resume
- Progress files
- 跨 session 记忆

**4. Verification & Safety** — 可信地工作
- 输出检查
- Silent failure 检测
- Guardrails
- Prompt injection 防御

**5. Agentic Loop** — Runtime 行为（harness 内部）
- **Inner Loop**：单轮 think → act → observe
- **Task Loop**：多轮任务完成
- **Meta Loop**：跨任务规划 / 反思 / 学习

**6. Observability** — 看清楚 agent 在干什么
- Trace / Span
- 决策日志
- 性能指标

**7. Cost & Latency** — 经济上可行
- Token 预算
- 模型降级
- Caching
- 并行化

**Mantra**: *"The harness is the new prompt."* —— 模型越来越强，harness 决定上限。

### 🎯 L9 应用层
具体 agent 形态（frontier）
- 编码 agent（Claude Code、Cursor、Codex）
- 浏览器 agent（Browserbase、Stagehand）
- 研究 agent
- 工作流自动化
- 垂直应用（客服、销售、运维...）

---

## 跨层概念

| 概念        | 涉及层             | 是什么                              |
|-------------|--------------------|-------------------------------------|
| **Context** | L2 + L4 + L8       | 实际送进 prompt 的全部内容（L8 主导）|
| **Tool**    | L5 + L2 + L8       | 行动能力 + 调用约定 + 错误处理（L8 主导）|
| **Trace**   | L7 + L8            | 全链路记录（L8 主导）               |
| **Eval**    | L7                 | 离线 + 在线，反馈循环               |
