const WIRE_STANDARD_DIR = 'src/storage/WireStandard';
const INDEX_FILE = `${WIRE_STANDARD_DIR}/index.json`;
const DEFAULT_WHITELIST = ['ISO_6722', 'JASO_D611', 'SAE_J1128'];

function getUrl(path) {
  try {
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getURL) {
      return chrome.runtime.getURL(path);
    }
  } catch (_) {}
  return path;
}

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) {
    const err = new Error(`HTTP ${res.status} for ${url}`);
    err.status = res.status;
    throw err;
  }
  return res.json();
}

function normalizeStandardJson(json) {
  let name = '';
  let data = [];
  if (Array.isArray(json)) {
    data = json.map((item) => {
      const gauge = Number(item.gauge);
      const out = {
        gauge,
        gaugeLabel: Number.isFinite(gauge) ? String(gauge) : String(item.gauge),
        thin: item.thin,
        thick: item.thick,
        ultraThin: item.ultraThin,
      };
      return out;
    });
  } else if (json && typeof json === 'object') {
    name = json.name || json.Standard || '';
    if (Array.isArray(json.data)) {
      data = json.data.map((item) => {
        const gauge = Number(item.gauge);
        return {
          gauge,
          gaugeLabel: Number.isFinite(gauge) ? String(gauge) : String(item.gauge),
          thin: item.thin,
          thick: item.thick,
          ultraThin: item.ultraThin,
        };
      });
    } else if (Array.isArray(json.Wires)) {
      data = json.Wires.map((w) => {
        const gaugeStr = w.Name != null ? String(w.Name) : '';
        const gauge = parseFloat(gaugeStr);
        const type = w.Type || {};
        const hasStdKeys =
          type.thin != null || type.thick != null || type.ultraThin != null;
        if (hasStdKeys) {
          return {
            gauge,
            gaugeLabel: gaugeStr,
            thin: type.thin != null ? Number(type.thin) : undefined,
            thick: type.thick != null ? Number(type.thick) : undefined,
            ultraThin: type.ultraThin != null ? Number(type.ultraThin) : undefined,
            rawTypes: { ...type },
          };
        }
        const values = Object.values(type)
          .map((v) => Number(v))
          .filter((v) => Number.isFinite(v))
          .sort((a, b) => a - b);
        let ultraThin, thin, thick;
        if (values.length === 1) {
          thin = values[0];
        } else if (values.length === 2) {
          ultraThin = values[0];
          thin = values[1];
        } else if (values.length >= 3) {
          ultraThin = values[0];
          thin = values[1];
          thick = values[values.length - 1];
        }
        return { gauge, gaugeLabel: gaugeStr, thin, thick, ultraThin, rawTypes: { ...type } };
      });
    } else {
      data = [];
    }
  }
  const normalized = [];
  for (const item of data) {
    if (!item || typeof item !== 'object') continue;
    const gauge = Number(item.gauge);
    const thin = item.thin === null ? null : (item.thin !== undefined ? Number(item.thin) : undefined);
    const thick = item.thick === null ? null : (item.thick !== undefined ? Number(item.thick) : undefined);
    const ultraThin = item.ultraThin === null ? null : (item.ultraThin !== undefined ? Number(item.ultraThin) : undefined);
    if (!Number.isFinite(gauge)) continue;
    const out = { gauge, gaugeLabel: item.gaugeLabel || String(item.gauge) };
    if (thin !== undefined) out.thin = Number.isFinite(thin) ? thin : null;
    if (thick !== undefined) out.thick = Number.isFinite(thick) ? thick : null;
    if (ultraThin !== undefined) out.ultraThin = Number.isFinite(ultraThin) ? ultraThin : null;
    if (item.rawTypes && typeof item.rawTypes === 'object') out.rawTypes = { ...item.rawTypes };
    normalized.push(out);
  }
  normalized.sort((a, b) => a.gauge - b.gauge);
  return { name, data: normalized };
}

export async function listAvailableStandards() {
  try {
    const url = getUrl(INDEX_FILE);
    const index = await fetchJson(url);
    if (Array.isArray(index) && index.length > 0) {
      return index
        .map((n) => (typeof n === 'string' ? { name: n, file: `${n}.json` } : n))
        .filter((x) => x && x.name && x.file)
        .map((x) => ({
          name: x.name,
          file: x.file,
          displayName: x.displayName || x.name,
        }));
    }
  } catch (e) {
  }
  const candidates = DEFAULT_WHITELIST.map((n) => ({ name: n, file: `${n}.json`, displayName: n }));
  const available = [];
  for (const cand of candidates) {
    try {
      const url = getUrl(`${WIRE_STANDARD_DIR}/${cand.file}`);
      const res = await fetch(url, { method: 'HEAD' });
      if (res.ok) available.push(cand);
    } catch (_) {}
  }
  return available;
}

export async function loadStandardByName(name) {
  const file = `${name}.json`;
  const url = getUrl(`${WIRE_STANDARD_DIR}/${file}`);
  const raw = await fetchJson(url);
  const { name: metaName, data } = normalizeStandardJson(raw);
  return {
    name: metaName || name,
    data,
  };
}

export function safeParseStandard(json) {
  try {
    return normalizeStandardJson(json);
  } catch (_) {
    return { name: '', data: [] };
  }
}
