// 工具函数（待实现） 

/**
 * 异步读取JSON文件
 * @param {string} path - JSON文件路径
 * @returns {Promise<any>} 解析后的JSON对象
 */
export async function fetchJson(path) {
  const response = await fetch(path);
  if (!response.ok) throw new Error('无法读取配置文件: ' + path);
  return await response.json();
} 