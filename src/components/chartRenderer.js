// import Chart from '../lib/chart.umd.js'; // Chart对象将从全局作用域获取
// src/components/chartRenderer.js

/**
 * 渲染或更新模拟历史的折线图。
 * 此函数假定 Chart.js 库已在页面中全局可用。
 * @param {string} canvasElementId - 用于渲染图表的HTML canvas元素的ID。
 * @param {Array<number>} diameters - 每次模拟运行的直径数组 (不包括包裹层)。
 * @param {Chart | null} currentChartInstance - 当前的 Chart.js 实例 (如果存在)，用于销毁旧图表。
 * @returns {Chart | null} 新创建的 Chart.js 实例，或者在没有数据或出错时返回 null。
 */
export function renderSimulationHistoryChart(canvasElementId, diameters, currentChartInstance) {
    const chartCanvas = document.getElementById(canvasElementId);
    if (!chartCanvas) {
        console.error(`图表画布元素 (ID: '${canvasElementId}') 未找到。`);
        return currentChartInstance; // 返回传入的实例或null
    }
    const chartCtx = chartCanvas.getContext('2d');
    if (!chartCtx) {
        console.error(`无法获取图表画布 (ID: '${canvasElementId}') 的2D渲染上下文。`);
        return currentChartInstance;
    }

    // 如果存在旧的图表实例，先销毁它
    if (currentChartInstance) {
        currentChartInstance.destroy();
    }

    // 如果没有直径数据，则清空画布并显示提示信息
    if (!diameters || diameters.length === 0) {
        chartCtx.clearRect(0, 0, chartCanvas.width, chartCanvas.height);
        if (chartCanvas.width > 0 && chartCanvas.height > 0) {
            chartCtx.fillStyle = '#aaa';
            chartCtx.textAlign = 'center';
            chartCtx.font = '12px sans-serif';
            chartCtx.fillText("无模拟历史数据", chartCanvas.width / 2, chartCanvas.height / 2);
        }
        return null; // 没有创建新的图表实例
    }

    const labels = diameters.map((_, index) => `模拟 ${index + 1}`);

    // 创建新的 Chart.js 实例
    try {
        const newChartInstance = new Chart(chartCtx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: '模拟直径 (mm)',
                    data: diameters,
                    borderColor: 'rgb(75, 192, 192)',
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    borderWidth: 1.5,
                    tension: 0.1,
                    pointBackgroundColor: 'rgb(75, 192, 192)',
                    pointRadius: 3,
                    pointHoverRadius: 5,
                    fill: false
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: false,
                        title: { display: true, text: '线束直径 (mm)' }
                    },
                    x: {
                        title: { display: true, text: '模拟次数' }
                    }
                },
                plugins: {
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        callbacks: {
                            title: (tooltipItems) => tooltipItems[0].label,
                            label: (context) => {
                                let label = context.dataset.label || '';
                                if (label) label += ': ';
                                if (context.parsed.y !== null) {
                                    label += context.parsed.y.toFixed(3) + ' mm';
                                }
                                return label;
                            }
                        }
                    },
                    legend: { display: false } // 通常在简单历史图中不需要图例
                },
                interaction: {
                    mode: 'nearest',
                    axis: 'x',
                    intersect: false
                }
            }
        });
        return newChartInstance;
    } catch (error) {
        console.error("创建 Chart.js 实例时出错:", error);
        // 尝试清空画布以避免显示损坏的图表
        chartCtx.clearRect(0, 0, chartCanvas.width, chartCanvas.height);
        return null;
    }
} 