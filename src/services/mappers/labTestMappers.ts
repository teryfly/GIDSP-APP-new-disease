/**
 * 检测记录数据映射工具函数
 */

/**
 * 将事件数据值映射为Map结构
 */
export function mapDataValuesToMap(dataValues: Array<{ dataElement: string; value: string }>): Map<string, string> {
  return new Map(dataValues.map((dv) => [dv.dataElement, dv.value]));
}

/**
 * 从选项集中获取选项名称
 */
export function getOptionName(code: string, options: Array<{ code: string; name: string }>): string {
  const option = options.find((o) => o.code === code);
  return option?.name || code;
}

/**
 * 格式化日期
 */
export function formatDate(dateStr?: string): string {
  if (!dateStr) return '-';
  return dateStr;
}

/**
 * 格式化检测状态标签颜色
 */
export function getTestStatusColor(status: string): string {
  const colorMap: Record<string, string> = {
    PENDING_CONFIRMATION: 'gold',
    CONFIRMED: 'green',
  };
  return colorMap[status] || 'default';
}

/**
 * 格式化检测结果标签颜色
 */
export function getTestResultColor(result: string): string {
  const colorMap: Record<string, string> = {
    POSITIVE: 'red',
    NEGATIVE: 'green',
    PENDING: 'gold',
    UNCERTAIN: 'orange',
  };
  return colorMap[result] || 'default';
}