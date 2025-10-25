// src/components/simulationRenderer.js
import { PI } from "../logic/simulationConstants.js";

const DEFAULT_CANVAS_PADDING = 15; // 默认画布内边距
const DEFAULT_COLOR = "#BDC3C7"; // 银色

/**
 * 将模拟产生的圆形绘制到指定的画布上。
 * @param {CanvasRenderingContext2D} ctx - 画布的2D渲染上下文。
 * @param {HTMLCanvasElement} canvas - HTML画布元素。
 * @param {Array<Object>} circlesData - 来自模拟结果的圆形对象数组。
 *                                      第一个元素 (circlesData[0]) 应为外层容器信息。
 *                                      第二个元素 (circlesData[1]) 应为内层容器信息。
 *                                      后续元素为要绘制的电线圆。
 * @param {Object} [options={}] -可选参数。
 * @param {number} [options.canvasPadding=DEFAULT_CANVAS_PADDING] - 画布周围的内边距。
 * @param {Array<{diameter: number, color: string}>} [options.diameterColorMap=[]] - 直径到颜色的映射数组。
 */
export function drawCirclesOnCanvas(ctx, canvas, circlesData, options = {}) {
  const CANVAS_PADDING = options.canvasPadding ?? DEFAULT_CANVAS_PADDING;
  const diameterColorMap = options.diameterColorMap ?? [];

  if (!ctx || !canvas) {
    console.error("Canvas context 或 canvas 元素未提供给 drawCirclesOnCanvas");
    return;
  }
  ctx.clearRect(0, 0, canvas.width, canvas.height); // 清空画布

  if (!circlesData || circlesData.length < 1 || !circlesData[0]) {
    // 至少需要外层容器数据
    ctx.fillStyle = "#6c757d";
    ctx.textAlign = "center";
    ctx.font = "14px sans-serif";
    if (canvas.width > 0 && canvas.height > 0) {
      // 仅在画布有效时绘制文本
      ctx.fillText(
        "无有效的模拟数据用于绘制",
        canvas.width / 2,
        canvas.height / 2,
      );
    }
    return;
  }

  // 使用外层容器半径进行缩放计算，默认为1防止除零
  const outerContainerRadius = circlesData[0]?.r ?? 1;
  if (outerContainerRadius <= 0) {
    console.warn("外层容器半径无效，无法正确缩放绘图。");
    return;
  }

  // 计算缩放比例，使图形适应画布大小并留有边距
  const scale =
    Math.min(
      canvas.width - 2 * CANVAS_PADDING,
      canvas.height - 2 * CANVAS_PADDING,
    ) /
    (2 * outerContainerRadius);
  const offsetX = canvas.width / 2; // 画布中心点X
  const offsetY = canvas.height / 2; // 画布中心点Y

  // 绘制内层容器边界 (如果存在且有效)
  const innerContainer = circlesData[1];
  if (innerContainer && innerContainer.r > 0) {
    ctx.beginPath();
    ctx.arc(offsetX, offsetY, Math.max(0, innerContainer.r * scale), 0, 2 * PI);
    ctx.strokeStyle = "#adb5bd"; // 浅灰色边界
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 2]); // 虚线
    ctx.stroke();
    ctx.setLineDash([]); // 重置虚线设置
  }

  // 绘制所有电线圆 (从索引2开始)
  for (let i = 2; i < circlesData.length; i++) {
    const circle = circlesData[i];
    if (!circle || circle.r <= 0) continue; // 跳过无效圆或半径为0的圆

    ctx.beginPath();
    const canvasX = offsetX + circle.x * scale;
    // Y轴反转，因为通常模拟坐标系Y向上，而canvas坐标系Y向下
    const canvasY = offsetY - circle.y * scale;
    const canvasR = Math.max(0.5, circle.r * scale); // 最小半径0.5像素，保证可见

    const circleDiameter = circle.r * 2;
    let fillColor = DEFAULT_COLOR;

    // 查找匹配的颜色
    // 使用小的容差来比较浮点数
    const colorEntry = diameterColorMap.find(
      (entry) => Math.abs(entry.diameter - circleDiameter) < 1e-6,
    );
    if (colorEntry) {
      fillColor = colorEntry.color;
    }

    ctx.arc(canvasX, canvasY, canvasR, 0, 2 * PI);
    ctx.fillStyle = fillColor;
    ctx.fill();
    ctx.strokeStyle = "#343a40"; // 深灰色描边
    ctx.lineWidth = 1;
    ctx.stroke();
  }
}
