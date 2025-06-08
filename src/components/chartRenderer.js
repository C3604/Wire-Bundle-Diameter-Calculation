// import Chart from '../lib/chart.umd.js'; // Chart对象将从全局作用域获取
// src/components/chartRenderer.js

let chartInstance = null; // 在模块作用域内维护图表实例

/**
 * 将电线数量分布渲染为饼图。
 * @param {Object} wireCounts - 一个对象，键是电线规格，值是数量。
 */
export function renderChart(wireCounts) {
    const ctx = document.getElementById('chart-canvas')?.getContext('2d');
    if (!ctx) {
        console.error('无法找到ID为 "chart-canvas" 的Canvas元素或其2D上下文。');
        return;
    }

    // 如果已存在图表实例，先销毁它
    if (chartInstance) {
        chartInstance.destroy();
    }

    const labels = Object.keys(wireCounts);
    const data = Object.values(wireCounts);

    // 为每个标签生成稳定且独特的颜色
    const backgroundColors = labels.map(label => getColorForString(label));

    chartInstance = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                label: '电线数量',
                data: data,
                backgroundColor: backgroundColors,
                borderColor: '#ffffff',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                },
                title: {
                    display: true,
                    text: '电线规格分布'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed !== null) {
                                label += context.parsed;
                            }
                            return label;
                        }
                    }
                }
            }
        }
    });
}

/**
 * 清除画布上的图表。
 */
export function clearChart() {
    if (chartInstance) {
        chartInstance.destroy();
        chartInstance = null;
    }
    // 即使实例不存在，也尝试清理画布
    const ctx = document.getElementById('chart-canvas')?.getContext('2d');
    if (ctx) {
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    }
}


/**
 * 为给定的字符串生成一个伪随机但确定的颜色。
 * 这确保了相同的电线规格总是有相同的颜色。
 * @param {string} str - 输入字符串 (例如, "AWG 20")
 * @returns {string} - 返回一个HSL格式的颜色字符串。
 */
function getColorForString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const h = hash % 360;
    return `hsl(${h}, 70%, 50%)`;
}


// -- 旧的历史页面图表函数，暂时保留以备将来使用 --

/**
 * 渲染或更新模拟历史的折线图。
 * @param {string} canvasElementId - 用于渲染图表的HTML canvas元素的ID。
 * @param {Array<number>} diameters - 每次模拟运行的直径数组。
 * @param {Chart | null} currentChartInstance - 当前的 Chart.js 实例。
 * @returns {Chart | null} 新创建的 Chart.js 实例。
 */
export function renderSimulationHistoryChart(canvasElementId, diameters, currentChartInstance) {
    const chartCanvas = document.getElementById(canvasElementId);
    if (!chartCanvas) {
        console.error(`图表画布元素 (ID: '${canvasElementId}') 未找到。`);
        return currentChartInstance;
    }
    const chartCtx = chartCanvas.getContext('2d');
    if (!chartCtx) {
        console.error(`无法获取图表画布 (ID: '${canvasElementId}') 的2D渲染上下文。`);
        return currentChartInstance;
    }

    if (currentChartInstance) {
        currentChartInstance.destroy();
    }

    if (!diameters || diameters.length === 0) {
        chartCtx.clearRect(0, 0, chartCanvas.width, chartCanvas.height);
        return null;
    }

    const labels = diameters.map((_, index) => `模拟 ${index + 1}`);

    try {
        const newChartInstance = new Chart(chartCtx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: '模拟直径 (mm)',
                    data: diameters,
                    borderColor: 'rgb(75, 192, 192)',
                    fill: false
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: { y: { beginAtZero: false } }
            }
        });
        return newChartInstance;
    } catch (error) {
        console.error("创建 Chart.js 实例时出错:", error);
        chartCtx.clearRect(0, 0, chartCanvas.width, chartCanvas.height);
        return null;
    }
} 