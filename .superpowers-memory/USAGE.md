# Superpowers Skills 使用文档

## 1. 概述

Superpowers 是一组协同工作的技能，提供从需求到实现的完整开发流程。

| 技能 | 用途 |
|------|------|
| `superpowers-memory` | 跨会话持久化上下文 |
| `superpowers-feature` | 功能开发流程 |
| `superpowers-learning` | 会话归档与知识捕获 |
| `openspec-feature` | OpenSpec 规范驱动开发 |
| `superpowers-openspec-execution` | 完整流程整合 |

---

## 2. 技能详解

### superpowers-memory
跨会话记忆系统，用于保持项目上下文跨越不同会话。

**功能**:
- 读取/写入项目记忆文件
- 自动维护 `PROJECT_CONTEXT.md`
- 持久化关键决策

**触发**: 项目存在 `.superpowers-memory/` 时自动激活

---

### superpowers-feature
设计 → 计划 → TDD → 验证 工作流。

**阶段**:
1. `clarify` — 澄清需求
2. `plan` — 制定计划
3. `implement` — 实现功能
4. `verify` — 验证结果

**适用**: 需要快速交付的场景，不依赖 OpenSpec

---

### superpowers-learning
反射性知识捕获和会话归档。

**功能**:
- 保存项目知识
- 记录决策
- 更新 `PROJECT_CONTEXT.md`
- 更新 `CURRENT_STATE.md`
- 更新 `DECISIONS.md`

**触发**: 在会话结束时调用

---

### openspec-feature
OpenSpec Feature Workflow — 规范驱动开发流程。

**阶段**:
1. `proposal` — 提议
2. `design` — 设计
3. `specs` — 规格
4. `tasks` — 任务

**依赖**: 需要 OpenSpec CLI 支持

---

### superpowers-openspec-execution
完整规范驱动开发流程，整合以上所有技能。

**阶段**:
1. 探索 → 锁定 → 执行 → 归档
2. 阶段1: Superpowers 探索
3. 阶段2: OpenSpec 锁定
4. 阶段3: Superpowers 执行
5. 阶段4: OpenSpec 归档

**依赖**: 需要 OpenSpec CLI 支持

---

## 3. 快速开始

```bash
# 启动功能开发
/superpowers-feature

# 保存会话知识
/superpowers-learning

# 查看记忆状态
/superpowers-memory
```

---

## 4. 触发词列表

| 触发词 | 对应技能 |
|--------|----------|
| `superpowers` | superpowers-feature |
| `会话归档` | superpowers-learning |
| `记忆` | superpowers-memory |
| `openspec` | openspec-feature |
| `完整流程` | superpowers-openspec-execution |
| `/superpowers:brainstorming` | 任何创意工作前必须使用 |
| `/superpowers:finishing-a-development-branch` | 分支完成时 |
| `/superpowers:requesting-code-review` | 请求代码审查 |
| `/superpowers:receiving-code-review` | 接收审查反馈 |
| `/superpowers:dispatching-parallel-agents` | 并行任务分发 |
| `/superpowers:using-git-worktrees` | 使用 git worktree |
| `/superpowers:test-driven-development` | TDD 开发 |
| `/superpowers:systematic-debugging` | 系统调试 |
| `/superpowers:subagent-driven-development` | 子 agent 开发 |
| `/superpowers:executing-plans` | 执行计划 |
| `/superpowers:verification-before-completion` | 完成前验证 |
| `/superpowers:writing-skills` | 编写技能 |

---

## 5. 工作流选择指南

```
是否需要 OpenSpec CLI?
├── 否 → superpowers-feature (快速交付)
└── 是 → superpowers-openspec-execution (完整流程)

是否会话结束?
├── 是 → superpowers-learning
└── 否 → superpowers-memory (跨会话保持上下文)
```