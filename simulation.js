// --- Constants ---
const PI = Math.PI;
const SNG_R2_TO_R1 = 1.01; // Ratio outer container to inner dynamic container
const ACCELERATION = 1.7; // Repulsion acceleration factor (from VBA acc = 1.7 initially)
const WEIGHT_FACTOR = 2; // Power for radius weighting in repulsion (r^2 means area weighting)
const CONVERGENCE_THRESHOLD = 0.001; // Stop simulation if avg penetration is below this
const MAX_ITERATIONS_RUNPACKING = 500; // Safety break for main loop
const MAX_ITERATIONS_PACKSTEP = 15; // Iterations within each main loop step
const CONTAINER_ADJUST_FACTOR = 0.05; // How much container radius adjusts based on penetration (VBA was 0.06)
const CANVAS_PADDING = 10; // Pixels padding inside canvas boundary

// --- Global Variables ---
let lastSimulationCircles = null; // Store data for drawing

// --- Utility Functions ---
function distanceSq(x1, y1, x2, y2) {
    const dx = x1 - x2;
    const dy = y1 - y2;
    return dx * dx + dy * dy;
}

function distance(x1, y1, x2, y2) {
    return Math.sqrt(distanceSq(x1, y1, x2, y2));
}

// Faster check using squared distances
function fastCheckCollision(x1, y1, r1, x2, y2, r2) {
    const totalRadius = r1 + r2;
    // Broad phase check (Manhattan distance approximation) - Optional but can speed up
    if (Math.abs(x1 - x2) > totalRadius || Math.abs(y1 - y2) > totalRadius) {
        return false;
    }
    // Narrow phase check (accurate)
    return distanceSq(x1, y1, x2, y2) < totalRadius * totalRadius;
}

function fRand(min, max) {
    return Math.random() * (max - min) + min;
}

// --- Core Simulation Logic ---

/**
 * Calculates average normalized penetration distance.
 * Also updates penetration ('d') and contact number ('n') for each circle.
 * @param {Array} circles - Array of circle objects. circles[0] is outer, circles[1] is inner container.
 * @returns {number} Average normalized penetration.
 */
function calculateContactNorm(circles) {
    const nCircles = circles.length;
    const innerContainerRadius = circles[1].r;
    let totalPenetration = 0;
    let activeCircles = 0; // Count circles actually involved in calculation

    // Reset contact info
    for (let i = 1; i < nCircles; i++) { // Start from 1 (inner container)
        circles[i].n = 0;
        circles[i].d = 0;
    }

    for (let i = 2; i < nCircles; i++) { // Iterate through small circles
        const circle_i = circles[i];
        if (circle_i.r <= 0) continue; // Skip zero-radius circles if any

        activeCircles++;
        let penetration_i = 0;

        // 1. Check against inner container boundary
        const distSqFromCenter = distanceSq(circle_i.x, circle_i.y, 0, 0);
        const boundaryDist = innerContainerRadius - circle_i.r;

        if (distSqFromCenter > boundaryDist * boundaryDist && boundaryDist > 0) {
            const distFromCenter = Math.sqrt(distSqFromCenter);
            const penetration = Math.abs(distFromCenter + circle_i.r - innerContainerRadius);
             if (penetration > 1e-9) { // Avoid floating point noise
                circles[1].n++; // Increment container contact count
                circle_i.n++;
                circles[1].d += penetration;
                penetration_i += penetration;
            }
        }

        // 2. Check against other small circles (j > i)
        for (let j = i + 1; j < nCircles; j++) {
            const circle_j = circles[j];
             if (circle_j.r <= 0) continue;

            if (fastCheckCollision(circle_i.x, circle_i.y, circle_i.r, circle_j.x, circle_j.y, circle_j.r)) {
                const dist = distance(circle_i.x, circle_i.y, circle_j.x, circle_j.y);
                const totalRadius = circle_i.r + circle_j.r;
                if (dist < totalRadius - 1e-9) { // Check for actual overlap beyond tolerance
                    const penetration = Math.abs(totalRadius - dist);
                     if (penetration > 1e-9) {
                        circle_i.n++;
                        circle_j.n++;
                        penetration_i += penetration;
                        circles[j].d += penetration; // Add penetration to circle j as well
                    }
                }
            }
        }
        // Normalize penetration for circle i and add to total
        if (circle_i.r > 0) {
             circles[i].d = penetration_i; // Store total raw penetration for this circle
             totalPenetration += penetration_i / (2 * circle_i.r); // Normalize by diameter
        }
    }

    return activeCircles > 0 ? totalPenetration / activeCircles : 0;
}

/**
 * Performs one step of pushing overlapping circles apart.
 * @param {Array} circles - Array of circle objects.
 * @param {number} acceleration - Factor to multiply displacement.
 */
function packStep(circles, acceleration) {
    const nCircles = circles.length;
    const innerContainerRadius = circles[1].r;

    for (let i = 2; i < nCircles; i++) { // Iterate through small circles
        const circle_i = circles[i];
         if (circle_i.r <= 0) continue;

        // 1. Boundary check and push back from inner container
        const distSqFromCenter = distanceSq(circle_i.x, circle_i.y, 0, 0);
        const boundaryDist = innerContainerRadius - circle_i.r;
        if (boundaryDist > 0 && distSqFromCenter > boundaryDist * boundaryDist) {
            const distFromCenter = Math.sqrt(distSqFromCenter);
             if (distFromCenter > 1e-9) { // Avoid division by zero if circle is exactly at center
                const overlap = distFromCenter - boundaryDist;
                 const pushFactor = overlap / distFromCenter; // Normalize direction vector
                circle_i.x -= circle_i.x * pushFactor;
                circle_i.y -= circle_i.y * pushFactor;
            }
        } else if (boundaryDist <= 0 && distSqFromCenter > 0) {
             // Handle case where circle is bigger than container - push towards center strongly
             const distFromCenter = Math.sqrt(distSqFromCenter);
             const pushFactor = 1.1; // Push it strongly back
              circle_i.x -= circle_i.x * pushFactor / distFromCenter * Math.abs(boundaryDist);
              circle_i.y -= circle_i.y * pushFactor / distFromCenter * Math.abs(boundaryDist);
        }


        // 2. Check collisions and push apart from other small circles
        for (let j = i + 1; j < nCircles; j++) {
            const circle_j = circles[j];
            if (circle_j.r <= 0) continue;

            if (fastCheckCollision(circle_i.x, circle_i.y, circle_i.r, circle_j.x, circle_j.y, circle_j.r)) {
                const dist = distance(circle_i.x, circle_i.y, circle_j.x, circle_j.y);
                const totalRadius = circle_i.r + circle_j.r;

                if (dist < totalRadius - 1e-9 && dist > 1e-9) { // Overlap exists and circles are not at same spot
                    const overlap = totalRadius - dist;
                    const dx = circle_j.x - circle_i.x;
                    const dy = circle_j.y - circle_i.y;

                    // Calculate mass ratio based on r^WEIGHT_FACTOR (area if WEIGHT_FACTOR=2)
                    const mass_i = Math.pow(circle_i.r, WEIGHT_FACTOR);
                    const mass_j = Math.pow(circle_j.r, WEIGHT_FACTOR);
                    const totalMass = mass_i + mass_j;
                    const ratio_i = (totalMass > 0) ? mass_j / totalMass : 0.5; // i moves proportionally to j's mass
                    const ratio_j = (totalMass > 0) ? mass_i / totalMass : 0.5; // j moves proportionally to i's mass

                    const moveFactor = overlap / dist * acceleration;

                    circle_i.x -= dx * moveFactor * ratio_i;
                    circle_i.y -= dy * moveFactor * ratio_i;
                    circle_j.x += dx * moveFactor * ratio_j;
                    circle_j.y += dy * moveFactor * ratio_j;

                } else if (dist <= 1e-9) {
                     // Circles are exactly on top of each other, push randomly
                     const angle = Math.random() * 2 * PI;
                     const pushDist = circle_i.r * 0.1; // Small push
                     circle_i.x -= Math.cos(angle) * pushDist;
                     circle_i.y -= Math.sin(angle) * pushDist;
                     circle_j.x += Math.cos(angle) * pushDist;
                     circle_j.y += Math.sin(angle) * pushDist;
                }
            }
        }
    }
}


/**
 * Runs the main packing simulation loop.
 * @param {Array} circles - Array of circle objects, pre-initialized with random positions.
 */
function runPackingSimulation(circles) {
    let avgPenetration = 1.0;
    let lastAvgPenetration = 0.0;
    let iterations = 0;
    let currentAcceleration = ACCELERATION;

    while (avgPenetration > CONVERGENCE_THRESHOLD && iterations < MAX_ITERATIONS_RUNPACKING) {
        // Adjust container radius slightly based on current penetration
        // Only grow if there's significant penetration, maybe shrink slightly if very low?
        if (avgPenetration > CONVERGENCE_THRESHOLD * 10) { // Avoid growing unnecessarily
             circles[1].r *= (1 + CONTAINER_ADJUST_FACTOR * Math.min(avgPenetration, 0.5)); // Cap growth rate
        } else if (avgPenetration < CONVERGENCE_THRESHOLD * 0.1 && iterations > 50) {
            // Optional: Slight shrinking if very stable and low penetration
             // circles[1].r *= 0.999;
        }
        circles[0].r = circles[1].r * SNG_R2_TO_R1; // Update outer container

        // Inner relaxation loop
        for (let i = 0; i < MAX_ITERATIONS_PACKSTEP; i++) {
            packStep(circles, currentAcceleration);
            lastAvgPenetration = avgPenetration;
            avgPenetration = calculateContactNorm(circles);

             // Check for inner loop convergence or stagnation
            if (avgPenetration < CONVERGENCE_THRESHOLD || Math.abs(avgPenetration - lastAvgPenetration) < CONVERGENCE_THRESHOLD / 10) {
                 break;
             }
        }

         // Optional: Reduce acceleration over time to help settle
         // currentAcceleration = Math.max(1.1, currentAcceleration * 0.99);

        iterations++;
         // console.log(`Iteration ${iterations}: Avg Penetration: ${avgPenetration.toFixed(6)}, Container Radius: ${circles[1].r.toFixed(3)}`);
    }
     if (iterations >= MAX_ITERATIONS_RUNPACKING) {
        console.warn("Simulation reached max iterations without full convergence.");
     }
    // Return the final state (mainly for drawing) and the container radius
    return { finalCircles: circles, containerRadius: circles[1].r };
}

/**
 * Initializes and runs a single full circle packing simulation.
 * @param {Array} wireRadii - List of radii for all individual wires.
 * @returns {object} { finalCircles: Array, containerRadius: number }
 */
function runSingleSimulation(wireRadii) {
    const nWires = wireRadii.length;
    if (nWires === 0) return { finalCircles: [], containerRadius: 0 };

    const nCircles = nWires + 2; // +2 for the container circles
    const circles = new Array(nCircles);

    // Calculate initial packing radius estimate (based on total area)
    let totalArea = 0;
    for (const r of wireRadii) {
        totalArea += PI * r * r;
    }
    const initialPackingRadius = Math.sqrt(totalArea / PI) * 1.1; // Add some buffer

    // Create circle objects
    // circles[0]: Outer fixed container (slightly larger)
    // circles[1]: Inner dynamic container
    circles[0] = { x: 0, y: 0, r: initialPackingRadius * SNG_R2_TO_R1, isContainer: true };
    circles[1] = { x: 0, y: 0, r: initialPackingRadius, isInnerContainer: true };

    // Initialize small circles (wires) with random positions inside initial radius
    for (let i = 0; i < nWires; i++) {
        const radius = wireRadii[i];
         if (radius <= 0) { // Handle potential invalid input
             circles[i + 2] = { x: 0, y: 0, r: 0 };
             continue;
         }
        const maxPlacementRadius = Math.max(0, initialPackingRadius - radius); // Ensure can be placed
        const angle = fRand(0, 2 * PI);
        const rPos = Math.sqrt(fRand(0, 1)) * maxPlacementRadius; // sqrt for uniform area distribution
        circles[i + 2] = {
            x: rPos * Math.cos(angle),
            y: rPos * Math.sin(angle),
            r: radius
        };
    }

    // Run the simulation
    return runPackingSimulation(circles);
}


// --- Drawing ---
function drawCircles(canvasId, circlesData) {
    const canvas = document.getElementById(canvasId);
    if (!canvas || !canvas.getContext) return;
    const ctx = canvas.getContext('2d');
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;

    ctx.clearRect(0, 0, canvasWidth, canvasHeight); // Clear previous drawing

    if (!circlesData || circlesData.length < 3) {
         ctx.fillStyle = '#666';
         ctx.textAlign = 'center';
         ctx.fillText('无导线数据或模拟未完成', canvasWidth / 2, canvasHeight / 2);
        return; // Nothing to draw if no small circles
    }

    // Find bounding box needed (use the outer container radius)
    const containerRadius = circlesData[0].r; // Use the slightly larger outer container for bounds
    const scale = Math.min(canvasWidth - 2 * CANVAS_PADDING, canvasHeight - 2 * CANVAS_PADDING) / (2 * containerRadius);
    const offsetX = canvasWidth / 2;
    const offsetY = canvasHeight / 2;

    // Draw inner container (dashed line)
     const innerContainer = circlesData[1];
     if (innerContainer) {
        ctx.beginPath();
        ctx.arc(offsetX, offsetY, innerContainer.r * scale, 0, 2 * PI);
        ctx.strokeStyle = '#aaa';
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 3]); // Dashed line
        ctx.stroke();
        ctx.setLineDash([]); // Reset line dash
     }


    // Draw small circles (wires)
    for (let i = 2; i < circlesData.length; i++) {
        const circle = circlesData[i];
        if (circle.r <= 0) continue;
        ctx.beginPath();
        // Translate simulation coords (center origin) to canvas coords (top-left origin)
        const canvasX = offsetX + circle.x * scale;
        const canvasY = offsetY - circle.y * scale; // Invert Y-axis
        const canvasR = circle.r * scale;
        ctx.arc(canvasX, canvasY, canvasR, 0, 2 * PI);
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1;
        ctx.stroke();
        // Optional: Fill circles
         // ctx.fillStyle = 'rgba(0, 123, 255, 0.1)'; // Light blue fill
         // ctx.fill();
    }
}


// --- UI Interaction ---
function addWireType() {
    const container = document.getElementById('wire-inputs');
    const newRow = document.createElement('div');
    newRow.classList.add('wire-input-row');
    newRow.innerHTML = `
        <label>直径 (mm): <input type="number" class="wire-diameter" step="0.1" min="0.1" value="1.0"></label>
        <label>数量: <input type="number" class="wire-count" min="1" value="5"></label>
        <button class="remove-wire-type" onclick="removeWireType(this)">移除</button>
    `;
    container.appendChild(newRow);
}

function removeWireType(button) {
    const row = button.closest('.wire-input-row');
     // Prevent removing the last row if desired, or handle the case of zero rows
     const container = document.getElementById('wire-inputs');
     if (container.children.length > 1) {
        row.remove();
     } else {
         alert("至少需要保留一个导线类型。");
     }
}

function startCalculation() {
    const calculateButton = document.getElementById('calculate-button');
    const loadingIndicator = document.getElementById('loading-indicator');
    const resultsDiv = document.getElementById('results');
    const minOdSpan = document.getElementById('min-od');
    const maxOdSpan = document.getElementById('max-od');
    const avgOdSpan = document.getElementById('avg-od');
    const totalWiresSpan = document.getElementById('total-wires');

    // Disable button and show loading
    calculateButton.disabled = true;
    loadingIndicator.style.display = 'block';
    minOdSpan.textContent = '-';
    maxOdSpan.textContent = '-';
    avgOdSpan.textContent = '-';
    totalWiresSpan.textContent = '-';
     // Clear canvas immediately
     const canvas = document.getElementById('packing-canvas');
     const ctx = canvas.getContext('2d');
     ctx.clearRect(0, 0, canvas.width, canvas.height);


    // Gather inputs
    const wireRadii = [];
    const inputRows = document.querySelectorAll('.wire-input-row');
    let totalWires = 0;
    let validInput = true;

    inputRows.forEach(row => {
        const diameterInput = row.querySelector('.wire-diameter');
        const countInput = row.querySelector('.wire-count');
        const diameter = parseFloat(diameterInput.value);
        const count = parseInt(countInput.value, 10);

        if (isNaN(diameter) || diameter <= 0 || isNaN(count) || count <= 0) {
            alert('请输入有效的导线直径和数量（均为正数）。');
             diameterInput.style.border = '1px solid red';
             countInput.style.border = '1px solid red';
            validInput = false;
            return; // Stop processing this row
        } else {
            diameterInput.style.border = ''; // Reset border
             countInput.style.border = '';
        }


        const radius = diameter / 2;
        for (let i = 0; i < count; i++) {
            wireRadii.push(radius);
        }
        totalWires += count;
    });

    if (!validInput) {
         calculateButton.disabled = false;
         loadingIndicator.style.display = 'none';
        return; // Stop if input is invalid
    }


    if (wireRadii.length === 0) {
        alert('请至少添加一种导线规格。');
        calculateButton.disabled = false;
        loadingIndicator.style.display = 'none';
        return;
    }

     totalWiresSpan.textContent = totalWires;

    const numSimulations = parseInt(document.getElementById('num-simulations').value, 10) || 1;

    // Use setTimeout to allow UI update before heavy computation starts
    setTimeout(() => {
        const simulationResults = [];
        lastSimulationCircles = null; // Reset drawing data

        try {
            for (let i = 0; i < numSimulations; i++) {
                // console.log(`Starting simulation run ${i + 1} of ${numSimulations}`);
                const result = runSingleSimulation([...wireRadii]); // Pass a copy of radii if needed
                simulationResults.push(result.containerRadius * 2); // Store diameter
                if (i === numSimulations - 1) {
                    lastSimulationCircles = result.finalCircles; // Store data of the last run for drawing
                }
                 // Optional: Update progress indicator here if needed
            }

            if (simulationResults.length > 0) {
                const minOD = Math.min(...simulationResults);
                const maxOD = Math.max(...simulationResults);
                const sumOD = simulationResults.reduce((a, b) => a + b, 0);
                const avgOD = sumOD / simulationResults.length;

                minOdSpan.textContent = minOD.toFixed(3);
                maxOdSpan.textContent = maxOD.toFixed(3);
                avgOdSpan.textContent = avgOD.toFixed(3);

                // Draw the result of the last simulation
                drawCircles('packing-canvas', lastSimulationCircles);
            } else {
                 minOdSpan.textContent = '错误';
                 maxOdSpan.textContent = '错误';
                 avgOdSpan.textContent = '错误';
            }

        } catch (error) {
            console.error("模拟计算时出错:", error);
            alert("计算过程中发生错误，请检查输入或查看控制台日志。");
             minOdSpan.textContent = '错误';
             maxOdSpan.textContent = '错误';
             avgOdSpan.textContent = '错误';
        } finally {
            // Re-enable button and hide loading
            calculateButton.disabled = false;
            loadingIndicator.style.display = 'none';
        }
    }, 50); // Small delay (50ms)
}

// --- Initial Setup ---
// Optional: Add a default wire type on load if desired
// addWireType();