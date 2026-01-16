import { getJSON, setJSON } from "./storage.js";
import { showToast } from "../components/feedback.js";
import i18n from "../i18n/index.js";

const CACHE_PREFIX = "mspec_cache:";
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
      results.forEach((db, idx) => {
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
        const ws = String(v.WireSize);
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

  resolveIds(selections = {}) {
    const idx = this.getIndexes();
    let ids = this.getAllIds();
    const ws = selections.wireSize;
    const wt = selections.wallThickness;
    const ty = selections.wireType;
    const cd = selections.conductorDesign;
    if (Array.isArray(ws) && ws.length) {
      const lists = ws.map((v) => idx.byWireSize?.[v] || []);
      ids = intersectIds(ids, unionIds(lists));
    }
    if (Array.isArray(wt) && wt.length) {
      const lists = wt.map((v) => idx.byWallThickness?.[v] || []);
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

  buildOptions(selections = {}) {
    const selWs = Array.isArray(selections.wireSize) ? selections.wireSize : [];
    const vmap = this._db?.variantsMap || {};
    const allIds = this.getAllIds();
    const wireSizes = uniqSorted(allIds.map((id) => String(vmap[id]?.WireSize)));
    const idx = this.getIndexes();
    let idsForWall = allIds;
    if (selWs.length) {
      const lists = selWs.map((v) => idx.byWireSize?.[v] || []);
      idsForWall = unionIds(lists);
    }
    const wallThicknesses = uniqSorted(idsForWall.map((id) => vmap[id]?.WallThickness));
    let idsForType = allIds;
    if (selWs.length) {
      const lists = selWs.map((v) => idx.byWireSize?.[v] || []);
      idsForType = unionIds(lists);
    }
    const wireTypes = uniqSorted(idsForType.map((id) => vmap[id]?.WireType));
    let idsForDesign = allIds;
    if (selWs.length) {
      const lists = selWs.map((v) => idx.byWireSize?.[v] || []);
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
