# OpenMythos - Claude Mythos 架构开源重建

> 来源：GitHub (kyegomez/OpenMythos)、Forbes、MarkTechPost、Decrypt、OpenClaw API Blog、themenonlab 等
> 记录时间：2026-05-29
> 分类：AI 模型架构研究
> 标签：Claude Mythos、Recurrent-Depth Transformer、RDT、MoE、推理模型、PyTorch

---

## 是什么

OpenMythos 是独立开发者 Kye Gomez（22岁）发布的开源项目，基于公开论文和研究文献，从第一性原理重建 Claude Mythos（Anthropic 的推理模型）的架构。

GitHub: https://github.com/kyegomez/OpenMythos
发布时：2周内获得 10,000+ GitHub stars
安装：`pip install open-mythos`

**重要澄清：** OpenMythos 是一个**理论重建**，不是 Anthropic 的官方实现，也不是泄露代码。它是基于公开信息的"最佳猜测"架构。

---

## 核心架构：Recurrent-Depth Transformer (RDT)

### 三阶段结构

```
Input
  ↓
[Prelude] — 标准 Transformer 层，执行一次
  ↓
[Recurrent Block] — 循环 T 次（相同权重，T 次迭代）
     ↑___________↓
     (hidden state h 每次循环更新)
  ↓
[Coda] — 标准 Transformer 层，执行一次
  ↓
Output
```

| 阶段 | 说明 |
|------|------|
| **Prelude** | 标准 Transformer 层，对输入做一次性编码 |
| **Recurrent Block** | 核心创新——用同一组权重循环 T 次（最多 16 次），每次循环更新隐藏状态 h |
| **Coda** | 标准 Transformer 层，对循环结果做一次性解码输出 |

### 关键技术点

**1. Multi-Head Latent Attention (MLA)**
- 低秩注意力机制，减少 KV-cache 内存占用
- DeepSeek-V2 论文提出，OpenMythos 用作默认注意力类型

**2. Grouped Query Attention (GQA)**
- KV heads 少于 Q heads，减少 KV-cache 内存
- `n_kv_heads < n_heads`

**3. Sparse Mixture of Experts (MoE)**
- 稀疏专家混合，每个 token 只激活部分专家
- 大幅减少激活参数量，同时保持模型容量

**4. Looped Inference / ACT**
- Adaptive Computation Time (ACT)：模型自己决定每个问题需要多少次循环
- 不固定循环次数，根据问题复杂度自适应

**5. 参数效率**
- 770M 参数的 OpenMythos ≈ 1.3B 标准 Transformer 的效果
- 循环 + MoE = 参数效率的秘诀

### 与标准 Transformer 的区别

**标准 Transformer：** 所有层都执行一次
**RDT：** 部分层循环执行多次（用同一组权重）

---

## 相关项目

### mythos-router（thewaltero）

GitHub: https://github.com/thewaltero/mythos-router

本地 CLI 工具，核心是 **Strict Write Discipline (SWD)**：

- 每次 AI 声称的文件操作，用 SHA-256 快照与实际文件系统对比验证
- 防止 AI"撒谎"——声称写了代码但实际没写
- 自愈内存 + 预算上限控制
- 基于 Claude Opus 4.7

**核心理念：** AI 编码中最常见的问题不是 AI 能力不足，而是 AI 声称做了但实际没做。SWD 通过文件系统验证解决了这个问题。

### OpenMythos-Skill（SarthakDz）

GitHub: https://github.com/SarthakDz/OpenMythos-Skill

Claude Skill，让 Claude 像一个**深度理解 OpenMythos 源码的高级工程师**一样工作——知道架构不变量、代码约定、调试手册和项目引用的论文。

这是 third-party harness 的典型例子。

---

## 对 AI Agent 的意义

### 架构层面

Claude Mythos 的 RDT 架构对 AI Agent 系统的启发：

1. **循环推理 > 单次推理**：复杂问题需要多次"思考"，不是一次forward pass
2. **自适应计算时间**：不同问题需要不同长度的推理，不需要预定义 token budget
3. **参数效率**：MoE + 循环 = 用更少参数达到更好效果

### 工具层面

mythos-router 的 Strict Write Discipline 是 AI Coding Agent 的**实用工程突破**：

- 文件系统验证比"信任 AI 会正确执行"更可靠
- SHA-256 快照让每次文件操作可审计
- 解决了 AI coding 中最常见的"声称做了但没做"问题

---

## 与 Claude Code / OpenClaw 的关系

### mythos-harness

GitHub Topics 中出现的 `mythos-harness` 标签表明，OpenMythos 项目群体也在构建类似 Claude Code 的 agent harness 系统。

### OpenClaw 的角色

OpenClaw 博客（openclawapi.org）发布了 OpenMythos 入门指南，说明 OpenClaw 社区对 OpenMythos 的关注。

OpenMythos 的架构理念（循环推理、自适应计算）和 OpenClaw 的 subagent 系统在**设计思想上有关联**。

---

## 关键洞察

**1. "理论重建"的价值**
不是官方实现，但通过第一性原理重建，推进了对闭源系统的理解。科学就是这样的——基于证据假设，公开验证。

**2. 参数效率的秘诀**
770M ≈ 1.3B 的秘密：循环推理（相同权重多次使用）+ MoE（稀疏激活）。这是未来小型模型追赶大型模型的方向。

**3. Strict Write Discipline 是 AI Coding 的工程纪律**
架构再强，执行层面乱来也没用。mythos-router 的 SWD 证明了"工程纪律 > 信任"。

**4. 22岁开发者做了一件大事**
Kye Gomez 没有大厂背景，用公开论文重建了 SOTA 闭源系统的架构。这说明开源社区的工程能力和研究能力在快速追赶。

---

## 参考链接

- OpenMythos 主仓库：https://github.com/kyegomez/OpenMythos
- mythos-router：https://github.com/thewaltero/mythos-router
- OpenMythos-Skill：https://github.com/SarthakDz/OpenMythos-Skill
- OpenClaw Blog 入门指南：https://openclawapi.org/en/blog/2026-04-26-openmythos-getting-started
- MarkTechPost：https://www.marktechpost.com/2026/04/19/meet-openmythos-an-open-source-pytorch-reconstruction-of-claude-mythos-where-770m-parameters-match-a-1-3b-transformer/
- Forbes：https://www.forbes.com/sites/craigsmith/2026/05/02/a-22-year-old-dropout-just-reverse-engineered-the-worlds-scariest-ai/