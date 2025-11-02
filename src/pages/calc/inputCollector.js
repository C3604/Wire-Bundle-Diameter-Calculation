import i18n from "../../i18n/index.js";

/**
 * 统一的输入收集与校验流程，返回标准化状态与警告信息。
 * 与 UI 解耦：通过参数传入页面的行数据与输入值。
 *
 * @param {Object} params
 * @param {Array} params.standardRows - 标准导线行 [{ gauge, type, od, qty }, ...]
 * @param {Array} params.specialRows - 特殊导线行 [{ od, qty }, ...]
 * @param {Array} params.wrapRows - 包裹行 [{ thick }, ...]
 * @param {string|number} params.toleranceValue - 容差值（100-200）
 * @param {string|number} params.scoreValue - 模拟次数（1-100）
 * @returns {{ ok: boolean, wireRadii: number[], totalWrappingThickness: number, numSimulations: number, toleranceFactor: number, warnings: string[] }}
 */
export function collectAndValidateInputs({
  standardRows,
  specialRows,
  wrapRows,
  toleranceValue,
  scoreValue,
}) {
  const warnings = [];

  // 收集导线半径
  const wireRadii = [];
  (standardRows || []).forEach((row) => {
    const qty = parseInt(row.qty, 10);
    const od = parseFloat(row.od);
    if (!isNaN(qty) && qty > 0 && !isNaN(od) && od > 0) {
      const radius = od / 2;
      for (let i = 0; i < qty; i++) wireRadii.push(radius);
    }
  });
  (specialRows || []).forEach((row) => {
    const qty = parseInt(row.qty, 10);
    const od = parseFloat(row.od);
    if (!isNaN(qty) && qty > 0 && !isNaN(od) && od > 0) {
      const radius = od / 2;
      for (let i = 0; i < qty; i++) wireRadii.push(radius);
    }
  });

  if (wireRadii.length === 0) {
    warnings.push(i18n.getMessage("calc_message_no_valid_wires"));
    return {
      ok: false,
      wireRadii,
      totalWrappingThickness: 0,
      numSimulations: 10,
      toleranceFactor: 1.1,
      warnings,
    };
  }

  // 包裹层总厚度（只统计正数）
  let totalWrappingThickness = 0;
  (wrapRows || []).forEach((row) => {
    const thick = parseFloat(row.thick);
    if (!isNaN(thick) && thick > 0) totalWrappingThickness += thick;
  });

  // 容差（100-200）
  let toleranceVal = parseInt(toleranceValue, 10);
  let toleranceFactor;
  if (isNaN(toleranceVal) || toleranceVal < 100 || toleranceVal > 200) {
    warnings.push(
      i18n.getMessage("calc_message_invalid_tolerance") ||
        "Invalid tolerance; using fallback 110%",
    );
    toleranceVal = 110;
  }
  toleranceFactor = toleranceVal / 100;

  // 计算次数（1-100）
  let scoreVal = parseInt(scoreValue, 10);
  let numSimulations;
  if (isNaN(scoreVal) || scoreVal < 1 || scoreVal > 100) {
    warnings.push(
      i18n.getMessage("calc_message_invalid_score") ||
        "Invalid simulation count; using fallback 10",
    );
    scoreVal = 10;
  }
  numSimulations = scoreVal;

  return {
    ok: true,
    wireRadii,
    totalWrappingThickness,
    numSimulations,
    toleranceFactor,
    warnings,
  };
}