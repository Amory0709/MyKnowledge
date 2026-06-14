# L7 生产层

> 怎么在真实世界跑得起来

**框架位置**：9 层中的第 7 层
**详细内容**：[framework.md](../../framework.md#-l7-生产层)

## 本层要回答的问题

- 怎么观察 agent 在干什么？
- 怎么评估 agent 的表现？
- 怎么控制成本 / 延迟 / 安全？

## 关键概念

- 可观测性（trace / span / LangSmith / Langfuse）
- 评估（offline evals + online metrics）
- 成本 / 延迟、caching
- 安全（guardrails、prompt injection 防御）
- 错误处理、重试、降级
