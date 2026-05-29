# ECC - Agent Harness 性能优化系统

> 来源：GitHub (affaan-m/ECC, 185.9K★)、ECC Tools 官网、SitePoint、DeepWiki、EveryDev.ai
> 记录时间：2026-05-29
> 分类：AI Agent 工程
> 标签：AI Agent、Harness、Skills、Memory Optimization、Security、Claude Code

---

## 是什么

ECC = Everything Claude Code / Agent Harness Performance Optimization System

**不只是配置文件，是一套完整的 agent 工程系统。**

作者 Affaan Mustafa（Anthropic hackathon 获奖者），经 10+ 月每日生产使用验证。

GitHub: https://github.com/affaan-m/ECC

---

## 核心组件

### 1. Skills（技能系统）— 232+ 个专业技能

每个 skill 是独立的指令集，覆盖特定工作流（frontend-patterns、security、testing 等）。技能可跨 harness 迁移（Claude Code / Codex / Cursor / Opencode）。

### 2. Instincts v2（本能系统）— 自动学习

从 session 中自动提取模式（pattern extraction），基于置信度评分。

命令：`/instinct-status`, `/instinct-import`, `/instinct-export`, `/evolve`

用 `/evolve` 将相关 instincts 聚合成完整 skill。

**工作机制：**
```
观察（Hook 记录工具调用序列）
    ↓
识别（从历史中识别重复模式）
    ↓
编码（将高频模式编码为 Instinct）
    ↓
评分（置信度分数量化可靠程度）
    ↓
进化（高置信度 → 完整 skill / command / agent）
```

**这解决了什么问题？** AI agent "没有长期记忆"——每次 session 都是白板。Instinct 系统让 AI 每次使用都变得更好，而不是每次回到初始状态。

### 3. Hook-Based Automations（钩子自动化）

触发型钩子，在 agent 运行时自动执行：

| Hook | 触发时机 | 价值 |
|------|---------|------|
| `PreToolUse` | 工具执行前 | SSRF URL 检查、权限预检 |
| `PostToolUse` | 工具执行后 | 结果验证、日志、错误模式识别 |
| `Stop` | session 结束 | 自动保存 session 摘要到 memory |
| `SessionStart` | session 开始 | 加载项目上下文 |

运行时控制：`ECC_HOOK_PROFILE` 选择钩子配置，`ECC_DISABLED_HOOKS` 禁用特定钩子。

### 4. AgentShield Security Auditor（安全扫描）

运行 `npx ecc-agentshield scan` 审计配置。

- 102 条静态分析规则 + 1200+ 测试用例
- 覆盖：SSRF、XSS、SQL injection、hardcoded credentials
- 支持 red-team / blue-team / auditor 三种 Pipeline

**关键洞察：安全应该是架构内置层，不是外部插件。**

### 5. Agents（子 agent）— 60 个专业 agent

预配置专业子 agent，用于特定角色（architect、reviewer、security 等）。

### 6. MCP Configurations — 14 个 MCP server 配置

开箱即用的 Model Context Protocol 集成。

### 7. Commands — 76 个斜杠命令

`/tdd`, `/plan`, `/e2e`, `/orchestrate`, `/security-scan` 等。

### 8. Rules — 规则系统

- `rules/common/` — 通用规则
- `rules/per-language/` — 按语言分类的规则

---

## 架构设计

### `.ecc/` 目录 — 运作核心

```
.ecc/
├── agents/              # 60 个专业子 agent
├── skills/              # 232+ 工作流技能
├── commands/            # 76 个斜杠命令
├── hooks/               # 触发型自动化
├── rules/               # 始终遵循的规则
├── scripts/             # 跨平台 Node.js 工具
├── mcp-configs/         # 14 个 MCP 配置
├── tests/               # 测试套件
└── .ecc.db              # SQLite 审计数据库
```

**设计意图：**
- 版本控制友好：放在项目根目录，随代码一起版本化
- 命名空间隔离：`.` 开头表示项目级元数据
- 运行时自动生成：audit.db 等文件在运行时自动创建
- 可选择性安装：可只安装部分 profile，不用全量加载

### 为什么用 SQLite 作为审计数据库？

零运维（无需独立数据库进程）+ 版本同步（跟着项目走）+ 跨工具（SQLite 文件可移植到不同 harness）。

### 六层管道架构（控制平面）

```
Slash Command Intake
    ↓
Agent Dispatch（路由到专业 agent）
    ↓
Skill Selection（从 232+ skills 中选择）
    ↓
Tool Execution（执行具体工具）
    ↓
Hooks（触发生命周期钩子）
    ↓
Audit/Feedback（写入 audit.db，触发 instinct 学习）
```

控制平面是分散式：CLAUDE.md（项目级指令）、rules/（约束层）、hooks/（事件层）、instincts/（学习层）。

### 跨 harness 兼容原理

1. 统一目录结构（`.ecc/` 对所有 harness 通用）
2. Harness-specific 配置（每个 harness 有独立配置目录）
3. 通用工具抽象（不直接依赖特定 harness 的工具 API）
4. 平台检测启动（启动时检测当前 harness 类型）

---

## 高效能工作流

### Research-first Development（研究优先开发）

```
Phase 1: Research → Phase 2: Plan → Phase 3: Execute → Phase 4: Verify + Compact
```

先研究再开发——研究阶段为后续开发提供上下文基础，减少返工。生成架构决策记录（ADR）。

### 战略压缩（Strategic Compaction）

Token 耗尽是长任务开发的头号杀手。

ECC 策略：
- 在逻辑断点压缩，不在任意位置压缩（研究阶段完成、实现里程碑、测试通过）
- 智能摘要：保留关键上下文，丢弃调试探索噪音
- 监控工具调用频率，在达到阈值前主动触发压缩

**错误做法：** 在第 234 次工具调用时强制压缩（上下文还在中间任务）
**正确做法：** 在研究阶段完成时 / 达到架构设计里程碑时 / 测试套件全部通过后

---

## 反直觉的发现

LangChain 的实验：**换 harness（不换模型）** → benchmark 从 Top 30 提升到 Top 5（52.8% → 66.5%）。

这意味着当前 AI agent 系统的瓶颈不是模型能力，而是 **orchestration layer（编排层）的质量**。

---

## 对 OpenClaw 的借鉴

### OpenClaw 缺什么

| 维度 | OpenClaw | ECC |
|------|---------|-----|
| 自动学习 | 静态 memory | CLV2 instinct 系统 |
| 内置安全 | 依赖外部 | AgentShield 1200+ 测试 |
| 专业 agent | 有限 | 60+ 专业 agent |
| 研究优先工作流 | 无 | 内置 `/research` + ADR |
| 战略压缩 | 手动触发 | 逻辑断点智能触发 |

### 可借鉴的理念（按优先级）

1. **Instinct 自动学习系统** — AI 从自己行为中学习，而非静态 memory
2. **AgentShield 内置安全** — PreTool hook + SSRF URL 白名单检查
3. **Research-first 工作流** — 复杂任务先研究再实施
4. **`.openclaw/` 可组合配置目录** — skills/ 独立安装，配置可选择性轻量化

### OpenClaw 已有的优势

- 分布式微服务架构（brain/hands/session logs 分开）
- 多 channel 集成（Telegram/Discord/WhatsApp）
- Canvas 渲染
- ClawHub 生态
- Subagent 隔离（sessions_spawn）
- 心跳机制（HEARTBEAT）
- Voice TTS

---

## 三个核心洞察

🥇 **Instinct 自动学习让 AI 从自己行为中进化**，而非静态 memory——这是本质提升

🥈 **安全应该是架构内置层，不是外部插件**

🥉 **编排层质量是当前 AI agent 系统的真正瓶颈**——LangChain 实验证明换 harness 比换模型更有效

---

## 参考链接

- Repo: https://github.com/affaan-m/ECC
- ECC Tools: https://ecc.tools/
- AgentShield: https://github.com/affaan-m/agentshield
- SitePoint 详细介绍：https://www.sitepoint.com/everything-claude-code-ecc-production-engineering-platform/
- EveryDev.ai: https://www.everydev.ai/tools/ecc-tools