---
type: 调研笔记
primary_layer: L9
cross_layers: [L6]
tags: [harness, ecc, multi-agent, hooks, skills, instincts, security]
date: 2026-05-29
---

# ECC - Agent Harness 性能优化系统

> 一套完整的 AI Agent 工程系统

## 概述

ECC = Everything Claude Code / Agent Harness Performance Optimization System

GitHub 185.9K ★ | 作者: Affaan Mustafa（Anthropic hackathon 获奖者）

## 核心组件

- **Skills（232+）** — 专业技能模块，覆盖特定工作流
- **Instincts v2** — 基于信心的自动学习系统，从 session 中自动提取模式
- **Hook-Based Automations** — 触发型钩子（PreToolUse/PostToolUse/Stop/SessionStart）
- **Agents（60+）** — 预配置专业子 agent
- **AgentShield** — 安全扫描（102条静态分析规则 + 1200+ 测试用例）
- **MCP Configs（14）** — 开箱即用的 Model Context Protocol 集成
- **Commands（76）** — 斜杠命令

## 架构设计

```
.ecc/                    # 运作核心目录
├── agents/              # 60+ 专业子 agent
├── skills/              # 232+ 工作流技能
├── commands/            # 76 斜杠命令
├── hooks/               # 触发型自动化
├── rules/               # 通用规则 + 按语言分类
├── scripts/             # 跨平台工具
├── mcp-configs/         # 14 MCP server 配置
└── .ecc.db              # SQLite 审计数据库
```

六层管道架构：`Command → Agent → Skill → Tool → Hook → Audit`

## 关键洞察

1. **换 harness 比换模型更有效** — 编排层质量是瓶颈
2. **Instinct 自动学习** — 让 AI 从行为中进化
3. **安全应该是架构内置层** — 不是事后打补丁

## 对 Ori 的借鉴

1. Instinct 自动学习系统（最高优先级）
2. AgentShield 内置安全
3. Research-first 工作流强制
4. 战略压缩时机感知

## 安装

```bash
npx ecc init --harness claude-code   # 初始化到 .ecc/ 目录
npx ecc init                          # 全局安装
```

## 参考

- [ECC GitHub](https://github.com/affaan-m/ECC)
- [ECC Tools](https://ecc.tools/)
- [AgentShield](https://github.com/affaan-m/agentshield)