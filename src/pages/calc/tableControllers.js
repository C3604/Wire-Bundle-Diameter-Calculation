import { getWireTypeOptions } from "../../utils/wireTypes.js";

function enforceScrollHeight(wrapper, rowCount, maxRows = 4, maxHeight = "164px") {
    if (!wrapper) return;
    wrapper.style.overflowY = "auto";
    wrapper.style.maxHeight = rowCount >= maxRows ? maxHeight : "";
}

function buildOptionElements(selectEl, options, selectedValue) {
    const previousValue = selectEl.value;
    const previousActive = document.activeElement === selectEl;
    selectEl.innerHTML = "";
    options.forEach(({ value, label }) => {
        const option = document.createElement("option");
        option.value = value;
        option.textContent = label;
        if (value === selectedValue) {
            option.selected = true;
        }
        selectEl.appendChild(option);
    });
    if (selectedValue && selectEl.value !== selectedValue) {
        selectEl.value = selectedValue;
    }
    if (previousActive) {
        selectEl.focus();
    }
}

function setInputValuePreserveCaret(input, nextValue) {
    if (input.value === nextValue) return;
    const isActive = document.activeElement === input;
    let selectionStart = null;
    let selectionEnd = null;
    if (isActive) {
        selectionStart = input.selectionStart;
        selectionEnd = input.selectionEnd;
    }
    input.value = nextValue;
    if (isActive && selectionStart != null && selectionEnd != null) {
        input.setSelectionRange(selectionStart, selectionEnd);
    }
}

function resolveAvailableTypes(odLookup, gauge) {
    if (!gauge) return [];
    const data = odLookup[String(gauge)];
    if (!data) return [];
    return Object.entries(data)
        .filter(([, value]) => value !== undefined && value !== null && value !== "")
        .map(([type]) => type);
}

function deriveTypeAndOd(odLookup, gauge, currentType) {
    const availableTypes = resolveAvailableTypes(odLookup, gauge);
    const nextType = availableTypes.includes(currentType)
        ? currentType
        : availableTypes[0] || "";
    const nextOd =
        nextType && odLookup[String(gauge)]
            ? odLookup[String(gauge)][nextType] ?? ""
            : "";
    return {
        type: nextType,
        od: nextOd === undefined || nextOd === null ? "" : String(nextOd),
        availableTypes,
    };
}

export function createStandardTableController({
    tbody,
    bodyWrapper,
    state,
    getGaugeOptions,
    getOdLookup,
    getPlaceholderMessages,
    onChange,
    i18n,
}) {
    const rowMap = new Map();
    let dataSources = { gaugeOptions: [], odLookup: {} };
    let pendingFocus = null;

    function createRowElements(row) {
        const tr = document.createElement("tr");
        tr.dataset.rowId = row.id;

        const indexCell = document.createElement("td");
        indexCell.dataset.cell = "index";
        tr.appendChild(indexCell);

        const gaugeCell = document.createElement("td");
        const gaugeSelect = document.createElement("select");
        gaugeSelect.dataset.role = "gauge";
        gaugeCell.appendChild(gaugeSelect);
        tr.appendChild(gaugeCell);

        const typeCell = document.createElement("td");
        const typeSelect = document.createElement("select");
        typeSelect.dataset.role = "type";
        typeCell.appendChild(typeSelect);
        tr.appendChild(typeCell);

        const odCell = document.createElement("td");
        odCell.dataset.role = "od";
        tr.appendChild(odCell);

        const qtyCell = document.createElement("td");
        const qtyInput = document.createElement("input");
        qtyInput.type = "text";
        qtyInput.inputMode = "numeric";
        qtyInput.maxLength = 4;
        qtyInput.className = "input-qty";
        qtyInput.placeholder = getPlaceholderMessages().qty;
        qtyInput.dataset.role = "qty";
        qtyCell.appendChild(qtyInput);
        tr.appendChild(qtyCell);

        const deleteCell = document.createElement("td");
        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.dataset.role = "delete";
        deleteButton.textContent = "🗑️";
        deleteButton.title = i18n.getMessage("calc_table_delete_row") || "删除此行";
        deleteCell.appendChild(deleteButton);
        tr.appendChild(deleteCell);

        tbody.appendChild(tr);

        const controls = {
            element: tr,
            indexCell,
            gaugeSelect,
            typeSelect,
            odCell,
            qtyInput,
            deleteButton,
        };

        gaugeSelect.addEventListener("change", (evt) => {
            const gauge = evt.target.value;
            const { type, od } = deriveTypeAndOd(
                dataSources.odLookup,
                gauge,
                state.getSnapshot().standardRows.find((r) => r.id === row.id)?.type || "",
            );
            state.updateStandardRow(row.id, { gauge, type, od });
            onChange();
        });
        typeSelect.addEventListener("change", (evt) => {
            const type = evt.target.value;
            const od =
                dataSources.odLookup[String(state.getSnapshot().standardRows.find((r) => r.id === row.id)?.gauge)]?.[
                    type
                ] ?? "";
            state.updateStandardRow(row.id, { type, od });
            onChange();
        });
        qtyInput.addEventListener("input", (evt) => {
            state.updateStandardRow(row.id, { qty: evt.target.value });
            onChange();
        });
        deleteButton.addEventListener("click", () => {
            state.removeStandardRow(row.id);
            onChange();
        });

        return controls;
    }

    function updateTypeOptions(typeSelect, availableTypes, selectedType) {
        const options = getWireTypeOptions(availableTypes).map(({ value, label }) => ({
            value,
            label,
        }));
        buildOptionElements(typeSelect, options, selectedType);
    }

    function updateRowControls(controls, row, index) {
        controls.indexCell.textContent = index + 1;
        buildOptionElements(
            controls.gaugeSelect,
            [{ value: "", label: i18n.getMessage("calc_select_placeholder_choose") || "" }].concat(
                dataSources.gaugeOptions.map((value) => ({
                    value,
                    label: value,
                })),
            ),
            row.gauge || "",
        );

        const { availableTypes } = deriveTypeAndOd(
            dataSources.odLookup,
            row.gauge,
            row.type,
        );
        updateTypeOptions(controls.typeSelect, availableTypes, row.type || "");

        controls.odCell.textContent = row.od || "";
        const placeholders = getPlaceholderMessages();
        if (placeholders?.qty) {
            controls.qtyInput.placeholder = placeholders.qty;
        }
        setInputValuePreserveCaret(controls.qtyInput, row.qty || "");
    }

    function applyPendingFocus() {
        if (!pendingFocus) return;
        const info = pendingFocus;
        pendingFocus = null;
        const record = rowMap.get(info.rowId);
        if (!record) return;
        const control =
            info.control === "gauge"
                ? record.gaugeSelect
                : info.control === "type"
                ? record.typeSelect
                : record.qtyInput;
        if (control && typeof control.focus === "function") {
            control.focus();
            if (control.select) {
                control.select();
            }
        }
    }

    function render(rows) {
        enforceScrollHeight(bodyWrapper, rows.length);
        const seenIds = new Set();
        rows.forEach((row, index) => {
            seenIds.add(row.id);
            let controls = rowMap.get(row.id);
            if (!controls) {
                controls = createRowElements(row);
                rowMap.set(row.id, controls);
            }
            updateRowControls(controls, row, index);
        });
        Array.from(rowMap.keys()).forEach((id) => {
            if (!seenIds.has(id)) {
                const record = rowMap.get(id);
                if (record?.element?.parentNode) {
                    record.element.parentNode.removeChild(record.element);
                }
                rowMap.delete(id);
            }
        });
        applyPendingFocus();
    }

    return {
        render(rows) {
            dataSources = {
                gaugeOptions: getGaugeOptions(),
                odLookup: getOdLookup(),
            };
            render(rows);
        },
        focusRow(rowId, control = "qty") {
            pendingFocus = { rowId, control };
            applyPendingFocus();
        },
    };
}

export function createSpecialTableController({
    tbody,
    bodyWrapper,
    state,
    getPlaceholderMessages,
    onChange,
    i18n,
}) {
    const rowMap = new Map();
    let pendingFocus = null;

    function createRow(row) {
        const tr = document.createElement("tr");
        tr.dataset.rowId = row.id;

        const indexCell = document.createElement("td");
        tr.appendChild(indexCell);

        const odCell = document.createElement("td");
        const odInput = document.createElement("input");
        odInput.type = "text";
        odInput.placeholder = getPlaceholderMessages().od;
        odInput.className = "input-od";
        odCell.appendChild(odInput);
        tr.appendChild(odCell);

        const qtyCell = document.createElement("td");
        const qtyInput = document.createElement("input");
        qtyInput.type = "text";
        qtyInput.inputMode = "numeric";
        qtyInput.placeholder = getPlaceholderMessages().qty;
        qtyInput.className = "input-qty";
        qtyCell.appendChild(qtyInput);
        tr.appendChild(qtyCell);

        const deleteCell = document.createElement("td");
        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.textContent = "🗑️";
        deleteButton.title = i18n.getMessage("calc_table_delete_row") || "删除此行";
        deleteCell.appendChild(deleteButton);
        tr.appendChild(deleteCell);

        tbody.appendChild(tr);

        odInput.addEventListener("input", (evt) => {
            state.updateSpecialRow(row.id, { od: evt.target.value });
            onChange();
        });
        qtyInput.addEventListener("input", (evt) => {
            state.updateSpecialRow(row.id, { qty: evt.target.value });
            onChange();
        });
        deleteButton.addEventListener("click", () => {
            state.removeSpecialRow(row.id);
            onChange();
        });

        return {
            element: tr,
            indexCell,
            odInput,
            qtyInput,
        };
    }

    function applyPendingFocus() {
        if (!pendingFocus) return;
        const info = pendingFocus;
        pendingFocus = null;
        const record = rowMap.get(info.rowId);
        if (!record) return;
        const control = info.control === "od" ? record.odInput : record.qtyInput;
        if (control && control.focus) {
            control.focus();
            if (control.select) {
                control.select();
            }
        }
    }

    return {
        render(rows) {
            enforceScrollHeight(bodyWrapper, rows.length);
            const seenIds = new Set();
            rows.forEach((row, index) => {
                seenIds.add(row.id);
                let controls = rowMap.get(row.id);
                if (!controls) {
                    controls = createRow(row);
                    rowMap.set(row.id, controls);
                }
            controls.indexCell.textContent = index + 1;
            const placeholders = getPlaceholderMessages();
            if (placeholders?.od) {
                controls.odInput.placeholder = placeholders.od;
            }
            if (placeholders?.qty) {
                controls.qtyInput.placeholder = placeholders.qty;
            }
            setInputValuePreserveCaret(controls.odInput, row.od || "");
            setInputValuePreserveCaret(controls.qtyInput, row.qty || "");
            });
            Array.from(rowMap.keys()).forEach((id) => {
                if (!seenIds.has(id)) {
                    const record = rowMap.get(id);
                    record?.element?.remove();
                    rowMap.delete(id);
                }
            });
            applyPendingFocus();
        },
        focusRow(rowId, control = "qty") {
            pendingFocus = { rowId, control };
            applyPendingFocus();
        },
    };
}

export function createWrapTableController({ tbody, bodyWrapper, state, onChange, i18n }) {
    const rowMap = new Map();
    let pendingFocus = null;

    function createRow(row) {
        const tr = document.createElement("tr");
        tr.dataset.rowId = row.id;

        const indexCell = document.createElement("td");
        tr.appendChild(indexCell);

        const thickCell = document.createElement("td");
        const thickInput = document.createElement("input");
        thickInput.type = "text";
        thickInput.className = "input-thick";
        thickInput.placeholder = i18n.getMessage("calc_input_placeholder_thickness") || "";
        thickCell.appendChild(thickInput);
        tr.appendChild(thickCell);

        const deleteCell = document.createElement("td");
        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.textContent = "🗑️";
        deleteButton.title = i18n.getMessage("calc_table_delete_row") || "删除此行";
        deleteCell.appendChild(deleteButton);
        tr.appendChild(deleteCell);

        tbody.appendChild(tr);

        thickInput.addEventListener("input", (evt) => {
            state.updateWrapRow(row.id, { thick: evt.target.value });
            onChange();
        });
        deleteButton.addEventListener("click", () => {
            state.removeWrapRow(row.id);
            onChange();
        });

        return {
            element: tr,
            indexCell,
            thickInput,
        };
    }

    function applyPendingFocus() {
        if (!pendingFocus) return;
        const info = pendingFocus;
        pendingFocus = null;
        const record = rowMap.get(info.rowId);
        if (!record) return;
        if (record.thickInput && record.thickInput.focus) {
            record.thickInput.focus();
            if (record.thickInput.select) {
                record.thickInput.select();
            }
        }
    }

    return {
        render(rows) {
            enforceScrollHeight(bodyWrapper, rows.length, 3, "164px");
            const seenIds = new Set();
            rows.forEach((row, index) => {
                seenIds.add(row.id);
                let controls = rowMap.get(row.id);
                if (!controls) {
                    controls = createRow(row);
                    rowMap.set(row.id, controls);
                }
                controls.indexCell.textContent = index + 1;
                setInputValuePreserveCaret(controls.thickInput, row.thick || "");
            });
            Array.from(rowMap.keys()).forEach((id) => {
                if (!seenIds.has(id)) {
                    const record = rowMap.get(id);
                    record?.element?.remove();
                    rowMap.delete(id);
                }
            });
            applyPendingFocus();
        },
        focusRow(rowId) {
            pendingFocus = { rowId };
            applyPendingFocus();
        },
    };
}
