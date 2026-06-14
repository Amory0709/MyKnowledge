# Agent Engineering Framework

> 9-layer 知识地图。活文档，随领域演化更新。

> **命名参考业界术语**：Agent Harness（LangChain / MongoDB / Firecrawl / arXiv 2603.05344 通用）

---

## 心智模型：9 层

```
   ┌──────────────────────────────────────────┐
   │  L9 Harness (Harness Engineering)        │
   │  ├─ Context Engineering                   │
   │  ├─ Tool Orchestration                    │
   │  ├─ State & Memory                        │
   │  ├─ Verification & Safety                 │
   │  ├─ Agentic Loop                          │
   │  │   ├─ Inner Loop (单轮 think-act)       │
   │  │   ├─ Task Loop  (多轮任务)              │
   │  │   └─ Meta Loop  (跨任务规划/反思)       │
   │  ├─ Observability                         │
   │  └─ Cost & Latency                        │
   │──────────────────────────────────────────│
   │  L8 应用                                  │
   │  L7 生产    L4 记忆   L1 模型             │
   │  L6 编排    L3 推理   L2 交互             │
   │                L5 工具                    │
   └──────────────────────────────────────────┘
```

> **L9 = Harness**（行业术语）：包裹 LLM 的整个工程系统。Loop 是 harness 内的 runtime 行为，不是独立的"层"。
>
> **L8 = 应用形态**：具体的 agent 类型（编码、浏览器、研究...）。
>
> **L1-L7 = 组件层**：模型、交互、推理、记忆、工具、编排、生产。

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

### 🎯 L8 应用层
具体 agent 形态
- 编码 agent（Claude Code、Cursor、Codex）
- 浏览器 agent（Browserbase、Stagehand）
- 研究 agent
- 工作流自动化
- 垂直应用（客服、销售、运维...）

### 🟢 L9 Harness（系统工程）
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

---

## 跨层概念

| 概念        | 涉及层             | 是什么                              |
|-------------|--------------------|-------------------------------------|
| **Context** | L2 + L4 + L9       | 实际送进 prompt 的全部内容（L9 主导）|
| **Tool**    | L5 + L2 + L9       | 行动能力 + 调用约定 + 错误处理（L9 主导）|
| **Trace**   | L7 + L9            | 全链路记录（L9 主导）               |
| **Eval**    | L7                 | 离线 + 在线，反馈循环               |

---

## 怎么用（每天新增内容时）

问 3 个问题：

1. **它解决哪一层的问题？**（主落点）
2. **它和哪几层有交互？**（跨层影响）
3. **我已知 vs 未知的边界在哪？**（⭐ 必学 vs 📖 感兴趣 vs 🗑 跳过）

### 示例

**新论文："Agent self-correction via trajectory reflection"**
- 主落点：L9 Harness > Verification & Safety
- 跨层：L3 推理 > Reflexion、L7 生产 > Eval
- 标签：⭐ 必学

**新发布："LangGraph v2 with built-in checkpointing"**
- 主落点：L9 Harness > State & Memory > Checkpoint
- 跨层：L6 编排（框架）、L7 生产
- 标签：📖 感兴趣

**新工具："MCP - Model Context Protocol"**
- 主落点：L9 Harness > Tool Orchestration
- 跨层：L5 工具（schema）
- 标签：⭐ 必学

---

## 文档约定

- 每层有独立文件夹 `Lx-xxx/`，存放该层相关笔记
- 概念卡片放 `cards/<concept-name>.md`，文件名 kebab-case
- 卡片里标注：`主层: Lx`、`跨层: Ly, Lz`
- 每日 inbox：`inbox/YYYY-MM-DD.md`
- 每周复盘：`weekly/YYYY-Wxx.md`
- 季度复盘：用 framework 当 checklist，看哪层还薄弱
