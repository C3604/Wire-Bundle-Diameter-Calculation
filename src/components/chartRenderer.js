// src/components/chartRenderer.js
// Chart 获取封装：优先从全局作用域读取（由 popup.html 引入 UMD），缺失时给出明确错误
function getChartOrThrow() {
  const ChartGlobal = typeof window !== "undefined" ? window.Chart : undefined;
  if (!ChartGlobal) {
    console.error(
      "Chart.js 未加载：请确保 popup.html 中已引入 'src/vendor/chart.umd.js' 或改为模块化接入。",
    );
    throw new Error("Chart.js not available in global scope");
  }
  return ChartGlobal;
}

// 模拟历史折线图（CalcPage 使用），通过封装获取 Chart 构造器

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
    if (!diameters || diameters.length === 0) {
      const chartCtx = chartCanvas.getContext("2d");
      chartCtx.clearRect(0, 0, chartCanvas.width, chartCanvas.height);
      return null;
    }
    currentChartInstance.data.labels = diameters.map(
      (_, index) => `模拟 ${index + 1}`,
    );
    currentChartInstance.data.datasets[0].data = diameters;
    currentChartInstance.update();
    return currentChartInstance;
  }

  if (!diameters || diameters.length === 0) {
    chartCtx.clearRect(0, 0, chartCanvas.width, chartCanvas.height);
    return null;
  }

  const labels = diameters.map((_, index) => `模拟 ${index + 1}`);

  try {
    const ChartCtor = getChartOrThrow();
    const newChartInstance = new ChartCtor(chartCtx, {
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
