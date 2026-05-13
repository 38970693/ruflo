# Architecture Decisions - Ruflo v3.6

## ADR-001: agentic-flow集成

将agentic-flow作为核心扩展而非并行实现，消除10,000+重复代码。

## ADR-006: 统一内存服务

将6+内存系统统一为AgentDB，配合HNSW索引实现150x-12,500x搜索改进。

## ADR-009: 混合内存后端

采用SQLite + AgentDB混合架构，支持向量索引和持久化。

## ADR-026: 3层模型路由

| 层 | 处理器 | 延迟 | 成本 | 用途 |
|----|--------|------|------|------|
| 1 | Agent Booster (WASM) | <1ms | $0 | 简单转换 — **跳过LLM** |
| 2 | Haiku | ~500ms | $0.0002 | 简单任务, 低复杂度 (<30%) |
| 3 | Sonnet/Opus | 2-5s | $0.003-0.015 | 复杂推理, 架构, 安全 (>30%) |

## ADR-027: Anti-Drift编码配置

- **拓扑**: hierarchical (通过中心协调防止drift)
- **最大Agent数**: 8 (小团队 = 更少drift)
- **策略**: specialized (清晰角色分工, 无重叠)
- **共识**: raft (leader维持权威状态)
- **检查点**: 频繁通过post-task hooks
- **内存**: 所有agent共享namespace
- **任务周期**: 短周期 + 验证门控

## ADR-028: Claude Code ↔ AgentDB内存桥接

- Claude Code auto-memory (`~/.claude/projects/*/memory/*.md`) 桥接到AgentDB
- 使用ONNX向量嵌入实现语义搜索
- SessionStart hook自动导入当前项目内存
- `memory_search_unified` 支持跨所有namespace搜索

## ADR-029: RuVector智能系统

4步智能管道:
1. RETRIEVE — 通过HNSW获取相关模式
2. JUDGE — 用verdicts评估 (success/failure)
3. DISTILL — 通过LoRA提取关键学习
4. CONSOLIDATE — 通过EWC++防止灾难性遗忘

组件:
- SONA: <0.05ms适应
- MoE: 8个专家
- Flash Attention: 2.49x-7.47x加速

## ADR-030: npm发布规则

发布CLI变更时必须发布全部三个包: `@claude-flow/cli`, `claude-flow`, `ruflo`

发布顺序:
1. `@claude-flow/cli` (先发布)
2. `claude-flow` (umbrella)
3. `ruflo` (别名umbrella)

必须更新全部dist-tags: alpha, latest, v3alpha

## ADR-031: 插件注册表维护

通过IPFS/Pinata实现去中心化、不可变分发。
- 当前CID存储在: `v3/@claude-flow/cli/src/plugins/store/discovery.ts`
- 网关: `https://gateway.pinata.cloud/ipfs/{CID}`
- 安全规则: 永远不从代码中硬编码API密钥，始终从.env运行时读取

## ADR-032: Embeddings包 v3.0.0-alpha.12

功能:
- sql.js: 跨平台SQLite持久缓存 (WASM, 无原生编译)
- 文档分块: 可配置重叠和大小
- 归一化: L2, L1, min-max, z-score
- 双曲嵌入: Poincare球模型用于层级数据
- 75x更快: agentic-flow ONNX集成
- 神经基质: 集成RuVector