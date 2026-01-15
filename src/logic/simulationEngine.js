// src/logic/simulationEngine.js

import {
  distanceSq,
  distance,
  fastCheckCollision,
  fRand,
} from "../utils/mathUtils.js";

// 约定：所有模拟参数通过函数显式传入（params），不从顶层导入。

/**
 * 计算"接触范数" - 衡量圆形重叠（穿透）程度的指标。
 * 返回相对于圆形半径的平均穿透距离。
 * @param {Array<Object>} circles - 圆形对象数组 {x, y, r, ...}
 * @returns {number} 平均穿透范数。
 */
export function calculateContactNorm(circles, gridData) {
  const nCircles = circles.length;
  if (nCircles < 2) return 0;
  const innerContainerRadius = circles[1]?.r ?? 0; // 内层容器半径
  let totalPenetration = 0; // 总穿透量
  let activeCircles = 0; // 活跃圆形数量（半径大于0）

  // 初始化每个圆的接触数和总穿透深度
  for (let i = 1; i < nCircles; i++) {
    if (circles[i]) {
      circles[i].n = 0; // 接触数量
      circles[i].d = 0; // 穿透深度
    }
  }

  const { grid, cellSize } =
    gridData && gridData.grid && gridData.cellSize
      ? gridData
      : buildSpatialGrid(circles);

  for (let i = 2; i < nCircles; i++) {
    // 从第三个圆开始计算（前两个是外层和内层容器）
    const circle_i = circles[i];
    if (!circle_i || circle_i.r <= 0) continue; // 跳过无效或半径为0的圆
    activeCircles++;
    let penetration_i = 0; // 当前圆i的总穿透深度

    // 检查与内层容器的碰撞
    if (circles[1]) {
      // 确保内层容器存在
      const distSqFromCenter = distanceSq(circle_i.x, circle_i.y, 0, 0); // 圆心到容器中心的距离平方
      const boundaryDist = innerContainerRadius - circle_i.r; // 圆心到容器边界的允许最大距离

      if (boundaryDist > 0 && distSqFromCenter > boundaryDist * boundaryDist) {
        // 圆形在容器内且超出边界
        const distFromCenter = Math.sqrt(distSqFromCenter);
        const penetration = Math.abs(
          distFromCenter + circle_i.r - innerContainerRadius,
        ); // 计算穿透深度
        if (penetration > 1e-9) {
          circles[1].n++;
          circle_i.n++;
          circles[1].d += penetration;
          penetration_i += penetration;
        }
      } else if (boundaryDist <= 0) {
        // 圆形半径大于等于容器半径，特殊处理 (或圆在容器外)
        const distFromCenter = Math.sqrt(distSqFromCenter);
        const penetration = Math.abs(
          distFromCenter + circle_i.r - innerContainerRadius,
        );
        if (penetration > 1e-9) {
          circles[1].n++;
          circle_i.n++;
          circles[1].d += penetration;
          penetration_i += penetration;
        }
      }
    }

    // 检查与其他圆形的碰撞（邻域加速）
    const neighborIndices = getNeighborIndices(circles, i, grid, cellSize);
    for (const j of neighborIndices) {
      const circle_j = circles[j];
      if (!circle_j || circle_j.r <= 0) continue;

      if (
        fastCheckCollision(
          circle_i.x,
          circle_i.y,
          circle_i.r,
          circle_j.x,
          circle_j.y,
          circle_j.r,
        )
      ) {
        const dx = circle_j.x - circle_i.x;
        const dy = circle_j.y - circle_i.y;
        const distSq = dx * dx + dy * dy;
        const totalRadius = circle_i.r + circle_j.r;
        const totalRadiusSq = totalRadius * totalRadius;
        if (distSq < totalRadiusSq - 1e-9) {
          const dist = Math.sqrt(distSq);
          const penetration = Math.abs(totalRadius - dist); // 穿透深度
          if (penetration > 1e-9) {
            circle_i.n++;
            circle_j.n++;
            penetration_i += penetration;
            circles[j].d = (circles[j].d || 0) + penetration;
          }
        }
      }
    }
    if (circle_i.r > 0) {
      circles[i].d = penetration_i;
      totalPenetration += penetration_i / (2 * circle_i.r); // 累加归一化的穿透量
    }
  }
  return activeCircles > 0 ? totalPenetration / activeCircles : 0; // 返回平均穿透范数
}

/**
 * 执行堆叠模拟的一个步骤。
 * @param {Array<Object>} circles - 圆形对象数组 {x, y, r, ...}
 * @param {number} acceleration - 决定圆形每步移动多少的因子。
 * @param {number} PI - 圆周率
 * @param {number} WEIGHT_FACTOR - 质量权重因子
 */
export function packStep(circles, acceleration, PI, WEIGHT_FACTOR, gridData) {
  const nCircles = circles.length;
  if (nCircles < 2 || !circles[1]) return; // 至少需要内外容器和电线圆

  const innerContainerRadius = circles[1].r; // 内层容器半径

  const { grid, cellSize } =
    gridData && gridData.grid && gridData.cellSize
      ? gridData
      : buildSpatialGrid(circles);

  const masses = new Array(nCircles);
  for (let i = 2; i < nCircles; i++) {
    const c = circles[i];
    masses[i] = c && c.r > 0 ? Math.pow(c.r, WEIGHT_FACTOR) : 0;
  }

  for (let i = 2; i < nCircles; i++) {
    // 遍历所有电线圆
    const circle_i = circles[i];
    if (!circle_i || circle_i.r <= 0) continue;

    // 与内层容器的交互
    const distSqFromCenter = distanceSq(circle_i.x, circle_i.y, 0, 0);
    const boundaryDist = innerContainerRadius - circle_i.r;

    if (boundaryDist >= 0 && distSqFromCenter > boundaryDist * boundaryDist) {
      // 圆形在容器内且超出边界
      const distFromCenter = Math.sqrt(distSqFromCenter);
      if (distFromCenter > 1e-9) {
        const overlap = distFromCenter - boundaryDist;
        const pushFactor = overlap / distFromCenter;
        circle_i.x -= circle_i.x * pushFactor;
        circle_i.y -= circle_i.y * pushFactor;
      }
    } else if (boundaryDist < 0) {
      // 圆形半径大于容器半径，或者完全在容器外的情况
      const distFromCenter = Math.sqrt(distSqFromCenter);
      if (distFromCenter > 1e-9) {
        const overlap = distFromCenter + circle_i.r - innerContainerRadius; // 这种情况下 overlap 的计算方式不同
        const pushFactor = (overlap / distFromCenter) * 1.1; // 更强的推力
        circle_i.x -= circle_i.x * pushFactor;
        circle_i.y -= circle_i.y * pushFactor;
      }
    }

    // 与其他电线圆的交互（邻域加速）
    const neighborIndices = getNeighborIndices(circles, i, grid, cellSize);
    for (const j of neighborIndices) {
      const circle_j = circles[j];
      if (!circle_j || circle_j.r <= 0) continue;

      if (
        fastCheckCollision(
          circle_i.x,
          circle_i.y,
          circle_i.r,
          circle_j.x,
          circle_j.y,
          circle_j.r,
        )
      ) {
        const dx = circle_j.x - circle_i.x;
        const dy = circle_j.y - circle_i.y;
        const distSq = dx * dx + dy * dy;
        const totalRadius = circle_i.r + circle_j.r;
        const totalRadiusSq = totalRadius * totalRadius;

        if (distSq < totalRadiusSq - 1e-9) {
          const dist = Math.sqrt(distSq);
          if (dist > 1e-9) {
            // 发生重叠且不完全重合
            const overlap = totalRadius - dist;

            const mass_i = masses[i];
            const mass_j = masses[j];
            const totalMass = mass_i + mass_j;

            const ratio_i = totalMass > 0 ? mass_j / totalMass : 0.5;
            const ratio_j = totalMass > 0 ? mass_i / totalMass : 0.5;

            const moveFactor = (overlap / dist) * acceleration;

            circle_i.x -= dx * moveFactor * ratio_i;
            circle_i.y -= dy * moveFactor * ratio_i;
            circle_j.x += dx * moveFactor * ratio_j;
            circle_j.y += dy * moveFactor * ratio_j;
          } else {
            // 圆心几乎重合，随机推开
            const angle = Math.random() * 2 * PI;
            const pushDist = (circle_i.r || 0.1) * 0.1; // 推开一小段距离
            circle_i.x -= Math.cos(angle) * pushDist;
            circle_i.y -= Math.sin(angle) * pushDist;
            circle_j.x += Math.cos(angle) * pushDist;
            circle_j.y += Math.sin(angle) * pushDist;
          }
        }
      }
    }
  }
}

/**
 * 运行主堆叠模拟循环。
 * @param {Array<Object>} circles - 初始圆形对象数组。
 * @param {Object} params - 模拟参数对象（显式传入）。
 * @returns {Object} { finalCircles: Array<Object>, containerRadius: number } 包含最终圆形数据和容器半径的对象
 */
export function runPackingSimulation(circles, params) {
  const {
    PI,
    SNG_R2_TO_R1,
    ACCELERATION,
    WEIGHT_FACTOR,
    CONVERGENCE_THRESHOLD,
    MAX_ITERATIONS_RUNPACKING,
    MAX_ITERATIONS_PACKSTEP,
    CONTAINER_ADJUST_FACTOR,
  } = params;

  if (circles.length < 3 || !circles[0] || !circles[1]) {
    console.error("用于模拟的初始圆形数组无效。");
    return { finalCircles: circles, containerRadius: 0 };
  }

  let avgPenetration = 1.0;
  let lastAvgPenetration = 0.0;
  let iterations = 0;
  let accelerationLocal = ACCELERATION;
  let containerAdjustLocal = CONTAINER_ADJUST_FACTOR;
  const convergenceSeries = [];
  const innerExitReasons = [];

  while (
    avgPenetration > CONVERGENCE_THRESHOLD &&
    iterations < MAX_ITERATIONS_RUNPACKING
  ) {
    // 如果平均穿透仍然较大，适当增大内层容器半径
    if (avgPenetration > CONVERGENCE_THRESHOLD * 5) {
      const severity = Math.min(avgPenetration / (CONVERGENCE_THRESHOLD * 5), 2);
      containerAdjustLocal = Math.min(Math.max(CONTAINER_ADJUST_FACTOR * (1 + 0.5 * severity), 0.04), 0.08);
      circles[1].r *= 1 + containerAdjustLocal * Math.min(avgPenetration, 0.3);
    } else {
      containerAdjustLocal = CONTAINER_ADJUST_FACTOR;
    }
    circles[0].r = circles[1].r * SNG_R2_TO_R1; // 外层容器半径随内层容器半径调整

    for (let i = 0; i < MAX_ITERATIONS_PACKSTEP; i++) {
      const gridData = buildSpatialGrid(circles);
      packStep(circles, accelerationLocal, PI, WEIGHT_FACTOR, gridData);
      lastAvgPenetration = avgPenetration;
      avgPenetration = calculateContactNorm(circles, gridData);

      // 如果达到收敛阈值，或变化量足够小，则认为内部循环收敛
      if (
        avgPenetration < CONVERGENCE_THRESHOLD ||
        Math.abs(avgPenetration - lastAvgPenetration) <
          CONVERGENCE_THRESHOLD / 50
      ) {
        innerExitReasons.push(
          avgPenetration < CONVERGENCE_THRESHOLD ? "threshold" : "delta"
        );
        break;
      }
      if (i === MAX_ITERATIONS_PACKSTEP - 1) {
        innerExitReasons.push("max");
      }
    }
    iterations++;
    convergenceSeries.push(avgPenetration);
    if (iterations > 1) {
      const rise = avgPenetration > lastAvgPenetration * 1.05;
      const slow = Math.abs(avgPenetration - lastAvgPenetration) < CONVERGENCE_THRESHOLD / 100;
      if (rise) {
        accelerationLocal = Math.max(1.0, Math.min(1.8, accelerationLocal * 0.9));
      } else if (slow) {
        accelerationLocal = Math.max(1.0, Math.min(1.8, accelerationLocal * 1.05));
      }
    }
  }

  const converged = avgPenetration <= CONVERGENCE_THRESHOLD;
  return {
    finalCircles: circles,
    containerRadius: circles[1].r,
    converged,
    iterations,
    finalAvgPenetration: avgPenetration,
    convergenceSeries,
    innerExitReasons,
  };
}

/**
 * 针对给定的一组电线半径，设置并运行单次堆叠模拟。
 * @param {Array<number>} wireRadii - 要堆叠的电线的半径数组。
 * @param {Object} params - 模拟参数对象（显式传入）。
 * @returns {Object} 来自 runPackingSimulation 的结果 { finalCircles, containerRadius }
 */
export function runSingleSimulation(wireRadii, params) {
  // 使用当前参数进行模拟（显式传入）
  const { PI, SNG_R2_TO_R1 } = params;

  // --- 输入验证和过滤 ---
  const validRadii = wireRadii
    .map((r) => parseFloat(r)) // 转换为数字
    .filter((r) => !isNaN(r) && r > 0); // 过滤掉NaN和非正数

  const nWires = validRadii.length;
  if (nWires === 0) return { finalCircles: [], containerRadius: 0 };

  // --- 初始容器半径估算 (采用 ref/simulation.js 的健壮算法) ---
  let totalArea = 0;
  let maxSingleRadius = 0;
  for (const r of validRadii) {
    totalArea += PI * r * r;
    if (r > maxSingleRadius) {
      maxSingleRadius = r;
    }
  }
  // 结合面积和最大半径进行估算，提供一个更合理的初始值
  const initialPackingRadius = Math.max(
    Math.sqrt(totalArea / PI) * 1.15,
    maxSingleRadius * 1.05,
  );

  let circles = [];
  // 外层容器
  circles.push({
    r: initialPackingRadius * SNG_R2_TO_R1,
    x: 0,
    y: 0,
    isContainer: true,
  });
  // 内层容器
  circles.push({ r: initialPackingRadius, x: 0, y: 0, isInnerContainer: true });

  // --- 随机放置圆形 (采用 ref/simulation.js 的均匀分布算法) ---
  validRadii.forEach((radius, i) => {
    // 确保圆形不会超出初始容器边界
    const maxPlacementRadius = Math.max(0, initialPackingRadius - radius);
    // 使用开方确保在圆形区域内均匀分布，而不是向中心聚集
    const angle = fRand(0, 2 * PI);
    const rPos = Math.sqrt(fRand(0, 1)) * maxPlacementRadius;

    circles.push({
      r: radius,
      x: rPos * Math.cos(angle),
      y: rPos * Math.sin(angle),
      id: `wire_${i}`,
    });
  });

  // 运行模拟并返回结果
  const result = runPackingSimulation(circles, params);
  return {
    finalCircles: result.finalCircles,
    containerRadius: result.containerRadius,
    converged: result.converged,
    iterations: result.iterations,
  };
}

// --- 邻域加速（网格）辅助函数 ---
function buildSpatialGrid(circles) {
  let maxR = 0;
  for (let i = 2; i < circles.length; i++) {
    const c = circles[i];
    if (c && c.r > maxR) maxR = c.r;
  }
  const cellSize = Math.max(1e-6, maxR * 2);
  const grid = new Map();
  for (let i = 2; i < circles.length; i++) {
    const c = circles[i];
    if (!c || c.r <= 0) continue;
    const ix = Math.floor(c.x / cellSize);
    const iy = Math.floor(c.y / cellSize);
    const key = `${ix},${iy}`;
    let bucket = grid.get(key);
    if (!bucket) {
      bucket = [];
      grid.set(key, bucket);
    }
    bucket.push(i);
  }
  return { grid, cellSize };
}

function getNeighborIndices(circles, i, grid, cellSize) {
  const c = circles[i];
  const ix = Math.floor(c.x / cellSize);
  const iy = Math.floor(c.y / cellSize);
  const candidates = [];
  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      const key = `${ix + dx},${iy + dy}`;
      const bucket = grid.get(key);
      if (bucket) {
        for (const j of bucket) {
          if (j > i) candidates.push(j);
        }
      }
    }
  }
  return candidates;
}

// --- 内部数学/计算函数 ---

/**
 * 计算一组圆的总面积
 * @param {Array<number>} radii - 所有圆的半径数组
 * @returns {number} 总面积
 */
function calculateTotalCircleArea(radii) {
  return radii.reduce((acc, r) => acc + Math.PI * r * r, 0);
}

/**
 * 计算包围所有圆形的最小圆的半径
 * @param {Array<object>} circles - 所有圆形的数组，每个对象包含 x, y, r
 * @returns {number} 边界半径
 */
function calculateBoundingRadius(circles) {
  let maxDistSq = 0;
  circles.forEach((c) => {
    if (!c.isContainer && !c.isInnerContainer) {
      // 只考虑电线圆
      const distSq = c.x * c.x + c.y * c.y;
      if (distSq > maxDistSq) {
        maxDistSq = distSq;
      }
    }
  });
  return Math.sqrt(maxDistSq);
}

/**
 * 计算填充密度
 * @param {Array<number>} wireRadii - 所有导线半径的数组
 * @param {number} containerRadius - 容器半径
 * @returns {number} 填充密度 (0到1之间)
 */
function calculatePackingDensity(wireRadii, containerRadius) {
  if (containerRadius === 0) return 0;
  const totalWireArea = calculateTotalCircleArea(wireRadii);
  const containerArea = Math.PI * containerRadius * containerRadius;
  return totalWireArea / containerArea;
}

/**
 * 计算最终的线束外径
 * @param {Array<object>} circles - 所有圆形的数组
 * @returns {number} 线束外径
 */
function calculateBundleDiameter(circles) {
  let maxRadius = 0;
  circles.forEach((circle) => {
    // 跳过容器圆
    if (circle.isContainer || circle.isInnerContainer) return;
    const dist =
      Math.sqrt(circle.x * circle.x + circle.y * circle.y) + circle.r;
    if (dist > maxRadius) {
      maxRadius = dist;
    }
  });
  return maxRadius * 2;
}

/**
 * 计算所有电线的总截面积
 * @param {Array<number>} wireRadii - 所有导线半径的数组
 * @returns {number} 总截面积
 */
function calculateTotalWireCrossSection(wireRadii) {
  return calculateTotalCircleArea(wireRadii);
}
