# Agent Engineering Framework

> A 9-layer knowledge map. Living document, updated as the field evolves.

> **Naming references industry terminology**: Agent Harness (LangChain / MongoDB / Firecrawl / arXiv 2603.05344 are aligned)

---

## Mental Model: Evolution Path

Not "9 layers stacked together", but **adding capabilities step by step**. Each "+X" is a response to the limitations of the previous stage:

```
LLM                                              Jun 2020
  │ + Prompt Engineering                        Jan 2022
  ▼                                                (CoT)
Prompted LLM
  │ + Tool Use (Function Calling)              Jun 2023
  ▼
Tool-Using LLM
  │ + Agentic Loop (ReAct)                     Oct 2022
  ▼
Single Agent
  │ + Memory / RAG                             May 2020 (paper)
  ▼                                                (2022-23 in agent context)
Persistent Agent
  │ + Multi-Agent Orchestration                Aug-Dec 2023
  ▼                                                (AutoGen, CrewAI)
Multi-Agent System
  │ + Harness Engineering                      Feb-Mar 2025
  ▼                                                (Claude Code, OpenAI Agents SDK)
Production-Grade Agent  ← today's frontier
                              (Devin Mar 2024, Codex CLI Apr 2025)
```

### 8 Stages in Detail

| # | Stage | Date | Problem Solved | Representative Milestone + Reference |
|---|---|---|---|---|
| 1 | **LLM** | Jun 2020 | — | GPT-3 — [Brown et al., OpenAI 2020](https://openai.com/blog/language-unsupervised/) |
| 2 | **+ Prompt** | Jan 2022 | LLM too "raw" | Chain-of-Thought — [Wei et al., arXiv:2201.11903](https://arxiv.org/abs/2201.11903) |
| 3 | **+ Tool** | Jun 2023 | LLM can only talk, not act | OpenAI Function Calling — [OpenAI blog, Jun 13 2023](https://openai.com/index/function-calling-and-other-api-updates/) |
| 4 | **+ Loop** | Oct 2022 | Single response can't complete multi-step tasks | ReAct — [Yao et al., arXiv:2210.03629](https://arxiv.org/abs/2210.03629) |
| 5 | **+ Memory** | May 2020 (paper) / 2022-23 (agent context) | Agent restarts from zero each time | RAG — [Lewis et al., NeurIPS 2020](https://proceedings.neurips.cc/paper/2020/file/6b493230205f780e1bc26945df7481e5-Paper.pdf) |
| 6 | **+ Multi** | Aug-Dec 2023 | Single agent can't handle complex tasks | AutoGen (Microsoft, Aug 2023) · CrewAI (Dec 2023) — [Microsoft Research](https://www.microsoft.com/en-us/research/project/autogen/publications/) · [Wikipedia](https://en.wikipedia.org/wiki/CrewAI) |
| 7 | **+ Harness** | Feb-Mar 2025 | Whole agent system doesn't run reliably | Claude Code beta (Anthropic, Feb 2025) · OpenAI Agents SDK (Mar 2025) — [Claude Code](https://aiwiki.ai/wiki/claude_code) · [Agents SDK](https://aiwiki.ai/wiki/openai_agents_sdk) |
| 8 | **= Frontier** | Mar 2024+ | — | Devin (Cognition Labs, Mar 2024) · Codex CLI (OpenAI, Apr 2025) — [Devin](https://aiwiki.ai/wiki/devin) · [Codex CLI](https://aiwiki.ai/wiki/codex_cli) |

### Key Insights

- **L8 Harness wasn't there from the start** — it's a discipline recognized retrospectively, not designed from scratch
- **Each "+X" is a response to actual limitations of the previous stage** (LLM not good enough → add prompt; single response insufficient → add loop; agent forgets → add memory)
- **The 9 layers are a horizontal slice** (components that coexist), **the evolution path is a vertical timeline** (history of invention in order) — the two views are complementary
- **Dates are not strictly monotonic** (RAG paper is May 2020, older than CoT Jan 2022, but RAG only became mainstream in LLM agent context in 2022-23) — the chain shows **logical capability accumulation**, not strict chronological order
- Learning agent engineering is essentially **starting from L1 and working through the layers via this evolution chart**

---

## 9 Layers in Detail

### 🧱 L1 Model Layer
The capability boundaries of LLMs themselves
- Major model comparison (GPT / Claude / Gemini / Mistral / open source)
- Context window, tokens, cost model
- Capability ceiling / common failure modes

### 💬 L2 Interaction Layer
- Messages structure (system / user / assistant / tool)
- Prompt engineering
- Function calling schema
- Streaming, structured output (JSON mode, tool use)

### 🧠 L3 Reasoning Layer
- CoT, ToT
- ReAct, Plan-and-Execute, Reflexion
- Task decomposition

### 💾 L4 Memory Layer
- Context window management
- RAG (vector DB / BM25 / hybrid)
- Long-term vs short-term / episodic vs semantic
- Summarization
- "Memory as a tool" vs "Memory as a state"

### 🔧 L5 Tools Layer
- Function calling mechanics
- Tool design principles (atomic, composable, typed)
- MCP (Model Context Protocol)
- Code sandbox, browser / GUI / file system / shell

### 🤝 L6 Orchestration Layer
- Single agent loop
- Topologies: supervisor / swarm / hierarchical
- Handoff, message passing, shared state
- Frameworks: LangGraph / OpenAI Agents SDK / CrewAI / Pydantic AI

### 🏭 L7 Production Layer
- Observability (trace / span / LangSmith / Langfuse)
- Evaluation (offline evals + online metrics)
- Cost / latency, caching
- Safety (guardrails, prompt injection defense)
- Error handling, retry, fallback

### 🟢 L8 Harness (Systems Engineering)
**Definition**: The entire engineering system wrapping the LLM. *"Agent = Model + Harness"* (LangChain)

**Sub-components**:

**1. Context Engineering** — Give the model the right "input surface"
- Token management (budget, compression, pruning)
- System prompt construction
- History message assembly
- Active forgetting (active pruning)

**2. Tool Orchestration** — Tool wrapping and dispatching
- Dynamic scoping (when to expose which tools)
- Sandboxing
- Argument validation
- Error handling and retry

**3. State & Memory** — Continuity across time
- Durable state
- Checkpoint-resume
- Progress files
- Cross-session memory

**4. Verification & Safety** — Working reliably
- Output checking
- Silent failure detection
- Guardrails
- Prompt injection defense

**5. Agentic Loop** — Runtime behavior (inside harness)
- **Inner Loop**: single-turn think → act → observe
- **Task Loop**: multi-turn task completion
- **Meta Loop**: cross-task planning / reflection / learning

**6. Observability** — See what the agent is doing
- Trace / Span
- Decision logs
- Performance metrics

**7. Cost & Latency** — Economically viable
- Token budget
- Model fallback
- Caching
- Parallelization

**Mantra**: *"The harness is the new prompt."* — As models get stronger, the harness determines the upper limit.

### 🎯 L9 Application Layer
Specific agent forms (frontier)
- Coding agents (Claude Code, Cursor, Codex)
- Browser agents (Browserbase, Stagehand)
- Research agents
- Workflow automation
- Vertical applications (customer service, sales, operations...)

---

## Cross-Layer Concepts

| Concept | Layers Involved | What it is |
|---|---|---|
| **Context** | L2 + L4 + L8 | Everything actually fed into the prompt (L8 leads) |
| **Tool** | L5 + L2 + L8 | Action capability + calling convention + error handling (L8 leads) |
| **Trace** | L7 + L8 | Full-stack recording (L8 leads) |
| **Eval** | L7 | Offline + online, feedback loop |
