import { getOrgUnitsByPath, getMe } from '../services/caseService2';

// 缓存组织机构数据
const orgUnitCache = new Map<string, string>();

// 获取组织机构中文名称
export async function getOrgUnitName(orgUnitId: string): Promise<string> {
  // 如果缓存中有，直接返回
  if (orgUnitCache.has(orgUnitId)) {
    return orgUnitCache.get(orgUnitId) || orgUnitId;
  }

  try {
    // 获取当前用户信息
    const me = await getMe();
    const path = me.organisationUnits?.[0]?.path || '';
    const parentPath = path.substring(0, path.lastIndexOf('/')) || path;
    
    // 获取组织机构数据
    const ous = await getOrgUnitsByPath(parentPath);
    
    // 构建ID到名称的映射
    const orgUnitMap = new Map<string, string>();
    ous.forEach(ou => {
      orgUnitMap.set(ou.id, ou.name);
      orgUnitCache.set(ou.id, ou.name);
    });
    
    // 返回对应的组织机构名称
    return orgUnitMap.get(orgUnitId) || orgUnitId;
  } catch (error) {
    console.error('获取组织机构名称失败:', error);
    return orgUnitId;
  }
}