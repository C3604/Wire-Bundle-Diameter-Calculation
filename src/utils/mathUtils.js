// src/utils/mathUtils.js

/**
 * 计算两点之间距离的平方。
 * @param {number} x1 点1的x坐标
 * @param {number} y1 点1的y坐标
 * @param {number} x2 点2的x坐标
 * @param {number} y2 点2的y坐标
 * @returns {number} 距离的平方
 */
export function distanceSq(x1, y1, x2, y2) {
    const dx = x1 - x2;
    const dy = y1 - y2;
    return dx * dx + dy * dy;
}

/**
 * 计算两点之间的直线距离。
 * @param {number} x1 点1的x坐标
 * @param {number} y1 点1的y坐标
 * @param {number} x2 点2的x坐标
 * @param {number} y2 点2的y坐标
 * @returns {number} 距离
 */
export function distance(x1, y1, x2, y2) {
    return Math.sqrt(distanceSq(x1, y1, x2, y2));
}

/**
 * 快速检查两个圆形是否碰撞。
 * 首先进行轴对齐包围盒 (AABB) 检测，如果包围盒重叠，再进行精确的距离检测。
 * @param {number} x1 圆1的中心x坐标
 * @param {number} y1 圆1的中心y坐标
 * @param {number} r1 圆1的半径
 * @param {number} x2 圆2的中心x坐标
 * @param {number} y2 圆2的中心y坐标
 * @param {number} r2 圆2的半径
 * @returns {boolean} 如果碰撞则为true，否则为false
 */
export function fastCheckCollision(x1, y1, r1, x2, y2, r2) {
    const totalRadius = r1 + r2;
    if (Math.abs(x1 - x2) > totalRadius || Math.abs(y1 - y2) > totalRadius) {
        return false; // 基于边界框判断未碰撞
    }
    // 如果边界框重叠，则检查实际距离
    return distanceSq(x1, y1, x2, y2) < totalRadius * totalRadius;
}

/**
 * 生成指定范围内的随机浮点数。
 * @param {number} min 最小值
 * @param {number} max 最大值
 * @returns {number} 在 [min, max) 范围内的随机浮点数
 */
export function fRand(min, max) {
    return Math.random() * (max - min) + min;
} 