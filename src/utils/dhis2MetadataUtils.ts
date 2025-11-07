/**
 * DHIS2元数据查询工具
 * 提供对DHIS2元数据的结构化查询功能
 */

// 加载元数据
const loadMetadata = async () => {
  const response = await import('../utils/metadata_corrected_B.json');
  return response.default;
};

// 缓存元数据以提高性能
let metadataCache: any = null;
const getMetadata = async () => {
  if (!metadataCache) {
    metadataCache = await loadMetadata();
  }
  return metadataCache;
};

/**
 * 通用DHIS2元数据查询方法
 * 根据传入的不同参数返回相应层级的元数据信息
 * @param programId 程序ID
 * @param stageId 阶段ID
 * @param dataElementId 数据元素ID
 * @param optionSetId 选项集ID
 * @returns 相应层级的元数据信息
 */
export const getDHIS2MetadataInfo = async (
  programId: string = '',
  stageId: string = '',
  dataElementId: string = '',
  optionSetId: string = ''
) => {
  const metadata = await getMetadata();
  
  // 如果传入了optionSetId，优先返回选项集信息
  if (optionSetId) {
    const optionSet = metadata.optionSets?.find((os: any) => os.id === optionSetId);
    if (!optionSet) return null;
    
    // 获取选项集的选项详情
    const options = optionSet.options?.map((optRef: any) => {
      const option = metadata.options?.find((opt: any) => opt.id === optRef.id);
      return option ? { id: option.id, code: option.code, name: option.name, sortOrder: option.sortOrder } : null;
    }).filter(Boolean);
    
    return {
      ...optionSet,
      options
    };
  }
  
  // 如果传入了dataElementId，返回数据元素信息
  if (dataElementId) {
    const dataElement = metadata.dataElements?.find((de: any) => de.id === dataElementId);
    if (!dataElement) return null;
    
    // 如果数据元素有关联的选项集，获取选项集信息
    if (dataElement.optionSet) {
      const optionSet = metadata.optionSets?.find((os: any) => os.id === dataElement.optionSet.id);
      if (optionSet) {
        // 获取选项集的选项详情
        const options = optionSet.options?.map((optRef: any) => {
          const option = metadata.options?.find((opt: any) => opt.id === optRef.id);
          return option ? { id: option.id, code: option.code, name: option.name, sortOrder: option.sortOrder } : null;
        }).filter(Boolean);
        
        return {
          ...dataElement,
          optionSet: {
            ...optionSet,
            options
          }
        };
      }
    }
    
    return dataElement;
  }
  
  // 如果传入了stageId，返回阶段信息
  if (stageId) {
    const stage = metadata.programStages?.find((s: any) => s.id === stageId);
    if (!stage) return null;
    
    // 获取阶段中的数据元素
    const dataElements = stage.programStageDataElements?.map((psde: any) => {
      const dataElement = metadata.dataElements?.find((de: any) => de.id === psde.dataElement.id);
      if (!dataElement) return null;
      
      // 如果数据元素有关联的选项集，获取选项集信息
      if (dataElement.optionSet) {
        const optionSet = metadata.optionSets?.find((os: any) => os.id === dataElement.optionSet.id);
        if (optionSet) {
          // 获取选项集的选项详情
          const options = optionSet.options?.map((optRef: any) => {
            const option = metadata.options?.find((opt: any) => opt.id === optRef.id);
            return option ? { id: option.id, code: option.code, name: option.name, sortOrder: option.sortOrder } : null;
          }).filter(Boolean);
          
          return {
            ...dataElement,
            optionSet: {
              ...optionSet,
              options
            }
          };
        }
      }
      
      return dataElement;
    }).filter(Boolean);
    
    return {
      ...stage,
      dataElements
    };
  }
  
  // 如果传入了programId，返回程序信息
  if (programId) {
    const program = metadata.programs?.find((p: any) => p.id === programId);
    if (!program) return null;
    
    // 获取程序阶段
    const programStages = program.programStages?.map((stageRef: any) => {
      const stage = metadata.programStages?.find((s: any) => s.id === stageRef.id);
      if (!stage) return null;
      
      // 获取阶段中的数据元素
      const dataElements = stage.programStageDataElements?.map((psde: any) => {
        const dataElement = metadata.dataElements?.find((de: any) => de.id === psde.dataElement.id);
        if (!dataElement) return null;
        
        // 如果数据元素有关联的选项集，获取选项集信息
        if (dataElement.optionSet) {
          const optionSet = metadata.optionSets?.find((os: any) => os.id === dataElement.optionSet.id);
          if (optionSet) {
            // 获取选项集的选项详情
            const options = optionSet.options?.map((optRef: any) => {
              const option = metadata.options?.find((opt: any) => opt.id === optRef.id);
              return option ? { id: option.id, code: option.code, name: option.name, sortOrder: option.sortOrder } : null;
            }).filter(Boolean);
            
            return {
              ...dataElement,
              optionSet: {
                ...optionSet,
                options
              }
            };
          }
        }
        
        return dataElement;
      }).filter(Boolean);
      
      return {
        ...stage,
        dataElements
      };
    }).filter(Boolean);
    
    return {
      ...program,
      programStages
    };
  }
  
  // 如果都没有传入参数，返回null
  return null;
};

/**
 * 根据programId获取程序信息及所有子级信息
 * @param programId 程序ID
 * @returns 程序信息及子级信息
 */
export const getProgramInfo = async (programId: string) => {
  return await getDHIS2MetadataInfo(programId, '', '', '');
};

/**
 * 根据stageId获取阶段信息及所有子级信息
 * @param stageId 阶段ID
 * @returns 阶段信息及子级信息
 */
export const getStageInfo = async (stageId: string) => {
  return await getDHIS2MetadataInfo('', stageId, '', '');
};

/**
 * 根据dataElementId获取数据元素信息及关联选项集
 * @param dataElementId 数据元素ID
 * @returns 数据元素信息及选项集
 */
export const getDataElementInfo = async (dataElementId: string) => {
  return await getDHIS2MetadataInfo('', '', dataElementId, '');
};

/**
 * 根据optionSetId获取选项集信息及所有选项
 * @param optionSetId 选项集ID
 * @returns 选项集信息及选项
 */
export const getOptionSetInfo = async (optionSetId: string) => {
  return await getDHIS2MetadataInfo('', '', '', optionSetId);
};
