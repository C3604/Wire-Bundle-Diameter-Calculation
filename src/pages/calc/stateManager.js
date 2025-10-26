const CALC_STATE_STORAGE_KEY = "calcPageState";

const DEFAULT_STANDARD_ROWS = [
    { gauge: "0.35", type: "Thin", od: "", qty: "0" },
    { gauge: "0.5", type: "Thin", od: "", qty: "0" },
];

const DEFAULT_SPECIAL_ROWS = [{ od: "2.5", qty: "0" }];

const DEFAULT_WRAP_ROWS = [{ thick: "0.5" }];

let rowSequence = 0;
const nextRowId = (prefix) => `${prefix}-${Date.now().toString(36)}-${rowSequence++}`;

const runtime = typeof window !== "undefined" ? window : globalThis;

function ensureRowId(row, prefix) {
    if (row.id) return row;
    return { ...row, id: nextRowId(prefix) };
}

function normalizeStandardRows(rows) {
    return (rows || []).map((row) =>
        ensureRowId(
            {
                gauge: row.gauge ?? "",
                type: row.type ?? "",
                od: row.od ?? "",
                qty: row.qty ?? "",
                id: row.id,
            },
            "std",
        ),
    );
}

function normalizeSpecialRows(rows) {
    return (rows || []).map((row) =>
        ensureRowId(
            {
                od: row.od ?? "",
                qty: row.qty ?? "",
                id: row.id,
            },
            "spc",
        ),
    );
}

function normalizeWrapRows(rows) {
    return (rows || []).map((row) =>
        ensureRowId(
            {
                thick: row.thick ?? "",
                id: row.id,
            },
            "wrp",
        ),
    );
}

function cloneState(state) {
    return {
        standardRows: state.standardRows.map((row) => ({ ...row })),
        specialRows: state.specialRows.map((row) => ({ ...row })),
        wrapRows: state.wrapRows.map((row) => ({ ...row })),
        tolerance: state.tolerance,
        score: state.score,
        saveHistory: state.saveHistory,
    };
}

function createDefaultState() {
    return {
        standardRows: normalizeStandardRows(DEFAULT_STANDARD_ROWS),
        specialRows: normalizeSpecialRows(DEFAULT_SPECIAL_ROWS),
        wrapRows: normalizeWrapRows(DEFAULT_WRAP_ROWS),
        tolerance: 110,
        score: 10,
        saveHistory: false,
    };
}

/**
 * Create a state manager for the Calc page.
 * @param {{ getJSON: (key: string, fallback?: any) => Promise<any>, setJSON: (key: string, value: any) => Promise<void> }} storage
 */
export function createCalcStateManager(storage) {
    const listeners = new Set();
    let state = createDefaultState();
    let saveHandle = null;
    let idleCallbackId = null;

    function notify(change) {
        const snapshot = cloneState(state);
        listeners.forEach((listener) => {
            try {
                listener(change, snapshot);
            } catch (error) {
                console.error("calcState listener threw", error);
            }
        });
    }

    function scheduleSave() {
        const persist = async () => {
            saveHandle = null;
            idleCallbackId = null;
            try {
                await storage.setJSON(CALC_STATE_STORAGE_KEY, exportState());
            } catch (error) {
                console.error("Failed to persist calc state", error);
            }
        };

        if (runtime && typeof runtime.requestIdleCallback === "function") {
            if (idleCallbackId) return;
            idleCallbackId = runtime.requestIdleCallback(persist, { timeout: 500 });
        } else {
            if (saveHandle) return;
            saveHandle = runtime.setTimeout(persist, 200);
        }
    }

    function exportState() {
        return {
            standardRows: state.standardRows,
            specialRows: state.specialRows,
            wrapRows: state.wrapRows,
            tolerance: state.tolerance,
            score: state.score,
            saveHistory: state.saveHistory,
        };
    }

    function setState(partial, change) {
        state = { ...state, ...partial };
        scheduleSave();
        notify(change);
    }

    function updateRows(tableKey, updater, change) {
        const updatedRows = updater(state[tableKey]);
        state = { ...state, [tableKey]: updatedRows };
        scheduleSave();
        notify(change);
    }

    return {
        async load() {
            try {
                const saved = await storage.getJSON(CALC_STATE_STORAGE_KEY, null);
                if (!saved) {
                    state = createDefaultState();
                    notify({ type: "state:init" });
                    return cloneState(state);
                }
                state = {
                    standardRows: normalizeStandardRows(
                        saved.standardRows?.length ? saved.standardRows : DEFAULT_STANDARD_ROWS,
                    ),
                    specialRows: normalizeSpecialRows(
                        saved.specialRows?.length ? saved.specialRows : DEFAULT_SPECIAL_ROWS,
                    ),
                    wrapRows: normalizeWrapRows(
                        saved.wrapRows?.length ? saved.wrapRows : DEFAULT_WRAP_ROWS,
                    ),
                    tolerance: Number.parseInt(saved.tolerance, 10) || 110,
                    score: Number.parseInt(saved.score, 10) || 10,
                    saveHistory: Boolean(saved.saveHistory),
                };
                notify({ type: "state:loaded" });
                return cloneState(state);
            } catch (error) {
                console.error("Failed to load calc state", error);
                state = createDefaultState();
                notify({ type: "state:init" });
                return cloneState(state);
            }
        },
        resetAll() {
            state = createDefaultState();
            scheduleSave();
            notify({ type: "state:reset-all" });
            return cloneState(state);
        },
        getSnapshot() {
            return cloneState(state);
        },
        subscribe(listener) {
            listeners.add(listener);
            return () => listeners.delete(listener);
        },
        addStandardRow(initial = { gauge: "", type: "", od: "", qty: "1" }) {
            const newRow = ensureRowId(
                {
                    gauge: initial.gauge ?? "",
                    type: initial.type ?? "",
                    od: initial.od ?? "",
                    qty: initial.qty ?? "",
                },
                "std",
            );
            updateRows(
                "standardRows",
                (rows) => [...rows, newRow],
                { type: "standard:add", row: newRow },
            );
            return newRow;
        },
        updateStandardRow(rowId, updates) {
            let targetRow = null;
            updateRows(
                "standardRows",
                (rows) =>
                    rows.map((row) => {
                        if (row.id !== rowId) return row;
                        targetRow = { ...row, ...updates };
                        return targetRow;
                    }),
                { type: "standard:update", row: targetRow },
            );
            return targetRow;
        },
        removeStandardRow(rowId) {
            updateRows(
                "standardRows",
                (rows) => rows.filter((row) => row.id !== rowId),
                { type: "standard:remove", rowId },
            );
        },
        resetStandardRows() {
            setState(
                {
                    standardRows: normalizeStandardRows(DEFAULT_STANDARD_ROWS),
                },
                { type: "standard:reset" },
            );
        },
        setStandardRows(rows) {
            setState(
                {
                    standardRows: normalizeStandardRows(rows),
                },
                { type: "standard:set" },
            );
        },
        addSpecialRow(initial = { od: "", qty: "1" }) {
            const newRow = ensureRowId(
                {
                    od: initial.od ?? "",
                    qty: initial.qty ?? "",
                },
                "spc",
            );
            updateRows(
                "specialRows",
                (rows) => [...rows, newRow],
                { type: "special:add", row: newRow },
            );
            return newRow;
        },
        updateSpecialRow(rowId, updates) {
            let targetRow = null;
            updateRows(
                "specialRows",
                (rows) =>
                    rows.map((row) => {
                        if (row.id !== rowId) return row;
                        targetRow = { ...row, ...updates };
                        return targetRow;
                    }),
                { type: "special:update", row: targetRow },
            );
            return targetRow;
        },
        removeSpecialRow(rowId) {
            updateRows(
                "specialRows",
                (rows) => rows.filter((row) => row.id !== rowId),
                { type: "special:remove", rowId },
            );
        },
        resetSpecialRows() {
            setState(
                {
                    specialRows: normalizeSpecialRows(DEFAULT_SPECIAL_ROWS),
                },
                { type: "special:reset" },
            );
        },
        addWrapRow(initial = { thick: "" }) {
            const newRow = ensureRowId(
                {
                    thick: initial.thick ?? "",
                },
                "wrp",
            );
            updateRows(
                "wrapRows",
                (rows) => [...rows, newRow],
                { type: "wrap:add", row: newRow },
            );
            return newRow;
        },
        updateWrapRow(rowId, updates) {
            let targetRow = null;
            updateRows(
                "wrapRows",
                (rows) =>
                    rows.map((row) => {
                        if (row.id !== rowId) return row;
                        targetRow = { ...row, ...updates };
                        return targetRow;
                    }),
                { type: "wrap:update", row: targetRow },
            );
            return targetRow;
        },
        removeWrapRow(rowId) {
            updateRows(
                "wrapRows",
                (rows) => rows.filter((row) => row.id !== rowId),
                { type: "wrap:remove", rowId },
            );
        },
        resetWrapRows() {
            setState(
                {
                    wrapRows: normalizeWrapRows(DEFAULT_WRAP_ROWS),
                },
                { type: "wrap:reset" },
            );
        },
        setTolerance(value) {
            const tolerance = Number.parseInt(value, 10);
            if (!Number.isFinite(tolerance)) return;
            const clamped = Math.min(200, Math.max(100, tolerance));
            setState({ tolerance: clamped }, { type: "tolerance", value: clamped });
        },
        setScore(value) {
            const score = Number.parseInt(value, 10);
            if (!Number.isFinite(score)) return;
            const clamped = Math.min(100, Math.max(1, score));
            setState({ score: clamped }, { type: "score", value: clamped });
        },
        setSaveHistory(flag) {
            setState({ saveHistory: Boolean(flag) }, { type: "saveHistory", value: Boolean(flag) });
        },
    };
}
