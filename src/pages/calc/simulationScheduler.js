const WIRE_COLORS = [
    "#3A86FF",
    "#2ECC71",
    "#E67E22",
    "#9B59B6",
    "#F1C40F",
    "#1ABC9C",
    "#E74C3C",
    "#34495E",
    "#8E44AD",
    "#C0392B",
    "#27AE60",
    "#D35400",
];
const DEFAULT_WIRE_COLOR = "#BDC3C7";

function normalizeDiameter(value) {
    const n = Number.parseFloat(value);
    return Number.isFinite(n) ? n : null;
}

function collectLegendCandidates({ standardRows, specialRows }) {
    const items = [];
    const uniqueDiameters = new Set();

    (standardRows || []).forEach((row) => {
        const qty = Number.parseInt(row.qty, 10);
        const od = normalizeDiameter(row.od);
        if (!qty || qty <= 0 || od == null || od <= 0) return;
        uniqueDiameters.add(od);
        items.push({
            diameter: od,
            type: "standard",
            display: row.gauge || od.toFixed(3),
        });
    });

    (specialRows || []).forEach((row) => {
        const qty = Number.parseInt(row.qty, 10);
        const od = normalizeDiameter(row.od);
        if (!qty || qty <= 0 || od == null || od <= 0) return;
        uniqueDiameters.add(od);
        items.push({
            diameter: od,
            type: "special",
            display: `${od.toFixed(3)} mm`,
        });
    });

    return { items, uniqueDiameters };
}

export function createSimulationScheduler({ runSimulation, getParameters }) {
    let chartInstance = null;
    return {
        async runSimulationSeries({ wireRadii, numSimulations }) {
            const params = getParameters();
            const diameters = [];
            let lastCircles = null;
            for (let i = 0; i < numSimulations; i++) {
                const result = runSimulation([...wireRadii], params);
                if (
                    result &&
                    typeof result.containerRadius === "number" &&
                    result.containerRadius > 1e-9
                ) {
                    diameters.push(result.containerRadius * 2);
                    if (result.finalCircles) {
                        lastCircles = result.finalCircles;
                    }
                }
            }
            return { diameters, lastCircles };
        },
        buildLegendData({ standardRows, specialRows }) {
            const { items, uniqueDiameters } = collectLegendCandidates({
                standardRows,
                specialRows,
            });
            const sorted = Array.from(uniqueDiameters).sort((a, b) => a - b);
            return sorted.map((diameter, index) => {
                const representative =
                    items.find((item) => Math.abs(item.diameter - diameter) < 1e-6) || null;
                const displayValue =
                    representative?.display ?? `${diameter.toFixed(3)} mm`;
                const color =
                    index < WIRE_COLORS.length
                        ? WIRE_COLORS[index]
                        : DEFAULT_WIRE_COLOR;
                return { diameter, color, displayValue };
            });
        },
        setChartInstance(instance) {
            chartInstance = instance;
        },
        getChartInstance() {
            return chartInstance;
        },
    };
}
