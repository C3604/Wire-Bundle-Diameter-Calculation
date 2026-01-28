import { getJSON, setJSON } from "./storage.js";
import { showToast } from "../components/feedback.js";
import i18n from "../i18n/index.js";

const CACHE_PREFIX = "mspec_cache_v2:";
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

function makeUrl(p) {
  if (
    typeof chrome !== "undefined" &&
    chrome.runtime &&
    typeof chrome.runtime.getURL === "function"
  ) {
    return chrome.runtime.getURL(p);
  }
  return p;
}

function uniqSorted(arr) {
  const s = new Set();
  arr.forEach((v) => {
    if (v != null && v !== "") s.add(String(v));
  });
  return Array.from(s).sort((a, b) => (a > b ? 1 : a < b ? -1 : 0));
}

function intersectIds(a, b) {
  if (!a || !b) return [];
  const setB = new Set(b);
  return a.filter((x) => setB.has(x));
}
function unionIds(lists) {
  const set = new Set();
  lists.forEach((arr) => {
    if (Array.isArray(arr)) arr.forEach((x) => set.add(x));
  });
  return Array.from(set);
}

class MSpecService {
  constructor() {
    this._loaded = false;
    this._db = null;
    this._allIds = null;
    this._url = "src/storage/Database/Aptiv_M-Spec.indexed.json";
    this._sources = null;
    this._wsKeyById = {};
    this._canonicalKeys = {
      byWireSize: new Set(),
      byWallThickness: new Set(),
      byWireType: new Set(),
      byConductorDesign: new Set(),
    };
  }

  setSource(nameOrPath) {
    if (!nameOrPath) return;
    const isJson = /\.json$/i.test(nameOrPath);
    const isIndexed = /\.indexed\.json$/i.test(nameOrPath);
    const base = isJson ? nameOrPath : `src/storage/Database/${nameOrPath}${isIndexed ? "" : ".indexed.json"}`;
    this._url = base;
    this._sources = null;
    this._loaded = false;
    this._db = null;
    this._allIds = null;
  }

  setSources(names) {
    const list = Array.isArray(names) ? names.filter(Boolean) : [];
    if (!list.length) return;
    this._sources = list.map((n) =>
      /\.json$/i.test(n) ? n : `src/storage/Database/${n}${/\.indexed\.json$/i.test(n) ? "" : ".indexed.json"}`,
    );
    this._loaded = false;
    this._db = null;
    this._allIds = null;
  }

  _cacheKey() {
    if (this._sources && this._sources.length) {
      const key = this._sources.slice().sort().join("|");
      return CACHE_PREFIX + key;
    }
    return CACHE_PREFIX + (this._url || "default");
  }

  async load() {
    if (this._loaded && this._db) return this._db;

    const cached = getJSON(this._cacheKey(), null);
    const now = Date.now();
    if (cached && cached.savedAt && now - cached.savedAt < CACHE_TTL_MS) {
      this._db = cached.data;
      this._loaded = true;
      this._prepare();
      // Restore canonical keys from cached indexes
      if (this._db && this._db.indexes) {
        const idx = this._db.indexes;
        if (idx.byWireSize) Object.keys(idx.byWireSize).forEach(k => this._canonicalKeys.byWireSize.add(k));
        if (idx.byWallThickness) Object.keys(idx.byWallThickness).forEach(k => this._canonicalKeys.byWallThickness.add(k));
        if (idx.byWireType) Object.keys(idx.byWireType).forEach(k => this._canonicalKeys.byWireType.add(k));
        if (idx.byConductorDesign) Object.keys(idx.byConductorDesign).forEach(k => this._canonicalKeys.byConductorDesign.add(k));
      }
      return this._db;
    }

    let merged;
    const urls = this._sources && this._sources.length ? this._sources : [this._url];
    try {
      const results = await Promise.all(
        urls.map(async (u) => {
          const resp = await fetch(makeUrl(u));
          if (!resp.ok) throw new Error(`fetch failed: ${u}`);
          return resp.json();
        }),
      );
      // 合并 variantsMap 与重建 indexes
      const variantsMap = {};
      // 先清空 canonicalKeys
      this._canonicalKeys.byWireSize.clear();
      this._canonicalKeys.byWallThickness.clear();
      this._canonicalKeys.byWireType.clear();
      this._canonicalKeys.byConductorDesign.clear();
      // 清空反向映射
      this._wsKeyById = {};
      results.forEach((db, idx) => {
        // 收集原始索引键，保留数据源格式
        if (db && db.indexes) {
          try {
            const iw = db.indexes.byWireSize || {};
            const iwt = db.indexes.byWallThickness || {};
            const ity = db.indexes.byWireType || {};
            const icd = db.indexes.byConductorDesign || {};
            Object.keys(iw).forEach((k) => this._canonicalKeys.byWireSize.add(String(k)));
            Object.keys(iwt).forEach((k) => this._canonicalKeys.byWallThickness.add(String(k)));
            Object.keys(ity).forEach((k) => this._canonicalKeys.byWireType.add(String(k)));
            Object.keys(icd).forEach((k) => this._canonicalKeys.byConductorDesign.add(String(k)));
            // 构建 WireSize 反向映射：合并后的 id -> 源索引键
            Object.entries(iw).forEach(([key, idList]) => {
              if (Array.isArray(idList)) {
                idList.forEach((rawId) => {
                  const mergedId = `${urls[idx]}::${rawId}`;
                  this._wsKeyById[mergedId] = String(key);
                });
              }
            });
          } catch (_) {}
        }
        if (Array.isArray(db.variants)) {
          db.variants.forEach((v) => {
            if (!v || !v.id) return;
            const key = `${urls[idx]}::${v.id}`;
            variantsMap[key] = { ...v, id: key };
          });
        } else if (db.variantsMap) {
          Object.entries(db.variantsMap).forEach(([id, v]) => {
            if (!v) return;
            const key = `${urls[idx]}::${id}`;
            variantsMap[key] = { ...v, id: key };
          });
        }
      });
      // 重建索引
      const indexes = {
        byWireSize: {},
        byWallThickness: {},
        byWireType: {},
        byConductorDesign: {},
      };
      Object.values(variantsMap).forEach((v) => {
        const id = v.id;
        let ws = this.getWireSizeKeyForId(id);
        if (!ws && v.WireSize != null) ws = String(v.WireSize);
        const wt = v.WallThickness;
        const ty = v.WireType;
        const cd = v.ConductorDesign;
        if (ws != null) (indexes.byWireSize[ws] ||= []).push(id);
        if (wt != null) (indexes.byWallThickness[wt] ||= []).push(id);
        if (ty != null) (indexes.byWireType[ty] ||= []).push(id);
        if (cd != null) (indexes.byConductorDesign[cd] ||= []).push(id);
      });
      merged = { variantsMap, indexes, meta: { mergedFrom: urls } };
    } catch (e) {
      if (cached && cached.data) {
        this._db = cached.data;
        this._loaded = true;
        this._prepare();
        showToast(i18n.getMessage("mspec_load_fallback") || "数据源加载失败，已使用本地缓存", "warning");
        return this._db;
      }
      throw e;
    }
    this._db = merged;
    this._loaded = true;
    this._prepare();
    setJSON(this._cacheKey(), { data: merged, savedAt: now });
    return this._db;
  }

  _prepare() {
    const m = this._db;
    if (!m) return;
    if (m.variantsMap) {
      this._allIds = Object.keys(m.variantsMap);
    } else if (Array.isArray(m.variants)) {
      this._allIds = m.variants.map((v) => v.id).filter(Boolean);
      m.variantsMap = {};
      m.variants.forEach((v) => {
        if (v && v.id) m.variantsMap[v.id] = v;
      });
    } else {
      this._allIds = [];
    }
  }

  getAllIds() {
    return this._allIds || [];
  }

  getIndexes() {
    return this._db?.indexes || {};
  }

  getVariant(id) {
    return this._db?.variantsMap?.[id] || null;
  }

  getWireSizeKeyForId(id) {
    const k = this._wsKeyById?.[id];
    if (k != null) return String(k);
    const v = this.getVariant(id);
    return v && v.WireSize != null ? String(v.WireSize) : "";
  }

  resolveIds(selections = {}) {
    const idx = this.getIndexes();
    let ids = this.getAllIds();
    const ws = selections.wireSize;
    const wt = selections.wallThickness;
    const ty = selections.wireType;
    const cd = selections.conductorDesign;
    if (Array.isArray(ws) && ws.length) {
      const canonicalWs = ws.map((v) => this.ensureWireSizeKey(v));
      const lists = canonicalWs.map((v) => idx.byWireSize?.[v] || []);
      ids = intersectIds(ids, unionIds(lists));
    }
    if (Array.isArray(wt) && wt.length) {
      const canonicalWt = wt.map((v) => this.ensureWallThicknessKey(v));
      const lists = canonicalWt.map((v) => idx.byWallThickness?.[v] || []);
      ids = intersectIds(ids, unionIds(lists));
    }
    if (Array.isArray(ty) && ty.length) {
      const lists = ty.map((v) => idx.byWireType?.[v] || []);
      ids = intersectIds(ids, unionIds(lists));
    }
    if (Array.isArray(cd) && cd.length) {
      const lists = cd.map((v) => idx.byConductorDesign?.[v] || []);
      ids = intersectIds(ids, unionIds(lists));
    }
    return ids;
  }

  resolveMaxOD(selections = {}) {
    const ids = this.resolveIds(selections);
    const vmap = this._db?.variantsMap || {};
    let maxOd = null;
    const items = [];
    for (const id of ids) {
      const v = vmap[id];
      if (!v) continue;
      const od = v.Specs && v.Specs["Cable Outside Diameter"];
      const num = od == null ? NaN : Number(od);
      if (Number.isFinite(num)) {
        items.push({ id, od: num });
        if (maxOd == null || num > maxOd) maxOd = num;
      } else {
        items.push({ id, od: null });
      }
    }
    return { maxOd, ids, items };
  }

  buildOptions(selections = {}) {
    const selWs = Array.isArray(selections.wireSize) ? selections.wireSize : [];
    const vmap = this._db?.variantsMap || {};
    const allIds = this.getAllIds();
    const canonicalWireSizes = Array.from(this._canonicalKeys.byWireSize);
    const wireSizes =
      canonicalWireSizes.length > 0
        ? uniqSorted(canonicalWireSizes)
        : uniqSorted(Object.keys(this.getIndexes().byWireSize || {}));
    const idx = this.getIndexes();
    let idsForWall = allIds;
    if (selWs.length) {
      const lists = selWs
        .map((v) => this.ensureWireSizeKey(v))
        .map((v) => idx.byWireSize?.[v] || []);
      idsForWall = unionIds(lists);
    }
    const rawWalls = idsForWall.map((id) => vmap[id]?.WallThickness).filter((v) => v != null && v !== "");
    const wallThicknesses = uniqSorted(
      rawWalls
        .map((v) => this.ensureWallThicknessKey(v))
        .filter((v) => v != null && v !== ""),
    );
    let idsForType = allIds;
    if (selWs.length) {
      const lists = selWs
        .map((v) => this.ensureWireSizeKey(v))
        .map((v) => idx.byWireSize?.[v] || []);
      idsForType = unionIds(lists);
    }
    const wireTypes = uniqSorted(idsForType.map((id) => vmap[id]?.WireType));
    let idsForDesign = allIds;
    if (selWs.length) {
      const lists = selWs
        .map((v) => this.ensureWireSizeKey(v))
        .map((v) => idx.byWireSize?.[v] || []);
      idsForDesign = unionIds(lists);
    }
    const conductorDesigns = uniqSorted(idsForDesign.map((id) => vmap[id]?.ConductorDesign));
    return {
      wireSizes,
      wallThicknesses,
      wireTypes,
      conductorDesigns,
    };
  }

  ensureWireSizeKey(value) {
    const valStr = String(value);
    const num = Number.parseFloat(valStr);
    if (!Number.isFinite(num)) return valStr;
    // 精确匹配原始键
    if (this._canonicalKeys.byWireSize.has(valStr)) return valStr;
    // 数值等价匹配（如 "1" -> "1.0"）
    for (const k of this._canonicalKeys.byWireSize) {
      const kn = Number.parseFloat(k);
      if (Number.isFinite(kn) && kn === num) return k;
    }
    // 回退：尝试 idx 键集中寻找数值等价
    const idxKeys = Object.keys(this.getIndexes().byWireSize || {});
    for (const k of idxKeys) {
      const kn = Number.parseFloat(k);
      if (Number.isFinite(kn) && kn === num) return k;
    }
    return valStr;
  }

  ensureWallThicknessKey(value) {
    const v0 = String(value || "");
    const v1 = v0.trim();
    const lower = v1.toLowerCase();
    let normalized = v1;
    if (lower === "thin") normalized = "Thin";
    else if (lower === "thick") normalized = "Thick";
    else if (lower === "ultrathin" || lower === "ultra thin") normalized = "Ultra Thin";
    if (this._canonicalKeys.byWallThickness.has(normalized)) return normalized;
    for (const k of this._canonicalKeys.byWallThickness) {
      const kk = String(k).trim();
      if (kk.toLowerCase() === lower) return k;
      const kl = kk.toLowerCase().replace(/\s+/g, "");
      const nl = normalized.toLowerCase().replace(/\s+/g, "");
      if (kl === nl) return k;
    }
    return normalized;
  }

  getSpecsForSelection(selections = {}) {
    const ids = this.resolveIds(selections);
    if (!ids.length) return { matchCount: 0, specs: null, variant: null };
    const v = this.getVariant(ids[0]);
    const specs = v?.Specs || null;
    return { matchCount: ids.length, specs, variant: v };
  }
}

const mspecService = new MSpecService();
export default mspecService;
