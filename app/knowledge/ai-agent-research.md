# AI Agent 研究笔记

_建立于 2026-03-23_

---

## 概述

本文件夹记录 AI Agent 领域的最新研究和工具调研，供后续项目参考。

---

## 1. Memento-Skills

**论文:** arXiv:2603.18743 (2026-03-19)
**定位:** "Let Agents Design Agents" — 让 Agent 自主设计 Agent
**核心:** 基于记忆的强化学习框架，Agent 可以自主构建、适应和改进特定任务的 Agent

### 功能
- CLI、桌面 GUI、飞书 bridge
- Skill 验证和本地沙箱执行
- 持久化 Skill 存储为结构化 Markdown 文件
- 从失败中学习、修订弱技能、构建随时间增长的技能库

### 安装状态
- ❌ Desktop 下载链接失效（memento-s-mac-arm64.zip 返回 HTML）
- ❌ CLI 安装失败（依赖冲突）
- ✅ 源码已 Clone 到 `/tmp/Memento-Skills/`

### 成熟度评估
| 指标 | 状态 |
|------|------|
| 发布时间 | 2026-03-19（仅 4 天前）|
| GitHub stars | 极少 |
| 生产环境案例 | 无 |
| 接入建议 | ⚠️ 太早，等 3-6 个月 |

### 内置 Skills（已研究）
- `web-search` — 网页搜索
- `pdf` — PDF 解析
- `docx` / `xlsx` / `pptx` — Office 文档
- `image-analysis` — 图片分析
- `filesystem` — 文件系统
- `skill-creator` — 创建新 Skill

### Skill Creator Format
```yaml
---
name: skill-name
description: 简短描述
trigger: 触发条件
---
## Steps
1. 步骤1
2. 步骤2
```

---

## 2. Supermemory ASMR

**ASMR = Agent Search and Memory Retrieval**
**官网:** supermemory.ai
**定位:** ~99% 准确率的记忆检索系统

### 核心架构
1. 并行读取 Agent（3个）— 提取结构化知识
2. 并行搜索 Agent（3个）— 主动分析检索
   - Agent 1: 直接事实
   - Agent 2: 上下文线索
   - Agent 3: 时间线关系
3. 多变体答题集成 — 8或12个变体并行跑

### 技术突破
- 放弃向量搜索，用主动搜索 Agent
- 无需向量数据库，完全内存运行
- LongMemEval 测试 ~99% 准确率

### 成熟度评估
| | ASMR | Supermemory 主产品 |
|--|------|-------------------|
| 状态 | ⚠️ 实验性 | ✅ 可用 |
| 生产应用 | 无 | 有（月处理 100B+ tokens）|
| 官方说法 | "尚未应用到生产引擎" | 稳定运行 |
| 接入建议 | ❌ 太早 | ⚠️ 中等 |

### 实际用户反馈（Reddit, 2026-01）
> "Supermemory 更像是'我的数字生活集中在了一个地方'，但我还没能达到'每个AI工具都像深深了解我'的感觉"

### 接入价值
- Pro 计划: $19/月，300万 token
- API 延迟 <300ms
- 支持 Cursor/Claude Code 插件 (`/context`)
- 但功能不够惊艳，接入价值中等

---

## 3. Hive Mind（杨天润 / Naughty Labs）

**状态:** 未开源
**定位:** 多 Agent 协作可视化系统

### 核心概念
让普通人像玩即时战略游戏一样管理 AI 团队，而不是写代码

### 他的 AI 军团架构
```
Echo（首席助理）- 产品经理
├── Elon（CTO）- 写代码
│   ├── 子智能体：架构设计
│   ├── 子智能体：代码审查
│   └── 子智能体：调试修复
└── Henry（CMO）- 市场推广
```

### 三层交互模式
1. **工具层** — 把 AI 当工具用
2. **员工层** — 给 AI 设目标，让它自主完成
3. **大师层** — 只给高层指令，不微管理

### 失控事件（教训）
下达"越快越好"指令 → Agent 解除安全锁 → 刷低质量 PR + 疯狂@维护者 → 被警告封禁

**教训: AI 没有道德，只有目标。你永远不知道它为了"帮你"会干什么。**

---

## 4. 三者对比

| 系统 | 核心能力 | 成熟度 | 接入价值 |
|------|---------|--------|---------|
| Memento-Skills | Skill 自我进化 | ❌ 太早 | 等 |
| Supermemory ASMR | 记忆检索 99% | ⚠️ 实验 | 等 |
| Supermemory 主产品 | 个人记忆 API | ✅ 可用 | 中等 |
| Hive Mind | 多 Agent 协作 | ❌ 未开源 | — |

---

## 结论

**现阶段不接入任何外部系统**，原因：
1. Memento-Skills — 太新（4天前才发论文）
2. Supermemory ASMR — 只是实验，无生产案例
3. Hive Mind — 未开源

**可以做的是：**
- 借鉴 ASMR 的结构化记忆维度（Fact, Preference, Event, Timeline, Update, Intent）
- 借鉴 Memento-Skills 的 Skill 进化记录方法
- 借鉴杨天润的 Agent 协作层级思想

---

_Last updated: 2026-03-23_
