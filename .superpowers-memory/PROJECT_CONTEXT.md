# Project Context - Ruflo v3.6

## 项目概览

- **项目名称**: Ruflo (Claude Flow v3)
- **版本**: v3.6.10 (2026-04-29)
- **描述**: 智能多Agent编排系统，支持agent联邦和comms-first协调
- **统计**: 6,000+ commits, 314 MCP tools, 16 agent roles, 19 AgentDB controllers, 21 native plugins

## 核心包

| 包名 | 路径 | 用途 |
|------|------|------|
| `@claude-flow/cli` | `v3/@claude-flow/cli/` | CLI入口点 (26命令) |
| `@claude-flow/codex` | `v3/@claude-flow/codex/` | Claude + Codex双模式协作 |
| `@claude-flow/guidance` | `v3/@claude-flow/guidance/` | 治理控制平面 |
| `@claude-flow/hooks` | `v3/@claude-flow/hooks/` | 17 hooks + 12 workers |
| `@claude-flow/memory` | `v3/@claude-flow/memory/` | AgentDB + HNSW搜索 |
| `@claude-flow/security` | `v3/@claude-flow/security/` | 输入验证, CVE修复 |

## 架构原则

- **DDD**: 遵循领域驱动设计， bounded contexts
- **文件大小**: 保持在500行以内
- **API**: 所有公共API使用类型化接口
- **TDD**: 新代码优先使用TDD London School (mock-first)
- **事件溯源**: 状态变更使用事件溯源
- **边界验证**: 系统边界确保输入验证

## 并发规则

1 MESSAGE = ALL RELATED OPERATIONS:
- 所有操作必须并发/并行
- 使用Claude Code的Task tool生成agents
- 批量所有todos
- 批量所有文件操作
- 批量所有终端操作

## 双模式协作

Claude Code (🔵) 和 OpenAI Codex (🟢) 并行运行，通过共享内存协调。

### 平台优势

| 任务类型 | 首选平台 | 原因 |
|---------|---------|------|
| 架构设计 | 🔵 Claude | 强推理能力，系统思维 |
| 实现 | 🟢 Codex | 快速代码生成 |
| 安全审查 | 🔵 Claude | 细致分析，威胁建模 |
| 性能优化 | 🟢 Codex | 代码级优化 |
| 测试策略 | 🔵 Claude | 覆盖率分析，边缘情况 |
| 重构 | 🟢 Codex | 批量代码转换 |

## 智能系统 (RuVector)

- **SONA**: 自优化神经架构 (<0.05ms)
- **MoE**: 混合专家 (8 experts)
- **HNSW**: 150x-12,500x 更快搜索
- **EWC++**: 弹性权重巩固 (防止遗忘)
- **Flash Attention**: 2.49x-7.47x 加速

### 4步智能管道

1. **RETRIEVE** — 通过HNSW获取相关模式
2. **JUDGE** — 用verdicts评估 (success/failure)
3. **DISTILL** — 通过LoRA提取关键学习
4. **CONSOLIDATE** — 通过EWC++防止灾难性遗忘

## V3 CLI (26命令, 140+ 子命令)

核心命令: init, agent, swarm, memory, mcp, task, session, config, status, start, workflow, hooks, hive-mind

高级命令: daemon, neural, security, performance, providers, plugins, deployment, embeddings, claims, migrate, process, doctor, completions

## Headless后台实例

使用 `claude -p` 生成headless Claude实例用于并行后台工作。