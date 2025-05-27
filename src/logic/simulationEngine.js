// src/logic/simulationEngine.js

import {
    PI,
    SNG_R2_TO_R1,
    ACCELERATION,
    WEIGHT_FACTOR,
    CONVERGENCE_THRESHOLD,
    MAX_ITERATIONS_RUNPACKING,
    MAX_ITERATIONS_PACKSTEP,
    CONTAINER_ADJUST_FACTOR
} from './simulationConstants.js';
import {
    distanceSq,
    distance,
    fastCheckCollision,
    fRand
} from '../utils/mathUtils.js';

/**
 * 计算"接触范数" - 衡量圆形重叠（穿透）程度的指标。
 * 返回相对于圆形半径的平均穿透距离。
 * @param {Array<Object>} circles - 圆形对象数组 {x, y, r, ...}
 * @returns {number} 平均穿透范数。
 */
export function calculateContactNorm(circles) {
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

    for (let i = 2; i < nCircles; i++) { // 从第三个圆开始计算（前两个是外层和内层容器）
        const circle_i = circles[i];
        if (!circle_i || circle_i.r <= 0) continue; // 跳过无效或半径为0的圆
        activeCircles++;
        let penetration_i = 0; // 当前圆i的总穿透深度

        // 检查与内层容器的碰撞
        if (circles[1]) { // 确保内层容器存在
            const distSqFromCenter = distanceSq(circle_i.x, circle_i.y, 0, 0); // 圆心到容器中心的距离平方
            const boundaryDist = innerContainerRadius - circle_i.r; // 圆心到容器边界的允许最大距离

            if (boundaryDist > 0 && distSqFromCenter > boundaryDist * boundaryDist) { // 圆形在容器内且超出边界
                const distFromCenter = Math.sqrt(distSqFromCenter);
                const penetration = Math.abs(distFromCenter + circle_i.r - innerContainerRadius); // 计算穿透深度
                if (penetration > 1e-9) {
                    circles[1].n++; circle_i.n++;
                    circles[1].d += penetration;
                    penetration_i += penetration;
                }
            } else if (boundaryDist <= 0) { // 圆形半径大于等于容器半径，特殊处理 (或圆在容器外)
                const distFromCenter = Math.sqrt(distSqFromCenter);
                const penetration = Math.abs(distFromCenter + circle_i.r - innerContainerRadius);
                if (penetration > 1e-9) {
                    circles[1].n++; circle_i.n++;
                    circles[1].d += penetration;
                    penetration_i += penetration;
                }
            }
        }

        // 检查与其他圆形的碰撞
        for (let j = i + 1; j < nCircles; j++) {
            const circle_j = circles[j];
            if (!circle_j || circle_j.r <= 0) continue;

            if (fastCheckCollision(circle_i.x, circle_i.y, circle_i.r, circle_j.x, circle_j.y, circle_j.r)) {
                const dist = distance(circle_i.x, circle_i.y, circle_j.x, circle_j.y);
                const totalRadius = circle_i.r + circle_j.r;
                if (dist < totalRadius - 1e-9) { // 发生穿透 (1e-9 是为了处理浮点精度问题)
                    const penetration = Math.abs(totalRadius - dist); // 穿透深度
                    if (penetration > 1e-9) {
                        circle_i.n++; circle_j.n++;
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
 */
export function packStep(circles, acceleration) {
    const nCircles = circles.length;
    if (nCircles < 2 || !circles[1]) return; // 至少需要内外容器和电线圆

    const innerContainerRadius = circles[1].r; // 内层容器半径

    for (let i = 2; i < nCircles; i++) { // 遍历所有电线圆
        const circle_i = circles[i];
        if (!circle_i || circle_i.r <= 0) continue;

        // 与内层容器的交互
        const distSqFromCenter = distanceSq(circle_i.x, circle_i.y, 0, 0);
        const boundaryDist = innerContainerRadius - circle_i.r;

        if (boundaryDist >= 0 && distSqFromCenter > boundaryDist * boundaryDist) { // 圆形在容器内且超出边界
            const distFromCenter = Math.sqrt(distSqFromCenter);
            if (distFromCenter > 1e-9) {
                const overlap = distFromCenter - boundaryDist;
                const pushFactor = overlap / distFromCenter;
                circle_i.x -= circle_i.x * pushFactor;
                circle_i.y -= circle_i.y * pushFactor;
            }
        } else if (boundaryDist < 0) { // 圆形半径大于容器半径，或者完全在容器外的情况
            const distFromCenter = Math.sqrt(distSqFromCenter);
            if (distFromCenter > 1e-9) {
                const overlap = distFromCenter + circle_i.r - innerContainerRadius; // 这种情况下 overlap 的计算方式不同
                const pushFactor = overlap / distFromCenter * 1.1; // 更强的推力
                circle_i.x -= circle_i.x * pushFactor;
                circle_i.y -= circle_i.y * pushFactor;
            }
        }

        // 与其他电线圆的交互
        for (let j = i + 1; j < nCircles; j++) {
            const circle_j = circles[j];
            if (!circle_j || circle_j.r <= 0) continue;

            if (fastCheckCollision(circle_i.x, circle_i.y, circle_i.r, circle_j.x, circle_j.y, circle_j.r)) {
                const dist = distance(circle_i.x, circle_i.y, circle_j.x, circle_j.y);
                const totalRadius = circle_i.r + circle_j.r;

                if (dist < totalRadius - 1e-9 && dist > 1e-9) { // 发生重叠且不完全重合
                    const overlap = totalRadius - dist;
                    const dx = circle_j.x - circle_i.x;
                    const dy = circle_j.y - circle_i.y;

                    const mass_i = Math.pow(circle_i.r, WEIGHT_FACTOR);
                    const mass_j = Math.pow(circle_j.r, WEIGHT_FACTOR);
                    const totalMass = mass_i + mass_j;

                    const ratio_i = (totalMass > 0) ? mass_j / totalMass : 0.5;
                    const ratio_j = (totalMass > 0) ? mass_i / totalMass : 0.5;

                    const moveFactor = overlap / dist * acceleration;

                    circle_i.x -= dx * moveFactor * ratio_i;
                    circle_i.y -= dy * moveFactor * ratio_i;
                    circle_j.x += dx * moveFactor * ratio_j;
                    circle_j.y += dy * moveFactor * ratio_j;

                } else if (dist <= 1e-9) { // 圆心几乎重合，随机推开
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

/**
 * 运行主堆叠模拟循环。
 * @param {Array<Object>} circles - 初始圆形对象数组。
 * @param {number} [currentAcceleration=ACCELERATION] - 当前使用的加速度，默认为全局ACCELERATION常量。
 * @returns {Object} { finalCircles: Array<Object>, containerRadius: number } 包含最终圆形数据和容器半径的对象
 */
export function runPackingSimulation(circles, currentAcceleration = ACCELERATION) {
    if (circles.length < 3 || !circles[0] || !circles[1]) {
        console.error("用于模拟的初始圆形数组无效。");
        return { finalCircles: circles, containerRadius: 0 };
    }

    let avgPenetration = 1.0;
    let lastAvgPenetration = 0.0;
    let iterations = 0;

    while (avgPenetration > CONVERGENCE_THRESHOLD && iterations < MAX_ITERATIONS_RUNPACKING) {
        // 如果平均穿透仍然较大，适当增大内层容器半径
        if (avgPenetration > CONVERGENCE_THRESHOLD * 5) {
            circles[1].r *= (1 + CONTAINER_ADJUST_FACTOR * Math.min(avgPenetration, 0.3));
        }
        circles[0].r = circles[1].r * SNG_R2_TO_R1; // 外层容器半径随内层容器半径调整

        // let innerConverged = false; // 内部小循环是否收敛的标志 (在原代码中未使用，移除)
        for (let i = 0; i < MAX_ITERATIONS_PACKSTEP; i++) {
            packStep(circles, currentAcceleration); // 执行一步堆叠
            lastAvgPenetration = avgPenetration;
            avgPenetration = calculateContactNorm(circles); // 计算新的接触范数

            // 如果达到收敛阈值，或变化量足够小，则认为内部循环收敛
            if (avgPenetration < CONVERGENCE_THRESHOLD || Math.abs(avgPenetration - lastAvgPenetration) < CONVERGENCE_THRESHOLD / 50) {
                // innerConverged = true; // 标记收敛
                break; // 跳出内部循环
            }
        }
        iterations++;
    }

    if (iterations >= MAX_ITERATIONS_RUNPACKING) {
        console.warn(`模拟达到最大迭代次数 (${MAX_ITERATIONS_RUNPACKING}) 未完全收敛。平均穿透: ${avgPenetration}`);
    }
    return { finalCircles: circles, containerRadius: circles[1].r };
}

// 当前使用的参数
let currentParams = {
    pi: PI,
    r2r1: SNG_R2_TO_R1,
    accel: ACCELERATION,
    weight: WEIGHT_FACTOR,
    conv: CONVERGENCE_THRESHOLD,
    maxIterRun: MAX_ITERATIONS_RUNPACKING,
    maxIterStep: MAX_ITERATIONS_PACKSTEP,
    containerAdjust: CONTAINER_ADJUST_FACTOR
};

// 重新加载参数的函数
export function reloadParameters() {
    currentParams = {
        pi: PI,
        r2r1: SNG_R2_TO_R1,
        accel: ACCELERATION,
        weight: WEIGHT_FACTOR,
        conv: CONVERGENCE_THRESHOLD,
        maxIterRun: MAX_ITERATIONS_RUNPACKING,
        maxIterStep: MAX_ITERATIONS_PACKSTEP,
        containerAdjust: CONTAINER_ADJUST_FACTOR
    };
    console.log('模拟引擎参数已重新加载:', currentParams);
}

// 将 reloadParameters 函数添加到 window.simulationEngine
if (typeof window !== 'undefined') {
    window.simulationEngine = window.simulationEngine || {};
    window.simulationEngine.reloadParameters = reloadParameters;
}

/**
 * 针对给定的一组电线半径，设置并运行单次堆叠模拟。
 * @param {Array<number>} wireRadii - 要堆叠的电线的半径数组。
 * @returns {Object} 来自 runPackingSimulation 的结果 { finalCircles, containerRadius }
 */
export function runSingleSimulation(wireRadii) {
    // 使用当前参数进行模拟
    const {
        pi: PI,
        r2r1: SNG_R2_TO_R1,
        accel: ACCELERATION,
        weight: WEIGHT_FACTOR,
        conv: CONVERGENCE_THRESHOLD,
        maxIterRun: MAX_ITERATIONS_RUNPACKING,
        maxIterStep: MAX_ITERATIONS_PACKSTEP,
        containerAdjust: CONTAINER_ADJUST_FACTOR
    } = currentParams;

    const nWires = wireRadii.length;
    if (nWires === 0) return { finalCircles: [], containerRadius: 0 };

    const nCircles = nWires + 2; // 总圆形数 = 电线数 + 2个容器圆
    const circles = new Array(nCircles);

    let totalArea = 0;
    let maxSingleRadius = 0;
    for (const r of wireRadii) {
        totalArea += PI * r * r;
        if (r > maxSingleRadius) maxSingleRadius = r;
    } // 计算总面积和最大半径

    // 初始堆叠半径：基于总面积估算，并确保至少比最大单根电线半径大一点
    const initialPackingRadius = Math.max(Math.sqrt(totalArea / PI) * 1.15, maxSingleRadius * 1.05);

    circles[0] = { x: 0, y: 0, r: initialPackingRadius * SNG_R2_TO_R1, isContainer: true }; // 外层容器
    circles[1] = { x: 0, y: 0, r: initialPackingRadius, isInnerContainer: true }; // 内层容器

    for (let i = 0; i < nWires; i++) {
        const radius = wireRadii[i];
        if (radius <= 0) { // 跳过半径为0的无效电线
            circles[i + 2] = { x: 0, y: 0, r: 0 };
            continue;
        }
        // 随机放置电线圆在内层容器中
        const maxPlacementRadius = Math.max(0, initialPackingRadius - radius); // 最大允许放置的中心点离容器中心的距离
        const angle = fRand(0, 2 * PI);
        const rPos = Math.sqrt(fRand(0, 1)) * maxPlacementRadius; // 使用 sqrt(random) 使分布更均匀
        circles[i + 2] = { x: rPos * Math.cos(angle), y: rPos * Math.sin(angle), r: radius };
    }

    return runPackingSimulation(circles); // 运行模拟, 使用默认加速度
} 