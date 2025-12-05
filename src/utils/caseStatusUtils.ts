import { loadOptionSetCached } from '../services/newCaseService';

// 缓存个案状态选项集
let caseStatusOptions: { value: string; label: string }[] | null = null;

// 获取个案状态选项集
export async function getCaseStatusOptions() {
  if (!caseStatusOptions) {
    try {
      const stat = await loadOptionSetCached('OsCaseStat1');
      caseStatusOptions = (stat.options || []).map(o => ({ value: o.code, label: o.name }));
    } catch (error) {
      console.error('获取个案状态选项集失败:', error);
      caseStatusOptions = [];
    }
  }
  return caseStatusOptions;
}

// 根据状态代码获取状态中文名称
export async function getCaseStatusLabel(statusCode: string) {
  const options = await getCaseStatusOptions();
  const option = options.find(opt => opt.value === statusCode);
  return option ? option.label : statusCode;
}

// 状态标签颜色映射 - 根据接口返回的状态代码来匹配颜色
export const statusTagColor = (status?: string) => {
  if (!status) return 'default';
  
  // 根据接口返回的状态代码匹配颜色
  if (status === 'VERIFIED' || status === '已核实') return 'blue';
  if (status === 'IN_PROGRESS' || status === '处理中') return 'blue';
  if (status === 'CLOSED' || status === '已关闭') return 'green';
  if (status === 'NEW' || status === '新建') return 'gold';
  
  return 'default';
};