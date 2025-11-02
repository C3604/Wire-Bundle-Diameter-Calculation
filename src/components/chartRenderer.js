// import Chart from '../lib/chart.umd.js'; // Chart对象将从全局作用域获取
// src/components/chartRenderer.js

// 模拟历史折线图（CalcPage 使用），从全局 Chart 获取实例

/**
 * 渲染或更新模拟历史的折线图。
 * @param {string} canvasElementId - 用于渲染图表的HTML canvas元素的ID。
 * @param {Array<number>} diameters - 每次模拟运行的直径数组。
 * @param {Chart | null} currentChartInstance - 当前的 Chart.js 实例。
 * @returns {Chart | null} 新创建的 Chart.js 实例。
 */
export function renderSimulationHistoryChart(
  canvasElementId,
  diameters,
  currentChartInstance,
) {
  const chartCanvas = document.getElementById(canvasElementId);
  if (!chartCanvas) {
    console.error(`图表画布元素 (ID: '${canvasElementId}') 未找到。`);
    return currentChartInstance;
  }
  const chartCtx = chartCanvas.getContext("2d");
  if (!chartCtx) {
    console.error(
      `无法获取图表画布 (ID: '${canvasElementId}') 的2D渲染上下文。`,
    );
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
      type: "line",
      data: {
        labels: labels,
        datasets: [
          {
            label: "模拟直径 (mm)",
            data: diameters,
            borderColor: "rgb(75, 192, 192)",
            fill: false,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: { y: { beginAtZero: false } },
      },
    });
    return newChartInstance;
  } catch (error) {
    console.error("创建 Chart.js 实例时出错:", error);
    chartCtx.clearRect(0, 0, chartCanvas.width, chartCanvas.height);
    return null;
  }
}
