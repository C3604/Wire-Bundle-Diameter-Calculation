// --- Constants ---
const PI = Math.PI;
const SNG_R2_TO_R1 = 1.01; // Ratio Outer Container / Inner Packing Area
const ACCELERATION = 1.7; // How strongly circles push apart per step
const WEIGHT_FACTOR = 2; // Exponent for mass calculation (r^WF) -> affects how large circles push smaller ones
const CONVERGENCE_THRESHOLD = 0.001; // Target average penetration per radius for convergence
const MAX_ITERATIONS_RUNPACKING = 500; // Safety break for main packing loop
const MAX_ITERATIONS_PACKSTEP = 15; // Max iterations within each main loop step before resizing container
const CONTAINER_ADJUST_FACTOR = 0.05; // How much to adjust container size based on penetration
const CANVAS_PADDING = 15; // Padding around the drawing in the canvas

// --- Wire OD Lookup Table (Data Source) ---
// Format: "Gauge (mm²)": { "InsulationType": Diameter (mm) || null }
const WIRE_OD_TABLE = {
    "0.13": { Thin: 1.05, Thick: null, "Ultra Thin": 0.95 }, "0.22": { Thin: 1.20, Thick: null, "Ultra Thin": 1.05 },
    "0.35": { Thin: 1.40, Thick: null, "Ultra Thin": 1.20 }, "0.5":  { Thin: 1.60, Thick: 2.30, "Ultra Thin": 1.40 },
    "0.75": { Thin: 1.90, Thick: 2.50, "Ultra Thin": 1.60 }, "1":    { Thin: 2.10, Thick: 2.70, "Ultra Thin": 1.75 },
    "1.25": { Thin: 2.30, Thick: 2.95, "Ultra Thin": 2.00 }, "1.5":  { Thin: 2.40, Thick: 3.00, "Ultra Thin": 2.10 },
    "2":    { Thin: 2.80, Thick: 3.30, "Ultra Thin": 2.40 }, "2.5":  { Thin: 3.00, Thick: 3.60, "Ultra Thin": 2.70 },
    "3":    { Thin: 3.40, Thick: 4.10, "Ultra Thin": null }, "4":    { Thin: 3.70, Thick: 4.40, "Ultra Thin": null },
    "5":    { Thin: 4.20, Thick: 4.90, "Ultra Thin": null }, "6":    { Thin: 4.30, Thick: 5.00, "Ultra Thin": null },
    "8":    { Thin: 5.00, Thick: 5.90, "Ultra Thin": null }, "10":   { Thin: 6.00, Thick: 6.50, "Ultra Thin": null },
    "12":   { Thin: 6.50, Thick: 7.40, "Ultra Thin": null }, "16":   { Thin: 7.20, Thick: 8.30, "Ultra Thin": null },
    "20":   { Thin: 7.80, Thick: 9.10, "Ultra Thin": null }, "25":   { Thin: 8.70, Thick: 10.4, "Ultra Thin": null },
    "30":   { Thin: 9.60, Thick: 10.9, "Ultra Thin": null }, "35":   { Thin: 10.4, Thick: 11.6, "Ultra Thin": null },
    "40":   { Thin: 11.1, Thick: 12.4, "Ultra Thin": null }, "50":   { Thin: 12.2, Thick: 13.5, "Ultra Thin": null },
    "60":   { Thin: 13.3, Thick: 14.6, "Ultra Thin": null }, "70":   { Thin: 14.4, Thick: 15.5, "Ultra Thin": null },
    "95":   { Thin: 16.7, Thick: 18.0, "Ultra Thin": null }, "120":  { Thin: null, Thick: 19.7, "Ultra Thin": null },
};
const STANDARD_GAUGES = Object.keys(WIRE_OD_TABLE);
const WIRE_TYPES = ["Thin", "Thick", "Ultra Thin"];

// --- Global Variables ---
let lastSimulationCircles = null; // Store data for the last simulation to redraw if needed
let simulationHistoryChartInstance = null; // To hold the Chart.js object

// --- DOM References (Defined after DOMContentLoaded) ---
let standardWireInputsContainer, specialWireInputsContainer, wrappingInputsContainer;
let calculateButton, calculateButtonText, loadingIndicator, resetButton;
let resultsDiv, minOdSpan, maxOdSpan, avgOdSpan;
let totalWiresSpan, totalWrappingThicknessSpan;
let slider, sliderValueSpan, inputErrorDiv;
let canvas, ctx;
let simulationChartContainer = null; // DOM Element for the chart container
let toggleChartButton = null; // DOM Element for the toggle button


// --- Utility Functions ---
function distanceSq(x1, y1, x2, y2) { const dx = x1 - x2; const dy = y1 - y2; return dx * dx + dy * dy; }
function distance(x1, y1, x2, y2) { return Math.sqrt(distanceSq(x1, y1, x2, y2)); }
// Optimized collision check: Quick bounding box check first
function fastCheckCollision(x1, y1, r1, x2, y2, r2) {
    const totalRadius = r1 + r2;
    if (Math.abs(x1 - x2) > totalRadius || Math.abs(y1 - y2) > totalRadius) {
        return false; // Not colliding based on bounding box
    }
    // If bounding boxes overlap, check actual distance
    return distanceSq(x1, y1, x2, y2) < totalRadius * totalRadius;
}
function fRand(min, max) { return Math.random() * (max - min) + min; }

// --- Core Simulation Logic --- (No changes in simulation logic itself)

/**
 * Calculates the 'contact norm' - a measure of how much circles are overlapping (penetrating).
 * Returns the average penetration distance relative to circle radius.
 * @param {Array<Object>} circles - Array of circle objects {x, y, r, ...}
 * @returns {number} Average penetration norm.
 */
function calculateContactNorm(circles) {
    const nCircles = circles.length;
    if (nCircles < 2) return 0;
    const innerContainerRadius = circles[1]?.r ?? 0;
    let totalPenetration = 0;
    let activeCircles = 0;
    for (let i = 1; i < nCircles; i++) { if (circles[i]) { circles[i].n = 0; circles[i].d = 0; } }
    for (let i = 2; i < nCircles; i++) {
        const circle_i = circles[i];
        if (!circle_i || circle_i.r <= 0) continue;
        activeCircles++;
        let penetration_i = 0;
        if (circles[1]) {
            const distSqFromCenter = distanceSq(circle_i.x, circle_i.y, 0, 0);
            const boundaryDist = innerContainerRadius - circle_i.r;
            if (boundaryDist > 0 && distSqFromCenter > boundaryDist * boundaryDist) {
                 const distFromCenter = Math.sqrt(distSqFromCenter);
                 const penetration = Math.abs(distFromCenter + circle_i.r - innerContainerRadius);
                 if (penetration > 1e-9) { circles[1].n++; circle_i.n++; circles[1].d += penetration; penetration_i += penetration; }
            } else if (boundaryDist <= 0) {
                const distFromCenter = Math.sqrt(distSqFromCenter);
                const penetration = Math.abs(distFromCenter + circle_i.r - innerContainerRadius);
                 if (penetration > 1e-9) { circles[1].n++; circle_i.n++; circles[1].d += penetration; penetration_i += penetration; }
            }
        }
        for (let j = i + 1; j < nCircles; j++) {
            const circle_j = circles[j];
            if (!circle_j || circle_j.r <= 0) continue;
            if (fastCheckCollision(circle_i.x, circle_i.y, circle_i.r, circle_j.x, circle_j.y, circle_j.r)) {
                const dist = distance(circle_i.x, circle_i.y, circle_j.x, circle_j.y);
                const totalRadius = circle_i.r + circle_j.r;
                if (dist < totalRadius - 1e-9) {
                    const penetration = Math.abs(totalRadius - dist);
                    if (penetration > 1e-9) { circle_i.n++; circle_j.n++; penetration_i += penetration; circles[j].d = (circles[j].d || 0) + penetration; }
                }
            }
        }
        if (circle_i.r > 0) { circles[i].d = penetration_i; totalPenetration += penetration_i / (2 * circle_i.r); }
    }
    return activeCircles > 0 ? totalPenetration / activeCircles : 0;
}

/**
 * Performs one step of the packing simulation.
 * @param {Array<Object>} circles - Array of circle objects {x, y, r, ...}
 * @param {number} acceleration - Factor determining how much circles move per step.
 */
function packStep(circles, acceleration) {
    const nCircles = circles.length;
    if (nCircles < 2 || !circles[1]) return;
    const innerContainerRadius = circles[1].r;
    for (let i = 2; i < nCircles; i++) {
        const circle_i = circles[i];
        if (!circle_i || circle_i.r <= 0) continue;
        const distSqFromCenter = distanceSq(circle_i.x, circle_i.y, 0, 0);
        const boundaryDist = innerContainerRadius - circle_i.r;
        if (boundaryDist >= 0 && distSqFromCenter > boundaryDist * boundaryDist) {
            const distFromCenter = Math.sqrt(distSqFromCenter);
            if (distFromCenter > 1e-9) { const overlap = distFromCenter - boundaryDist; const pushFactor = overlap / distFromCenter; circle_i.x -= circle_i.x * pushFactor; circle_i.y -= circle_i.y * pushFactor; }
        } else if (boundaryDist < 0) {
             const distFromCenter = Math.sqrt(distSqFromCenter);
             if (distFromCenter > 1e-9) { const overlap = distFromCenter + circle_i.r - innerContainerRadius; const pushFactor = overlap / distFromCenter * 1.1; circle_i.x -= circle_i.x * pushFactor; circle_i.y -= circle_i.y * pushFactor; }
        }
        for (let j = i + 1; j < nCircles; j++) {
            const circle_j = circles[j];
            if (!circle_j || circle_j.r <= 0) continue;
            if (fastCheckCollision(circle_i.x, circle_i.y, circle_i.r, circle_j.x, circle_j.y, circle_j.r)) {
                const dist = distance(circle_i.x, circle_i.y, circle_j.x, circle_j.y);
                const totalRadius = circle_i.r + circle_j.r;
                if (dist < totalRadius - 1e-9 && dist > 1e-9) {
                    const overlap = totalRadius - dist; const dx = circle_j.x - circle_i.x; const dy = circle_j.y - circle_i.y;
                    const mass_i = Math.pow(circle_i.r, WEIGHT_FACTOR); const mass_j = Math.pow(circle_j.r, WEIGHT_FACTOR); const totalMass = mass_i + mass_j;
                    const ratio_i = (totalMass > 0) ? mass_j / totalMass : 0.5; const ratio_j = (totalMass > 0) ? mass_i / totalMass : 0.5;
                    const moveFactor = overlap / dist * acceleration;
                    circle_i.x -= dx * moveFactor * ratio_i; circle_i.y -= dy * moveFactor * ratio_i;
                    circle_j.x += dx * moveFactor * ratio_j; circle_j.y += dy * moveFactor * ratio_j;
                } else if (dist <= 1e-9) {
                    const angle = Math.random() * 2 * PI; const pushDist = (circle_i.r || 0.1) * 0.1;
                    circle_i.x -= Math.cos(angle) * pushDist; circle_i.y -= Math.sin(angle) * pushDist;
                    circle_j.x += Math.cos(angle) * pushDist; circle_j.y += Math.sin(angle) * pushDist;
                }
            }
        }
    }
}

/**
 * Runs the main packing simulation loop.
 * @param {Array<Object>} circles - Initial array of circle objects.
 * @returns {Object} { finalCircles: Array<Object>, containerRadius: number }
 */
function runPackingSimulation(circles) {
    if (circles.length < 3 || !circles[0] || !circles[1]) { console.error("Initial circles array is invalid for simulation."); return { finalCircles: circles, containerRadius: 0 }; }
    let avgPenetration = 1.0; let lastAvgPenetration = 0.0; let iterations = 0; let currentAcceleration = ACCELERATION;
    while (avgPenetration > CONVERGENCE_THRESHOLD && iterations < MAX_ITERATIONS_RUNPACKING) {
        if (avgPenetration > CONVERGENCE_THRESHOLD * 5) { circles[1].r *= (1 + CONTAINER_ADJUST_FACTOR * Math.min(avgPenetration, 0.3)); }
        circles[0].r = circles[1].r * SNG_R2_TO_R1;
        let innerConverged = false;
        for (let i = 0; i < MAX_ITERATIONS_PACKSTEP; i++) {
            packStep(circles, currentAcceleration);
            lastAvgPenetration = avgPenetration; avgPenetration = calculateContactNorm(circles);
             if (avgPenetration < CONVERGENCE_THRESHOLD || Math.abs(avgPenetration - lastAvgPenetration) < CONVERGENCE_THRESHOLD / 50) { innerConverged = true; break; }
        }
        iterations++;
    }
    if (iterations >= MAX_ITERATIONS_RUNPACKING) { console.warn(`Simulation reached max iterations (${MAX_ITERATIONS_RUNPACKING}) without full convergence. Avg Penetration: ${avgPenetration}`); }
    return { finalCircles: circles, containerRadius: circles[1].r };
}

/**
 * Sets up and runs a single packing simulation for a given set of wire radii.
 * @param {Array<number>} wireRadii - Array of radii for the wires to be packed.
 * @returns {Object} Result from runPackingSimulation { finalCircles, containerRadius }
 */
function runSingleSimulation(wireRadii) {
    const nWires = wireRadii.length;
    if (nWires === 0) return { finalCircles: [], containerRadius: 0 };
    const nCircles = nWires + 2; const circles = new Array(nCircles);
    let totalArea = 0; let maxSingleRadius = 0;
    for (const r of wireRadii) { totalArea += PI * r * r; if (r > maxSingleRadius) maxSingleRadius = r; }
    const initialPackingRadius = Math.max(Math.sqrt(totalArea / PI) * 1.15, maxSingleRadius * 1.05);
    circles[0] = { x: 0, y: 0, r: initialPackingRadius * SNG_R2_TO_R1, isContainer: true };
    circles[1] = { x: 0, y: 0, r: initialPackingRadius, isInnerContainer: true };
    for (let i = 0; i < nWires; i++) {
        const radius = wireRadii[i];
        if (radius <= 0) { circles[i + 2] = { x: 0, y: 0, r: 0 }; continue; }
        const maxPlacementRadius = Math.max(0, initialPackingRadius - radius);
        const angle = fRand(0, 2 * PI); const rPos = Math.sqrt(fRand(0, 1)) * maxPlacementRadius;
        circles[i + 2] = { x: rPos * Math.cos(angle), y: rPos * Math.sin(angle), r: radius };
    }
    return runPackingSimulation(circles);
}


// --- Drawing ---
/**
 * Draws the circles from the simulation onto the canvas.
 * @param {Array<Object>} circlesData - The array of circle objects from simulation result.
 */
function drawCircles(circlesData) {
    if (!ctx || !canvas) return; // Ensure canvas context is available
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!circlesData || circlesData.length < 3 || !circlesData[0]) {
        ctx.fillStyle = '#6c757d'; ctx.textAlign = 'center'; ctx.font = '14px sans-serif';
        ctx.fillText('无模拟数据或导线数量为零', canvas.width / 2, canvas.height / 2); return;
    }
    const containerRadius = circlesData[0]?.r ?? 1;
    const scale = Math.min(canvas.width - 2 * CANVAS_PADDING, canvas.height - 2 * CANVAS_PADDING) / (2 * Math.max(containerRadius, 1));
    const offsetX = canvas.width / 2; const offsetY = canvas.height / 2;
    const innerContainer = circlesData[1];
    if (innerContainer) {
        ctx.beginPath(); ctx.arc(offsetX, offsetY, Math.max(0, innerContainer.r * scale), 0, 2 * PI);
        ctx.strokeStyle = '#adb5bd'; ctx.lineWidth = 1; ctx.setLineDash([4, 2]); ctx.stroke(); ctx.setLineDash([]);
    }
    for (let i = 2; i < circlesData.length; i++) {
        const circle = circlesData[i];
        if (!circle || circle.r <= 0) continue;
        ctx.beginPath(); const canvasX = offsetX + circle.x * scale; const canvasY = offsetY - circle.y * scale;
        const canvasR = Math.max(0.5, circle.r * scale); ctx.arc(canvasX, canvasY, canvasR, 0, 2 * PI);
        ctx.strokeStyle = '#343a40'; ctx.lineWidth = 1; ctx.stroke();
    }
}


// --- UI Interaction ---

/**
 * Updates the displayed row numbers in a container.
 * @param {HTMLElement} containerElement - The parent element containing the rows.
 * @param {string} rowSelector - CSS selector to find the row elements.
 */
function updateRowNumbers(containerElement, rowSelector) {
    const rows = containerElement.querySelectorAll(rowSelector);
    rows.forEach((row, index) => {
        const numberSpan = row.querySelector('.row-number');
        if (numberSpan) { numberSpan.textContent = `${index + 1}.`; }
    });
}

/**
 * Populates a select dropdown with standard wire gauges.
 * @param {HTMLSelectElement} selectElement - The dropdown element to populate.
 */
function populateGaugeDropdown(selectElement) {
    selectElement.innerHTML = '<option value="">选择线径</option>';
    STANDARD_GAUGES.forEach(gauge => {
        const option = document.createElement('option'); option.value = gauge; option.textContent = gauge + ' mm²'; selectElement.appendChild(option);
    });
}

/**
 * Creates a new HTML row element for standard wire input.
 * @param {string} gauge - Default gauge value.
 * @param {string} type - Default insulation type.
 * @param {number} count - Default quantity.
 * @returns {HTMLDivElement} The created row element.
 */
function createStandardWireInputRow(gauge = "0.35", type = "Thin", count = 0) {
    const row = document.createElement('div'); row.classList.add('standard-wire-input-row');
    row.innerHTML = `
        <span class="row-number"></span>
        <label>线径:<select class="wire-gauge-select"></select></label>
        <label>类型:<select class="wire-type-select"><option value="">选择类型</option>${WIRE_TYPES.map(t => `<option value="${t}">${t}</option>`).join('')}</select></label>
        <label>数量:<input type="number" class="wire-quantity-std" min="0" step="1" value="${count}" placeholder="数量"></label>
        <span title="根据线径和类型自动查找的直径 (mm)">OD:</span><span class="auto-od-display">-</span>
        <button class="remove-button" title="移除此规格"><span class="icon">🗑️</span></button>`;
    const gaugeSelect = row.querySelector('.wire-gauge-select'); const typeSelect = row.querySelector('.wire-type-select');
    populateGaugeDropdown(gaugeSelect); gaugeSelect.value = gauge; typeSelect.value = type;
    updateAutoOD(row); return row;
}

/**
 * Creates a new HTML row element for special wire input. (MODIFIED)
 * - Default quantity is 0.
 * - Input min quantity is 0.
 * @param {number} diameter - Default diameter.
 * @param {number} count - Default quantity.
 * @returns {HTMLDivElement} The created row element.
 */
function createSpecialWireInputRow(diameter = 1.0, count = 0) { // Default count is now 0
    const row = document.createElement('div');
    row.classList.add('special-wire-input-row');
    row.innerHTML = `
        <span class="row-number"></span>
        <label title="直接输入导线的外径 (mm)">直径 (OD):
            <input type="number" class="wire-diameter-sp" step="0.01" min="0.01" value="${diameter.toFixed(2)}" placeholder="例如 1.0">
        </label>
        <label title="该特殊导线的数量">数量:
            <input type="number" class="wire-quantity-sp" min="0" step="1" value="${count}" placeholder="数量"> <!-- min changed to 0 -->
        </label>
        <button class="remove-button" title="移除此规格"><span class="icon">🗑️</span></button>
    `;
    return row;
}

/**
 * Creates a new HTML row element for wrapping layer input.
 * @param {number} thickness - Default thickness.
 * @returns {HTMLDivElement} The created row element.
 */
function createWrappingInputRow(thickness = 0.5) {
     const row = document.createElement('div'); row.classList.add('wrapping-input-row');
     row.innerHTML = `
        <span class="row-number"></span>
        <label title="单层包裹物的厚度 (mm)">层厚度: <input type="number" class="wrapping-thickness" step="0.01" min="0" value="${thickness.toFixed(2)}" placeholder="例如 0.13"></label>
        <button class="remove-button" title="移除此包裹层"><span class="icon">🗑️</span></button>`;
     return row;
}

/**
 * Updates the OD display for a standard wire row based on selected gauge/type.
 * @param {HTMLElement} rowElement - The standard wire row element.
 */
function updateAutoOD(rowElement) {
    const gaugeSelect = rowElement.querySelector('.wire-gauge-select'); const typeSelect = rowElement.querySelector('.wire-type-select');
    const odDisplay = rowElement.querySelector('.auto-od-display');
    const selectedGauge = gaugeSelect.value; const selectedType = typeSelect.value;
    odDisplay.textContent = '-'; odDisplay.classList.remove('na'); odDisplay.title = '根据线径和类型自动查找的直径 (mm)';
    if (selectedGauge && selectedType) {
        const gaugeData = WIRE_OD_TABLE[selectedGauge];
        if (gaugeData) {
            const diameter = gaugeData[selectedType];
            if (diameter !== null && typeof diameter === 'number') { odDisplay.textContent = diameter.toFixed(2); }
            else { odDisplay.textContent = 'N/A'; odDisplay.classList.add('na'); odDisplay.title = '此组合无可用直径数据'; }
        } else { odDisplay.textContent = '错误'; odDisplay.classList.add('na'); console.error(`Gauge data not found for: ${selectedGauge}`); }
    }
    clearError();
}

// --- Add/Remove Row Functions (with Focus Logic) ---
function addStandardWireType() {
    const newRow = createStandardWireInputRow("0.35", "Thin", 1);
    standardWireInputsContainer.appendChild(newRow);
    updateRowNumbers(standardWireInputsContainer, '.standard-wire-input-row');
    updateTotalWireCount();
    // Scroll and Focus
    newRow.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    const quantityInput = newRow.querySelector('.wire-quantity-std');
    if (quantityInput) { setTimeout(() => { quantityInput.focus(); quantityInput.select(); }, 100); }
    clearError();
}
function addSpecialWireType() {
    const newRow = createSpecialWireInputRow(1.0, 1); // Add with quantity 1 by default when *button* is clicked
    specialWireInputsContainer.appendChild(newRow);
    updateRowNumbers(specialWireInputsContainer, '.special-wire-input-row');
    updateTotalWireCount();
    // Scroll and Focus
    newRow.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    const diameterInput = newRow.querySelector('.wire-diameter-sp');
    if (diameterInput) { setTimeout(() => { diameterInput.focus(); diameterInput.select(); }, 100); }
    clearError();
}
function addWrappingLayer() {
     const newRow = createWrappingInputRow(0.5);
     wrappingInputsContainer.appendChild(newRow);
     updateRowNumbers(wrappingInputsContainer, '.wrapping-input-row');
     updateTotalWrappingThickness();
     // Scroll and Focus
     newRow.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
     const thicknessInput = newRow.querySelector('.wrapping-thickness');
     if (thicknessInput) { setTimeout(() => { thicknessInput.focus(); thicknessInput.select(); }, 100); }
     clearError();
}
function removeRow(button) {
    const row = button.closest('.standard-wire-input-row, .special-wire-input-row, .wrapping-input-row'); if (!row) return;
    const container = row.parentElement; const isStandard = row.classList.contains('standard-wire-input-row');
    const isSpecial = row.classList.contains('special-wire-input-row'); const isWrapping = row.classList.contains('wrapping-input-row');
    row.remove();
    if (isStandard) { updateRowNumbers(container, '.standard-wire-input-row'); updateTotalWireCount(); }
    else if (isSpecial) { updateRowNumbers(container, '.special-wire-input-row'); updateTotalWireCount(); }
    else if (isWrapping) { updateRowNumbers(container, '.wrapping-input-row'); updateTotalWrappingThickness(); }
    clearError();
}

// --- Slider Update ---
function updateSliderValue(value) { sliderValueSpan.textContent = value; }

// --- Input Validation ---
/**
 * Validates a single input element and adds/removes error class. (MODIFIED)
 * - Allows 0 for special wire quantity.
 * @param {HTMLInputElement | HTMLSelectElement} inputElement - The input/select element.
 * @returns {boolean} True if valid, false otherwise.
 */
function validateInput(inputElement) {
    const value = inputElement.value;
    let isValid = false;

    if (inputElement.tagName === 'SELECT') {
        isValid = value !== "";
    } else if (inputElement.type === 'number') {
        const numValue = parseFloat(value);
        const min = parseFloat(inputElement.min);
        const step = parseFloat(inputElement.step);

        if (isNaN(numValue)) {
            isValid = false;
        } else {
            isValid = isNaN(min) || numValue >= min; // Check against min (e.g., 0 or 0.01)
            if (isValid && step === 1) { // Check integer only if step requires it
                 isValid = Number.isInteger(numValue);
            }
        }

        // Specific checks (ensure consistency with min attribute)
        if (isValid) {
            if (inputElement.classList.contains('wire-quantity-std') && numValue < 0) isValid = false;
            // *** MODIFIED: Allow 0 for special wire quantity ***
            if (inputElement.classList.contains('wire-quantity-sp') && numValue < 0) isValid = false;
            if (inputElement.classList.contains('wire-diameter-sp') && numValue <= 0) isValid = false; // Diameter still > 0
            if (inputElement.classList.contains('wrapping-thickness') && numValue < 0) isValid = false;
        }
    }

    if (isValid) {
        inputElement.classList.remove('input-error');
    } else {
        inputElement.classList.add('input-error');
    }
    return isValid;
}

/**
 * Collects all wire inputs, validates them, and returns radii array or error state. (MODIFIED)
 * - Handles quantity 0 for special wires correctly during validation.
 * @returns {Object} { wiresValid: boolean, wireRadii?: Array<number>, totalWires?: number }
 */
function collectAndValidateInputs() {
    const wireRadii = [];
    let totalWires = 0;
    let wiresValid = true;
    let hasAnyInputRow = false;

    document.querySelectorAll('.input-section input.input-error, .input-section select.input-error').forEach(el => el.classList.remove('input-error'));
    document.querySelectorAll('.auto-od-display.na').forEach(el => el.classList.remove('na'));
    inputErrorDiv.style.display = 'none';

    // --- Standard Wires ---
    const standardRows = standardWireInputsContainer.querySelectorAll('.standard-wire-input-row');
    if (standardRows.length > 0) hasAnyInputRow = true;
    standardRows.forEach(row => {
        const gaugeSelect = row.querySelector('.wire-gauge-select'); const typeSelect = row.querySelector('.wire-type-select');
        const quantityInput = row.querySelector('.wire-quantity-std'); const odDisplay = row.querySelector('.auto-od-display');
        const gauge = gaugeSelect.value; const type = typeSelect.value; const quantity = parseInt(quantityInput.value, 10);
        const isGaugeValid = validateInput(gaugeSelect); const isTypeValid = validateInput(typeSelect); const isQuantityValid = validateInput(quantityInput);
        if (isQuantityValid && quantity === 0) { updateAutoOD(row); }
        else if (isQuantityValid && quantity > 0) {
            if (!isGaugeValid || !isTypeValid) { wiresValid = false; }
            else {
                updateAutoOD(row);
                if (odDisplay.classList.contains('na')) { wiresValid = false; gaugeSelect.classList.add('input-error'); typeSelect.classList.add('input-error'); }
                else {
                    const diameter = parseFloat(odDisplay.textContent);
                    if (!isNaN(diameter) && diameter > 0) { const radius = diameter / 2; for (let i = 0; i < quantity; i++) { wireRadii.push(radius); } totalWires += quantity; }
                    else { console.error("Error parsing valid OD display:", odDisplay.textContent); wiresValid = false; }
                }
            }
        } else { wiresValid = false; }
    });

    // --- Special Wires ---
    const specialRows = specialWireInputsContainer.querySelectorAll('.special-wire-input-row');
     if (specialRows.length > 0) hasAnyInputRow = true;
    specialRows.forEach(row => {
        const diameterInput = row.querySelector('.wire-diameter-sp');
        const quantityInput = row.querySelector('.wire-quantity-sp');
        const isDiameterValid = validateInput(diameterInput);
        const isQuantityValid = validateInput(quantityInput); // Now checks >= 0 and integer
        if (isQuantityValid) {
            const quantity = parseInt(quantityInput.value, 10);
            if (quantity > 0) {
                if (isDiameterValid) {
                    const diameter = parseFloat(diameterInput.value); const radius = diameter / 2;
                    for (let i = 0; i < quantity; i++) { wireRadii.push(radius); } totalWires += quantity;
                } else { wiresValid = false; } // Diameter invalid when qty > 0
            } // else quantity is 0, diameter validity doesn't matter for overall result
        } else { wiresValid = false; } // Quantity itself invalid
    });

    // --- Final checks ---
    if (!hasAnyInputRow && standardRows.length === 0 && specialRows.length === 0) {
        showError('请至少添加一种导线规格。');
        wiresValid = false;
    } else if (!wiresValid) {
         showError('部分导线输入无效或组合不可用 (见红色边框)。请修正。');
    } else if (wireRadii.length === 0) {
         // This happens if all valid rows have quantity 0
         showError('请输入至少一个数量大于 0 的有效导线规格以进行计算。');
         wiresValid = false; // Treat as invalid for calculation if *all* quantities are 0
    }

    totalWiresSpan.textContent = totalWires > 0 ? totalWires : '0';

    return wiresValid ? { wiresValid: true, wireRadii, totalWires } : { wiresValid: false };
}


/**
 * Collects and validates wrapping inputs.
 * @returns {Object} { wrappingsValid: boolean, totalThickness?: number }
 */
function collectAndValidateWrappings() {
    let totalThickness = 0; let wrappingsValid = true;
    document.querySelectorAll('#wrapping-inputs input.input-error').forEach(el => el.classList.remove('input-error'));
    const wrappingRows = wrappingInputsContainer.querySelectorAll('.wrapping-input-row');
    wrappingRows.forEach(row => {
        const thicknessInput = row.querySelector('.wrapping-thickness'); const isThicknessValid = validateInput(thicknessInput);
        if (isThicknessValid) { totalThickness += parseFloat(thicknessInput.value); } else { wrappingsValid = false; }
    });
    if (!wrappingsValid) { showError('部分包裹层厚度输入无效 (见红色边框)。请修正。'); }
    totalWrappingThicknessSpan.textContent = totalThickness.toFixed(3);
    return { wrappingsValid, totalThickness };
}

// --- Update Totals Display ---
function updateTotalWireCount() {
    let total = 0;
    standardWireInputsContainer.querySelectorAll('.wire-quantity-std').forEach(input => { const count = parseInt(input.value, 10); if (!isNaN(count) && count > 0 && Number.isInteger(count)) total += count; });
    specialWireInputsContainer.querySelectorAll('.wire-quantity-sp').forEach(input => { const count = parseInt(input.value, 10); if (!isNaN(count) && count > 0 && Number.isInteger(count)) total += count; }); // Checks > 0
    totalWiresSpan.textContent = total > 0 ? total : '0';
}
function updateTotalWrappingThickness() {
    let total = 0;
    wrappingInputsContainer.querySelectorAll('.wrapping-thickness').forEach(input => { const thickness = parseFloat(input.value); if (!isNaN(thickness) && thickness >= 0) total += thickness; });
    totalWrappingThicknessSpan.textContent = total.toFixed(3);
}

// --- Error Handling ---
function showError(message) { inputErrorDiv.textContent = message; inputErrorDiv.style.display = 'block'; }
function clearError() {
    const hasInputError = document.querySelector('.input-section input.input-error, .input-section select.input-error');
    const hasNaError = Array.from(document.querySelectorAll('.standard-wire-input-row')).some(row => {
        const odDisplay = row.querySelector('.auto-od-display'); const quantityInput = row.querySelector('.wire-quantity-std');
        const quantity = parseInt(quantityInput?.value || '0', 10); return odDisplay.classList.contains('na') && !isNaN(quantity) && quantity > 0;
    });
    if (!hasInputError && !hasNaError) { inputErrorDiv.style.display = 'none'; }
}

// --- Render Simulation History Chart ---
/**
 * Renders or updates the simulation history line chart.
 * @param {Array<number>} diameters - Array of diameters from each simulation run (excluding wrapping).
 */
function renderSimulationHistoryChart(diameters) {
    if (!simulationChartContainer || !toggleChartButton) { console.error("Chart container or toggle button not found."); return; }
    const chartCanvas = document.getElementById('simulation-history-chart');
    if (!chartCanvas) { console.error("Chart canvas element not found."); return; }
    const chartCtx = chartCanvas.getContext('2d');

    if (simulationHistoryChartInstance) { simulationHistoryChartInstance.destroy(); simulationHistoryChartInstance = null; }

    if (!diameters || diameters.length === 0) {
        simulationChartContainer.classList.add('hidden');
        toggleChartButton.style.display = 'none';
        chartCtx.clearRect(0, 0, chartCanvas.width, chartCanvas.height);
        chartCtx.fillStyle = '#aaa'; chartCtx.textAlign = 'center'; chartCtx.font = '12px sans-serif';
        chartCtx.fillText("无模拟历史数据", chartCanvas.width / 2, chartCanvas.height / 2);
        return;
    }

    toggleChartButton.style.display = 'inline-flex'; // Show button if data exists
    const labels = diameters.map((_, index) => `模拟 ${index + 1}`);

    simulationHistoryChartInstance = new Chart(chartCtx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: '模拟直径 (mm)', data: diameters, borderColor: 'rgb(75, 192, 192)', backgroundColor: 'rgba(75, 192, 192, 0.2)',
                borderWidth: 1.5, tension: 0.1, pointBackgroundColor: 'rgb(75, 192, 192)', pointRadius: 3, pointHoverRadius: 5, fill: false
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            scales: { y: { beginAtZero: false, title: { display: true, text: '线束直径 (mm)' } }, x: { title: { display: true, text: '模拟次数' } } },
            plugins: {
                tooltip: { mode: 'index', intersect: false, callbacks: { title: (tooltipItems) => tooltipItems[0].label, label: (context) => { let label = context.dataset.label || ''; if (label) label += ': '; if (context.parsed.y !== null) label += context.parsed.y.toFixed(3) + ' mm'; return label; } } },
                legend: { display: false }
            },
            interaction: { mode: 'nearest', axis: 'x', intersect: false }
        }
    });
}


// --- Reset Form (MODIFIED) ---
/**
 * Resets the form to its default state.
 * - Adds default standard wires (qty 0).
 * - Adds one default special wire (dia 1.0, qty 0).
 * - Adds one default wrapping layer.
 */
function resetForm() {
    // Clear existing rows
    standardWireInputsContainer.innerHTML = ''; specialWireInputsContainer.innerHTML = ''; wrappingInputsContainer.innerHTML = '';

    // Add new default rows
    standardWireInputsContainer.appendChild(createStandardWireInputRow("0.35", "Thin", 0));
    standardWireInputsContainer.appendChild(createStandardWireInputRow("0.5", "Thin", 0));
    standardWireInputsContainer.appendChild(createStandardWireInputRow("0.75", "Thin", 0));
    // *** ADDED: Default special wire ***
    specialWireInputsContainer.appendChild(createSpecialWireInputRow(1.0, 0));
    wrappingInputsContainer.appendChild(createWrappingInputRow(0.5));

    // Update numbers
    updateRowNumbers(standardWireInputsContainer, '.standard-wire-input-row');
    updateRowNumbers(specialWireInputsContainer, '.special-wire-input-row');
    updateRowNumbers(wrappingInputsContainer, '.wrapping-input-row');

    // Reset slider, results, canvas, errors, totals, chart
    slider.value = 10; updateSliderValue(10);
    minOdSpan.textContent = '-'; maxOdSpan.textContent = '-'; avgOdSpan.textContent = '-';
    if(ctx && canvas) ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawCircles(null);
    lastSimulationCircles = null;

    // Chart Reset Logic
    if (simulationHistoryChartInstance) { simulationHistoryChartInstance.destroy(); simulationHistoryChartInstance = null; }
    if (simulationChartContainer) { simulationChartContainer.classList.add('hidden'); }
    if (toggleChartButton) { toggleChartButton.style.display = 'none'; }
    const chartCanvas = document.getElementById('simulation-history-chart');
    if (chartCanvas) { const chartCtx = chartCanvas.getContext('2d'); chartCtx.clearRect(0, 0, chartCanvas.width, chartCanvas.height); }

    // Clear errors and update totals
    document.querySelectorAll('.input-section input.input-error, .input-section select.input-error').forEach(el => el.classList.remove('input-error'));
    document.querySelectorAll('.auto-od-display.na').forEach(el => el.classList.remove('na'));
    inputErrorDiv.style.display = 'none';
    updateTotalWireCount(); updateTotalWrappingThickness();
    console.log("Form reset to defaults (including special wire qty 0).");
}


// --- Main Calculation Function (MODIFIED) ---
// Adjusted the initial check for wireRadii.length.
function startCalculation() {
    const wireValidation = collectAndValidateInputs();
    // *** MODIFIED: Check specifically for wiresValid flag ***
    if (!wireValidation.wiresValid) {
        // Error message shown by collectAndValidateInputs
        return;
    }
    const { wireRadii } = wireValidation; // We know wireRadii exists and is not empty if wiresValid is true

    const wrappingValidation = collectAndValidateWrappings();
    if (!wrappingValidation.wrappingsValid) return;
    const { totalThickness: totalWrappingThickness } = wrappingValidation;

    // UI updates for calculation start
    calculateButton.disabled = true; calculateButtonText.style.display = 'none'; loadingIndicator.style.display = 'inline-block';
    clearError(); minOdSpan.textContent = '计算中...'; maxOdSpan.textContent = '计算中...'; avgOdSpan.textContent = '计算中...';
    if(ctx && canvas) ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawCircles(null); lastSimulationCircles = null;
    renderSimulationHistoryChart(null); // Clear previous chart

    const numSimulations = parseInt(slider.value, 10);

    // Run simulations async
    setTimeout(() => {
        const simulationResultsDiameter = []; // Holds diameters *before* wrapping
        let lastRunData = null; let simulationError = null;
        try {
            console.log(`Starting ${numSimulations} simulations with ${wireRadii.length} wires...`); const startTime = performance.now();
            for (let i = 0; i < numSimulations; i++) {
                const result = runSingleSimulation([...wireRadii]);
                if (result && typeof result.containerRadius === 'number' && result.containerRadius > 1e-9) {
                    simulationResultsDiameter.push(result.containerRadius * 2);
                    if (i === numSimulations - 1) { lastRunData = result.finalCircles; }
                } else { console.warn(`Simulation ${i+1} returned invalid or zero radius result:`, result); }
            }
            const endTime = performance.now(); console.log(`Simulations finished in ${(endTime - startTime).toFixed(2)} ms.`);

            // Process results
            if (simulationResultsDiameter.length > 0) {
                const minSimOD = Math.min(...simulationResultsDiameter); const maxSimOD = Math.max(...simulationResultsDiameter);
                const sumSimOD = simulationResultsDiameter.reduce((a, b) => a + b, 0); const avgSimOD = sumSimOD / simulationResultsDiameter.length;
                const addedDiameter = 2 * totalWrappingThickness;
                const finalMinOD = minSimOD + addedDiameter; const finalMaxOD = maxSimOD + addedDiameter; const finalAvgOD = avgSimOD + addedDiameter;

                minOdSpan.textContent = finalMinOD.toFixed(3); maxOdSpan.textContent = finalMaxOD.toFixed(3); avgOdSpan.textContent = finalAvgOD.toFixed(3);
                totalWrappingThicknessSpan.textContent = totalWrappingThickness.toFixed(3);
                lastSimulationCircles = lastRunData;
                drawCircles(lastSimulationCircles);
                renderSimulationHistoryChart(simulationResultsDiameter); // Render chart

            } else { // All simulations failed
                minOdSpan.textContent = '无有效结果'; maxOdSpan.textContent = '无有效结果'; avgOdSpan.textContent = '无有效结果';
                totalWrappingThicknessSpan.textContent = totalWrappingThickness.toFixed(3);
                showError('所有模拟运行均未产生有效线束结果。');
                drawCircles(null);
                renderSimulationHistoryChart(null);
            }
        } catch (error) { // Catch runtime errors during simulation
            console.error("Simulation error:", error); simulationError = error;
            drawCircles(null);
            renderSimulationHistoryChart(null);
        } finally { // Update UI after calculation finishes or fails
            calculateButton.disabled = false; calculateButtonText.style.display = 'inline'; loadingIndicator.style.display = 'none';
            if (simulationError) { showError(`计算出错: ${simulationError.message}`); minOdSpan.textContent = '错误'; maxOdSpan.textContent = '错误'; avgOdSpan.textContent = '错误'; }
        }
    }, 50); // Delay for UI update
}


// --- Initial Setup (DOMContentLoaded) ---
document.addEventListener('DOMContentLoaded', () => {
    // Get DOM references
    standardWireInputsContainer = document.getElementById('standard-wire-inputs');
    specialWireInputsContainer = document.getElementById('special-wire-inputs');
    wrappingInputsContainer = document.getElementById('wrapping-inputs');
    calculateButton = document.getElementById('calculate-button');
    calculateButtonText = document.getElementById('calculate-button-text');
    loadingIndicator = document.getElementById('loading-indicator');
    resetButton = document.getElementById('reset-button');
    resultsDiv = document.getElementById('results');
    minOdSpan = document.getElementById('min-od');
    maxOdSpan = document.getElementById('max-od');
    avgOdSpan = document.getElementById('avg-od');
    totalWiresSpan = document.getElementById('total-wires');
    totalWrappingThicknessSpan = document.getElementById('total-wrapping-thickness');
    slider = document.getElementById('num-simulations-slider');
    sliderValueSpan = document.getElementById('num-simulations-value');
    inputErrorDiv = document.getElementById('input-error');
    canvas = document.getElementById('packing-canvas');
    ctx = canvas ? canvas.getContext('2d') : null; // Check if canvas exists
    simulationChartContainer = document.getElementById('simulation-chart-container');
    toggleChartButton = document.getElementById('toggle-chart-button');

    // Attach Event Listeners
    document.getElementById('add-standard-wire-button').addEventListener('click', addStandardWireType);
    document.getElementById('add-special-wire-button').addEventListener('click', addSpecialWireType);
    document.getElementById('add-wrapping-layer-button').addEventListener('click', addWrappingLayer);
    calculateButton.addEventListener('click', startCalculation);
    resetButton.addEventListener('click', resetForm);
    slider.addEventListener('input', (event) => updateSliderValue(event.target.value));

    // Chart Toggle Button Listener
    if (toggleChartButton && simulationChartContainer) {
        toggleChartButton.addEventListener('click', () => {
            simulationChartContainer.classList.toggle('hidden');
        });
    } else {
        console.warn("Chart toggle button or container not found during initialization.");
    }

    // Event Delegation for Dynamic Rows
    standardWireInputsContainer.addEventListener('click', (event) => { if (event.target.closest('.remove-button')) removeRow(event.target.closest('.remove-button')); });
    standardWireInputsContainer.addEventListener('change', (event) => { if (event.target.classList.contains('wire-gauge-select') || event.target.classList.contains('wire-type-select')) { updateAutoOD(event.target.closest('.standard-wire-input-row')); validateInput(event.target); clearError(); } });
    standardWireInputsContainer.addEventListener('input', (event) => { if (event.target.classList.contains('wire-quantity-std')) { validateInput(event.target); updateTotalWireCount(); clearError(); } });
    specialWireInputsContainer.addEventListener('click', (event) => { if (event.target.closest('.remove-button')) removeRow(event.target.closest('.remove-button')); });
    specialWireInputsContainer.addEventListener('input', (event) => { if (event.target.classList.contains('wire-diameter-sp') || event.target.classList.contains('wire-quantity-sp')) { validateInput(event.target); if(event.target.classList.contains('wire-quantity-sp')) updateTotalWireCount(); clearError(); } });
    wrappingInputsContainer.addEventListener('click', (event) => { if (event.target.closest('.remove-button')) removeRow(event.target.closest('.remove-button')); });
    wrappingInputsContainer.addEventListener('input', (event) => { if (event.target.classList.contains('wrapping-thickness')) { validateInput(event.target); updateTotalWrappingThickness(); clearError(); } });

    // Initialize UI
    resetForm(); // resetForm now sets up the default special wire row

    console.log("Wire harness calculator initialized.");
});

/*
Potential Optimization Note (Reminder):
For significantly larger numbers of wires (>500-1000), consider Web Workers or algorithm optimization.
*/