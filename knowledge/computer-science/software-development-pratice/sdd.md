# SDD 规格驱动开发

> Spec-Driven Development：vibe coding 的进化版

## 概述

SDD 是 vibe coding 的进化版，先写规格再写代码，解决 AI 生成代码质量差、无法维护、验收标准不清的问题。

## 为什么需要 SDD

Vibe Coding 三大痛点：
1. 代码质量差（SQL注入、硬编码密码）
2. 无法维护（命名混乱、改一行坏全身）
3. 验收标准不清（反复修改）

## SDD 四个阶段

1. **Specify** — 回答做什么、给谁用、怎么算成功
2. **Plan** — 技术栈、架构、约束
3. **Tasks** — 拆成可独立测试的小任务
4. **Implement** — 一个个任务做，频繁验收

## 工具

- GitHub Spec Kit CLI：`spec create my-project`

## 适合谁

- 原型/MVP → vibe coding
- 生产级产品 → SDD

## 参考

- [Spec Driven Development: The Evolution Beyond Vibe Coding](https://danielsogl.medium.com/spec-driven-development-sdd-the-evolution-beyond-vibe-coding-1e431ae7d47b)
- [Thoughtworks: Spec-driven development](https://www.thoughtworks.com/insights/blog/agile-engineering-practices/spec-driven-development-unpacking-2025-new-engineering-practices)