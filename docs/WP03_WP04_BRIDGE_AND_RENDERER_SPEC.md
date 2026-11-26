# WP-03 & WP-04 深度机制推导白皮书：双模跨界桥接事务机与 9.6m³ 受限/破界协同渲染内核

本文件衔接《WP-01 & WP-02 深度功能扩散推理白皮书》，对 **模块二（`WP-03 s2rb-bridge-core`）** 与 **模块三（`WP-04 s2rb-renderer-kernel`）** 在跨引擎工业环境下的八大深水区机制进行严密定义与实现说明。

## 一、WP-03 彩虹桥双模桥接器四大核心机制

### 1. 带单调栅栏令牌（Fencing Token）的单体模式 2PC 原子迁徙机
- **脑裂隐患**：若源世界 A 在销毁角色时发生 GC 停顿或网络抖动，单纯依赖超时锁可能导致源世界 A 恢复后与目标世界 B 同时存在两个“真身”。
- **工程实现**：`Singleton2PcCoordinator` 为每次跃迁签发严格单调递增的 64 位 `fencing_token`：
  1. `prepare_freeze_and_extract`：锁定源世界角色，刷入最终增量，冻结生成 `LastKnownGoodSnapshot`；
  2. `commit_source_despawn`：验证源世界销毁回执，吊销旧 `fencing_token`，状态置为 `IN_BIFROST_TRANSIT`；
  3. `commit_target_rebirth`：签发 `new_token = prev + 1`，通过宿主机七维准入过滤器生成 `AdmittedContainerProjection` 并在目标世界重生；任何携带旧 `fencing_token` 的延迟残影包均被瞬时丢弃。
  4. **3000ms 死信自动归港与 3ms 红锚紧急召回**：若目标服超时未确认或玩家按下红锚键，自动递增令牌作废在途会话，无损恢复至桃花源母港 `META-CN-001-TAOHUAYUAN2-001-2`。

### 2. 角色复制模式下的有界消耗品质量守恒托管账本（Consumable Quota Escrow）
- **复制刷物隐患**：角色复制模式下母体与多个分身并行存在，若背包消耗品直接深拷贝，玩家开 10 个分身就能把 1 颗附魔金苹果刷成 10 颗。
- **工程实现**：区分**无损可投射资产**（皮肤、衣饰、永久武器、技能图谱）与**有界可消耗堆叠物**（药水、方块建材、复活道具）。派生分身时从母体 `available_pool` 切分定额至 `escrowed_by_fork[fork_id]`，满足恒等式：`母体剩余可用 + Σ分身持有未用 + Σ已消耗核销 === 初始总量`。

### 3. 满足交换律、结合律与幂等律的母体归元 CRDT 引擎（PN-Counter + OR-Set + Causal DAG）
- **多世界乱序重传隐患**：分身 B（王者荣耀）与分身 C（CS2）可能同时下线结算，且弱网环境下同一结算包可能重传多次。
- **工程实现**：
  - 经验值采用**按分支键值隔离的单调 `PN-Counter CRDT`**（记录每个 `fork_id` 已上报的最大累计值 `max(prev, incoming)`，彻底消除重传双倍加经验 Bug）；
  - 跨界融合技能与荣誉勋章采用**带唯一事件哈希标签的 `OR-Set CRDT`**；
  - 编年史账本写入携带双亲哈希指针 `[matriarch_tip, clone_tip]` 的 `CLONE_MERGED_CRDT` 节点，随后经 `s2rb-container-engine` 校验器验证完整性。

### 4. 宿主机七维准入治理投影器（Host 7-Dimension Admission Filter）
- 在容器进入渲染层之前，严格按宿主游戏 `s2rb.world.manifest.json` 裁剪皮肤、衣饰、武器属性（完整词条 vs 纯幻化外观 vs 禁用）、背包权限、技能槽映射与原经验折算，并在启动加载阶段直接拦截任何 `allow_currency_import != false` 的违规宿主配置。

## 二、WP-04 9.6m³ 受限与破界混合渲染内核四大核心机制

### 5. 三维精确有向距离场（`sdBox9m6`）与跨平台硬件裁剪着色器（WGSL / HLSL / GLSL）
- 以容器底面中心 `(0, 0, 0)` 为原点，包围盒中心为 `C = (0, 0, 1.2)`，半轴长为 `H = (1.0, 1.0, 1.2)`。
- 片元级硬不变量：凡 `sdBox9m6(p_local) > 0.0` 的容器主渲染层片元一律执行 GPU `discard / clip()`，实现 `9.6 m³` 外部 **0 像素越界泄漏**；在 `[-0.08m, 0.0m]` 边界层执行 Hermite 平滑羽化与 `>= 5.0%` 七彩量子棱镜菲涅尔边缘着色。

### 6. `@ ∂Ω` 四类跨界战斗效果接力生成总线（Extended Effect Handoff Bus）
- **类型 A（容器内闭环近战/护体，`range <= t_exit` 且 `aoe <= 1.0m`）**：100% 由容器内部渲染器完成，宿主引擎 0 实体开销；
- **类型 B（超距射线与弹道投射物，如 CS2 步枪子弹、魔兽圣光审判波）**：在 `@ ∂Ω` 穿出点实时转换为宿主引擎坐标系（UE5 厘米左手系 / Unity 米左手系 / Source2 英寸系），驱动宿主原生弹道与粒子系统继续飞行；
- **类型 C（大范围地面法阵/领域，`aoe_radius > 1.0m`，如 5 米半径奉献光环）**：`9.6 m³` 内渲染核心圣印，同时向宿主抛出 `r ∈ [1.0m, 5.0m]` 的环形地形贴花与周期伤害场指令；
- **类型 D（超长近战兵器双段分割，如 2.5 米长柄战戟突刺）**：握柄至 `P_exit` 段保留在容器内渲染，`P_exit` 至戟尖段在宿主物理世界同步生成瞬态 `HOST_PHANTOM_HITBOX_PROXY`。

### 7. 四态外壳隐形控制器与零 DrawCall 硬件剔除（Stealth Envelope Controller）
- 角色登场 `3.0s` 仪式结束后自动切入 `STEALTH_GAMEPLAY_INVISIBLE`（`opacity = 0.0`，`shell_draw_calls = 0`），彻底消除正常游玩时的边框干扰与额外渲染批次；按下 `Alt+R`（`opacity = 0.35`）或收到后台安全唤醒信令（`opacity = 0.85`）时瞬时显影。

### 8. 零拷贝 C99 渲染桥接 ABI（`s2rb_renderer_abi.h`）
- 以固定内存布局 `#[repr(C)]` 结构体一次性向 C++/C# 引擎主循环输出当前帧外壳状态、裁剪参数与待派发 `@ ∂Ω` 破界特效命令缓冲，单帧 CPU 开销 `< 0.04 ms`。
