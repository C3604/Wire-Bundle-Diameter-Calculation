# Aptiv M-Spec 导线库（Indexed JSON）

该数据文件用于**按条件检索导线参数**，适合在浏览器扩展/前端程序中做「级联选择」并快速得到最终数值。

- 源数据：`Aptiv-Mspec.xlsx`
- 输出数据：`aptiv_mspec.indexed.json`
- 记录条数（variants）：**346**
- 关键规格键（Specs）：`Strand Diameter, Cable Outside Diameter, Resistance Length, Mass Length`

---

## 1. 文件结构概览

`aptiv_mspec.indexed.json` 顶层包含 4 个部分：

- `meta`：元信息（来源、生成时间、Specs 键集合、记录数等）
- `variants`：**数组**，每一项是一条可被筛选的导线记录（一个组合）
- `variantsMap`：**字典**，`id -> variant`，用于 O(1) 读取记录
- `indexes`：**索引**，用于快速从条件定位候选 `id` 列表

### 1.1 Variant 结构（单条记录）

```json
{
  "id": "v_XXXXXXXXXXXX",
  "WireSize": 0.13,
  "WallThickness": "Thin",
  "WireType": "FLMRY-A (PVC T2)",
  "ConductorDesign": "A",
  "Specs": {
    "Strand Diameter": 0.16,
    "Cable Outside Diameter": 1.05,
    "Resistance Length": 169.66,
    "Mass Length": 1.161
  }
}
```

> 说明：`Specs` 中**没有数据的项会被省略**（避免出现 `null` 干扰 UI 与计算）。

---

## 2. 索引说明（indexes）

`indexes` 用于把「条件 -> 候选记录 id 列表」预先算好，避免每次筛选都全表扫描。

```json
"indexes": {
  "byWireSize": {
    "0.13": ["v_...","v_..."]
  },
  "byWallThickness": {
    "Thin": ["v_..."]
  },
  "byWireType": {
    "FLMRY-A (PVC T2)": ["v_..."]
  },
  "byConductorDesign": {
    "A": ["v_..."]
  }
}
```

---

## 3. 推荐检索流程（级联选择）

典型 UI 选择顺序：

1. 用户先选 `WireSize`
2. 再选 `WallThickness`
3. 再选 `WireType`
4. 再选 `ConductorDesign`
5. 最后读取 `Specs` 里的目标值（例如 `Cable Outside Diameter`）

### 3.1 JS 伪代码示例（集合求交）

```js
function intersect(a, b) {
  const setB = new Set(b);
  return a.filter(x => setB.has(x));
}

const db = await fetch("aptiv_mspec.indexed.json").then(r => r.json());

let ids = db.indexes.byWireSize["0.13"] ?? [];
ids = intersect(ids, db.indexes.byWallThickness["Thin"] ?? []);
ids = intersect(ids, db.indexes.byWireType["FLMRY-A (PVC T2)"] ?? []);
ids = intersect(ids, db.indexes.byConductorDesign["A"] ?? []);

if (ids.length === 0) throw new Error("No match");
if (ids.length > 1) console.warn("Multiple matches, consider adding more constraints");

const v = db.variantsMap[ids[0]];
const od = v.Specs["Cable Outside Diameter"]; // mm
```

### 3.2 生成下拉选项（示例）

- 当前已选 `WireSize="0.13"` 且 `WallThickness="Thin"` 时：
  - 候选 ids = `intersect(indexes.byWireSize["0.13"], indexes.byWallThickness["Thin"])`
  - 用这些 ids 去 `variantsMap[id].WireType` 去重排序，即可得到 WireType 下拉选项

---

## 4. 字段与单位约定

本文件只保留**值**，单位由语义约定（与源表一致）：

- `Strand Diameter`：mm
- `Cable Outside Diameter`：mm
- `Resistance Length`：mΩ/m（若源表如此）
- `Mass Length`：g/m（若源表如此）

> 如果你希望把单位也写入（例如 `Specs` 变成 `{"value": 1.05, "unit": "mm"}`），可以在下一版输出中加入。

---

## 5. 常见边界情况处理

- **同条件下出现多条记录**：  
  可能是源表存在重复或细分差异。建议 UI 增加更多过滤项，或增加一个“默认选择规则”（例如优先 OD 最大/最小/某 WireType）。

- **某条记录缺少某个 Specs 值**：  
  该键会被省略。读取时请做 `undefined` 兜底。

---

## 6. 版本与稳定 ID

- `id` 通过以下字段计算 SHA1（截断 12 位），保证同一条记录在数据不变时 `id` 稳定：
  - `WireSize + WallThickness + WireType + ConductorDesign + Specs(固定顺序键)`

---

如需我把该结构**直接对接到你的插件 UI（级联选择 + 默认规则 + 结果展示）**，告诉我你希望的默认筛选顺序与优先策略即可。
