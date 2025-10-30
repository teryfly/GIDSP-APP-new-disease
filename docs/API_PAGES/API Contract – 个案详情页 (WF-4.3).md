# API Contract – 个案详情页 (WF-4.3)

## 1. Page Description

个案详情页是疾控业务人员查看和编辑单个已知疾病个案完整信息的核心页面。该页面采用 Tab 导航结构，包含7个信息类别：基本信息、流行病学信息、随访记录、治疗记录、检测记录、追踪记录和操作日志。页面顶部显示个案摘要信息和主要操作按钮（编辑、推送流调、结案），支持在详情页内直接新增子记录（随访、治疗、检测、追踪），并实时展示 Program Rules 触发的提示和警告。

------

## 2. Required DHIS2 APIs

| #    | Endpoint                                    | Method | Description                                   | Key Parameters                                               | Expected Response / Data Type               |
| ---- | ------------------------------------------- | ------ | --------------------------------------------- | ------------------------------------------------------------ | ------------------------------------------- |
| 1    | `/api/trackedEntityInstances/{teiId}`       | GET    | 获取个案完整信息（TEI + Enrollment + Events） | `fields=*,enrollments[*,events[*,dataValues[*]]]&program=PrgCaseMgt1` | TrackedEntityInstance对象                   |
| 2    | `/api/programs/PrgCaseMgt1/metadata`        | GET    | 获取Program元数据（用于字段解析和表单渲染）   | `fields=id,programTrackedEntityAttributes[*],programStages[*,programStageDataElements[*]]` | Program元数据                               |
| 3    | `/api/optionSets`                           | GET    | 批量获取所有选项集（用于值转换）              | `fields=id,name,options[id,code,name]&filter=id:in:[OsGender001,OsDiseasCd1,OsCaseStat1,...]` | List<OptionSet>                             |
| 4    | `/api/events`                               | POST   | 创建新的Event（随访/治疗/检测/追踪）          | 见 Section 4 示例                                            | `{ "httpStatus": "OK", "response": {...} }` |
| 5    | `/api/events/{eventId}`                     | PUT    | 更新Event数据                                 | 同 POST 结构                                                 | `{ "httpStatus": "OK" }`                    |
| 6    | `/api/events/{eventId}`                     | DELETE | 删除Event                                     | -                                                            | `{ "httpStatus": "OK" }`                    |
| 7    | `/api/trackedEntityInstances/{teiId}`       | PUT    | 更新TEI属性和Enrollment属性                   | 见 Section 4 示例                                            | `{ "httpStatus": "OK" }`                    |
| 8    | `/api/enrollments/{enrollmentId}`           | PUT    | 更新Enrollment状态（如完成/取消）             | `{ "status": "COMPLETED" }`                                  | `{ "httpStatus": "OK" }`                    |
| 9    | `/api/dataValueAudit`                       | GET    | 获取数据变更审计日志                          | `de={dataElement}&ps={programStage}&ou={orgUnit}&startDate={start}&endDate={end}` | List<DataValueAudit>                        |
| 10   | `/api/trackedEntityInstances/{teiId}/audit` | GET    | 获取TEI级别的审计日志                         | -                                                            | List<TrackedEntityAudit>                    |
| 11   | `/api/fileResources`                        | POST   | 上传附件（如实验室报告PDF）                   | `multipart/form-data`                                        | `{ "response": { "fileResource": {...} } }` |
| 12   | `/api/fileResources/{fileId}`               | GET    | 下载附件                                      | -                                                            | Binary文件流                                |

------

## 3. Notes

### 3.1 API 调用顺序与依赖关系

```
页面加载阶段：
  从 URL 提取 teiId
    └─> API-01 (获取TEI完整数据)
    └─> API-02 (获取Program元数据) [可缓存]
    └─> API-03 (获取选项集) [可缓存]
    └─> 渲染页面各Tab

用户交互阶段：
  [编辑基本信息]
    └─> API-07 (更新TEI/Enrollment属性)
    └─> API-01 (刷新数据)

  [新增随访/治疗/检测/追踪]
    └─> API-04 (创建Event)
    └─> API-01 (刷新数据)

  [编辑随访/治疗/检测/追踪]
    └─> API-05 (更新Event)
    └─> API-01 (刷新数据)

  [删除随访/治疗/检测/追踪]
    └─> API-06 (删除Event)
    └─> API-01 (刷新数据)

  [点击"推送流调系统"]
    └─> API-05 (更新 DePushEpi01=true)
    └─> 调用外部系统API
    └─> API-01 (刷新数据)

  [点击"结案"]
    └─> API-08 (更新Enrollment状态)
    └─> API-01 (刷新数据)

  [查看操作日志]
    └─> API-09 (数据变更日志)
    └─> API-10 (TEI审计日志)

  [上传实验室报告]
    └─> API-11 (上传文件)
    └─> API-05 (更新 DeLabRptUrl)
```

### 3.2 关键技术说明

#### 3.2.1 数据加载与解析

**API-01 返回的数据结构：**

```javascript
{
  "trackedEntityInstance": "TEI123456",
  "trackedEntityType": "TetPerson01",
  "orgUnit": "OuWuhou0001",
  "created": "2024-01-15T10:30:00.000",
  "lastUpdated": "2024-01-20T14:20:00.000",
  "attributes": [
    { "attribute": "AtrFullNm01", "value": "张三", "displayName": "姓名" },
    { "attribute": "AtrNatnlId1", "value": "110101197901011234", "displayName": "身份证号" },
    // ... 其他TEI属性
  ],
  "enrollments": [
    {
      "enrollment": "ENROLLMENT_789",
      "program": "PrgCaseMgt1",
      "orgUnit": "OuWuhou0001",
      "enrollmentDate": "2024-01-15",
      "incidentDate": "2024-01-10",
      "status": "ACTIVE",
      "attributes": [
        { "attribute": "AtrDiseaCd1", "value": "B03", "displayName": "疾病编码" },
        { "attribute": "AtrRptDt001", "value": "2024-01-15", "displayName": "报告日期" },
        // ... 其他Program属性
      ],
      "events": [
        {
          "event": "EVENT_456",
          "programStage": "PsInvestig1",
          "program": "PrgCaseMgt1",
          "enrollment": "ENROLLMENT_789",
          "orgUnit": "OuWuhou0001",
          "eventDate": "2024-01-15",
          "status": "ACTIVE",
          "created": "2024-01-15T10:35:00.000",
          "lastUpdated": "2024-01-18T09:20:00.000",
          "dataValues": [
            { "dataElement": "DeInitDiag1", "value": "疑似新冠肺炎" },
            { "dataElement": "DeCaseStat1", "value": "IN_PROGRESS" },
            { "dataElement": "DeExposHst1", "value": "近14天内有疫区旅居史" },
            // ... 其他Data Elements
          ]
        },
        {
          "event": "EVENT_501",
          "programStage": "PsFollowUp1",
          "eventDate": "2024-01-16",
          "dataValues": [
            { "dataElement": "DeFlwUpMthd", "value": "PHONE" },
            { "dataElement": "DeHlthStat1", "value": "NORMAL" },
            { "dataElement": "DeTemp00001", "value": "36.8" },
            // ...
          ]
        },
        // ... 其他Events (治疗、检测、追踪)
      ]
    }
  ]
}
```

**前端数据解析逻辑：**

```javascript
// 解析TEI数据
const parseTrackedEntity = (teiData, programMeta, optionSets) => {
  const enrollment = teiData.enrollments[0]; // 假设单个Enrollment
  
  return {
    tei: {
      id: teiData.trackedEntityInstance,
      created: teiData.created,
      lastUpdated: teiData.lastUpdated,
      attributes: parseAttributes(teiData.attributes, optionSets)
    },
    enrollment: {
      id: enrollment.enrollment,
      enrollmentDate: enrollment.enrollmentDate,
      incidentDate: enrollment.incidentDate,
      status: enrollment.status,
      attributes: parseAttributes(enrollment.attributes, optionSets)
    },
    investigation: parseEvent(
      enrollment.events.find(e => e.programStage === 'PsInvestig1'),
      programMeta.stages.find(s => s.id === 'PsInvestig1'),
      optionSets
    ),
    followUps: enrollment.events
      .filter(e => e.programStage === 'PsFollowUp1')
      .map(e => parseEvent(e, programMeta.stages.find(s => s.id === 'PsFollowUp1'), optionSets))
      .sort((a, b) => new Date(b.eventDate) - new Date(a.eventDate)),
    treatments: enrollment.events
      .filter(e => e.programStage === 'PsTreatmnt1')
      .map(e => parseEvent(e, programMeta.stages.find(s => s.id === 'PsTreatmnt1'), optionSets))
      .sort((a, b) => new Date(b.eventDate) - new Date(a.eventDate)),
    tests: enrollment.events
      .filter(e => e.programStage === 'PsTest00001')
      .map(e => parseEvent(e, programMeta.stages.find(s => s.id === 'PsTest00001'), optionSets))
      .sort((a, b) => new Date(b.eventDate) - new Date(a.eventDate)),
    trackings: enrollment.events
      .filter(e => e.programStage === 'PsTracking1')
      .map(e => parseEvent(e, programMeta.stages.find(s => s.id === 'PsTracking1'), optionSets))
      .sort((a, b) => new Date(b.eventDate) - new Date(a.eventDate))
  };
};

// 解析属性（转换选项集值）
const parseAttributes = (attributes, optionSets) => {
  return attributes.map(attr => {
    const optionSet = findOptionSetForAttribute(attr.attribute, optionSets);
    return {
      id: attr.attribute,
      name: attr.displayName,
      value: attr.value,
      displayValue: optionSet 
        ? optionSet.options.find(o => o.code === attr.value)?.name || attr.value
        : attr.value
    };
  });
};

// 解析Event
const parseEvent = (event, stageMeta, optionSets) => {
  if (!event) return null;
  
  return {
    id: event.event,
    eventDate: event.eventDate,
    created: event.created,
    lastUpdated: event.lastUpdated,
    status: event.status,
    dataValues: event.dataValues.map(dv => {
      const deMeta = stageMeta.programStageDataElements.find(
        psde => psde.dataElement.id === dv.dataElement
      )?.dataElement;
      
      const optionSet = deMeta?.optionSet 
        ? optionSets.find(os => os.id === deMeta.optionSet.id)
        : null;
      
      return {
        id: dv.dataElement,
        name: deMeta?.name || dv.dataElement,
        value: dv.value,
        displayValue: optionSet
          ? optionSet.options.find(o => o.code === dv.value)?.name || dv.value
          : dv.value,
        valueType: deMeta?.valueType
      };
    })
  };
};
```

#### 3.2.2 Tab页数据组织

| Tab名称      | 数据来源                                                    | 显示内容                                           |
| ------------ | ----------------------------------------------------------- | -------------------------------------------------- |
| 基本信息     | TEI Attributes + Program Attributes + Stage 1 Data Elements | 患者基本信息、报告信息、诊断信息                   |
| 流行病学信息 | Stage 1 Data Elements                                       | 暴露史、接触史、旅行史                             |
| 随访记录     | Stage 2 Events                                              | 时间线卡片展示（最新5条），支持展开查看全部        |
| 治疗记录     | Stage 3 Events                                              | 时间线卡片展示                                     |
| 检测记录     | Stage 4 Events                                              | 时间线卡片展示 + 推送状态标识                      |
| 追踪记录     | Stage 5 Events                                              | 时间线卡片展示 + 地图可视化（可选）                |
| 操作日志     | API-09 + API-10                                             | 表格展示（操作人、操作时间、操作内容、变更前后值） |

#### 3.2.3 Program Rules 实时触发

DHIS2 的 Program Rules 在以下场景自动触发：

1. **页面加载时：** 评估所有 Rules，显示警告/错误/提示
2. **用户输入时：** 实时验证字段值
3. **保存数据后：** 后端执行 Rules，返回 `conflicts` 或 `notifications`

**前端集成 Program Rules：**

```javascript
// 解析并显示 Program Rule 触发的消息
const parseProgramRuleEffects = (response) => {
  const effects = {
    warnings: [],
    errors: [],
    infos: []
  };
  
  // 从响应中提取 conflicts
  if (response.conflicts) {
    response.conflicts.forEach(conflict => {
      if (conflict.value.includes('⚠️')) {
        effects.warnings.push(conflict.value);
      } else if (conflict.value.includes('TRIGGER_')) {
        effects.infos.push(conflict.value);
      } else {
        effects.errors.push(conflict.value);
      }
    });
  }
  
  return effects;
};

// 显示 Program Rule 消息
const displayRuleEffects = (effects) => {
  // 错误：阻塞操作
  if (effects.errors.length > 0) {
    showErrorModal(effects.errors.join('\n'));
    return false; // 阻止保存
  }
  
  // 警告：不阻塞但提示
  if (effects.warnings.length > 0) {
    showWarningBanner(effects.warnings);
  }
  
  // 信息：显示按钮或提示
  if (effects.infos.length > 0) {
    effects.infos.forEach(info => {
      if (info === 'TRIGGER_PUSH_TO_EPI') {
        showPushToEpiButton();
      } else if (info === 'TRIGGER_PUSH_TO_LAB') {
        showPushToLabButton();
      }
    });
  }
  
  return true; // 允许保存
};
```

**示例：体温异常警告（PR6.1）**

```javascript
// 用户在随访记录中输入体温 38.5℃
// Program Rule PR6.1 触发：
{
  "conflicts": [
    {
      "object": "DeTemp00001",
      "value": "⚠️ 体温异常，请密切关注患者状况"
    }
  ]
}

// 前端显示黄色警告横幅
<WarningBanner>
  ⚠️ 体温异常，请密切关注患者状况
</WarningBanner>
```

#### 3.2.4 编辑模式与只读模式切换

**页面状态管理：**

```javascript
const [pageMode, setPageMode] = useState('view'); // 'view' | 'edit'
const [editingTab, setEditingTab] = useState(null); // null | 'basic' | 'epi' | ...

// 点击"编辑"按钮
const handleEdit = (tab) => {
  setPageMode('edit');
  setEditingTab(tab);
};

// 保存修改
const handleSave = async () => {
  const isValid = validateForm();
  if (!isValid) return;
  
  try {
    if (editingTab === 'basic') {
      await updateTEIAttributes();
    } else if (editingTab === 'epi') {
      await updateInvestigationEvent();
    }
    
    await refreshCaseData();
    setPageMode('view');
    showSuccessToast('保存成功');
  } catch (error) {
    showErrorToast('保存失败: ' + error.message);
  }
};

// 取消编辑
const handleCancel = () => {
  setPageMode('view');
  setEditingTab(null);
  resetForm();
};
```

**字段权限控制：**

```javascript
// 根据用户角色和数据状态控制编辑权限
const canEdit = (field, enrollment) => {
  const user = getCurrentUser();
  const userRoles = user.userRoles.map(r => r.name);
  
  // 系统管理员可编辑所有字段
  if (userRoles.includes('系统管理员')) return true;
  
  // 已关闭的个案不可编辑
  if (enrollment.status === 'COMPLETED') return false;
  
  // 已推送的数据不可编辑
  if (field === 'DePushEpi01' && field.value === 'true') return false;
  
  // 县级用户只能编辑本机构数据
  if (userRoles.includes('县级疾控业务人员')) {
    return enrollment.orgUnit === user.organisationUnits[0].id;
  }
  
  return true;
};
```

#### 3.2.5 子记录（随访/治疗/检测/追踪）的CRUD

**新增子记录：**

```javascript
// 点击"新增随访记录"
const handleAddFollowUp = async (formData) => {
  const eventPayload = {
    program: 'PrgCaseMgt1',
    programStage: 'PsFollowUp1',
    enrollment: currentEnrollmentId,
    orgUnit: currentOrgUnit,
    eventDate: formData.eventDate,
    status: 'ACTIVE',
    trackedEntityInstance: currentTeiId,
    dataValues: [
      { dataElement: 'DeFlwUpMthd', value: formData.followUpMethod },
      { dataElement: 'DeHlthStat1', value: formData.healthStatus },
      { dataElement: 'DeTemp00001', value: formData.temperature },
      { dataElement: 'DeSymptoms1', value: formData.symptoms },
      { dataElement: 'DeTrtCompl1', value: formData.treatmentCompliance },
      { dataElement: 'DeNxtFlwDt1', value: formData.nextFollowUpDate },
      { dataElement: 'DeRemarks01', value: formData.remarks }
    ]
  };
  
  await dhis2Api.post('/api/events', eventPayload);
  await refreshCaseData();
  closeModal();
};
```

**编辑子记录：**

```javascript
// 点击随访记录卡片的"编辑"按钮
const handleEditFollowUp = async (eventId, updatedData) => {
  const eventPayload = {
    event: eventId,
    dataValues: [
      { dataElement: 'DeHlthStat1', value: updatedData.healthStatus },
      { dataElement: 'DeTemp00001', value: updatedData.temperature },
      // ... 仅包含修改的字段
    ]
  };
  
  await dhis2Api.put(`/api/events/${eventId}`, eventPayload);
  await refreshCaseData();
  closeModal();
};
```

**删除子记录：**

```javascript
// 点击随访记录卡片的"删除"按钮
const handleDeleteFollowUp = async (eventId) => {
  const confirmed = await showConfirmDialog({
    title: '确认删除',
    message: '删除后将无法恢复，是否继续？'
  });
  
  if (!confirmed) return;
  
  await dhis2Api.delete(`/api/events/${eventId}`);
  await refreshCaseData();
  showSuccessToast('删除成功');
};
```

#### 3.2.6 推送流调系统实现

**推送逻辑：**

```javascript
// 点击"推送流调系统"按钮
const handlePushToEpi = async () => {
  try {
    // 1. 检查前置条件
    if (currentCase.investigation.caseStatus !== 'VERIFIED') {
      showErrorToast('只有已核实的个案才能推送至流调系统');
      return;
    }
    
    if (currentCase.investigation.pushedToEpi) {
      showErrorToast('该个案已推送，无需重复操作');
      return;
    }
    
    // 2. 确认推送
    const confirmed = await showConfirmDialog({
      title: '推送至流调系统',
      message: '确认将该个案推送至流调系统进行调查？'
    });
    
    if (!confirmed) return;
    
    // 3. 更新 DHIS2 数据
    const investigationEventId = currentCase.investigation.id;
    await dhis2Api.put(`/api/events/${investigationEventId}`, {
      dataValues: [
        { dataElement: 'DePushEpi01', value: 'true' },
        { dataElement: 'DePushEpiDt', value: new Date().toISOString() }
      ]
    });
    
    // 4. 调用外部系统API（自定义服务）
    await externalApi.post('/api/epi/cases', {
      caseId: currentTeiId,
      caseNumber: currentCase.tei.attributes.find(a => a.id === 'AtrCaseNo01').value,
      patientName: currentCase.tei.attributes.find(a => a.id === 'AtrFullNm01').value,
      diseaseCode: currentCase.enrollment.attributes.find(a => a.id === 'AtrDiseaCd1').value,
      exposureHistory: currentCase.investigation.dataValues.find(dv => dv.id === 'DeExposHst1')?.value,
      contactHistory: currentCase.investigation.dataValues.find(dv => dv.id === 'DeContHst01')?.value,
      travelHistory: currentCase.investigation.dataValues.find(dv => dv.id === 'DeTravHst01')?.value
    });
    
    // 5. 刷新页面数据
    await refreshCaseData();
    showSuccessToast('推送成功');
    
  } catch (error) {
    console.error('Push failed:', error);
    showErrorToast('推送失败: ' + error.message);
  }
};
```

#### 3.2.7 结案操作实现

**结案逻辑：**

```javascript
// 点击"结案"按钮
const handleCloseCase = async () => {
  try {
    // 1. 检查前置条件
    const hasActiveFollowUps = currentCase.followUps.some(f => f.status === 'ACTIVE');
    if (hasActiveFollowUps) {
      const confirmed = await showConfirmDialog({
        title: '存在未完成的随访',
        message: '该个案还有未完成的随访记录，确认结案？'
      });
      if (!confirmed) return;
    }
    
    // 2. 输入结案原因
    const closeReason = await showPromptDialog({
      title: '结案原因',
      message: '请输入结案原因（选填）：',
      inputType: 'textarea'
    });
    
    // 3. 更新个案调查 Event 的状态
    const investigationEventId = currentCase.investigation.id;
    await dhis2Api.put(`/api/events/${investigationEventId}`, {
      dataValues: [
        { dataElement: 'DeCaseStat1', value: 'CLOSED' }
      ]
    });
    
    // 4. 更新 Enrollment 状态（可选：设为 COMPLETED）
    // 注意：COMPLETED 状态会阻止后续操作，需谨慎
    await dhis2Api.put(`/api/enrollments/${currentCase.enrollment.id}`, {
      status: 'COMPLETED',
      completedDate: new Date().toISOString().split('T')[0]
    });
    
    // 5. 记录结案日志（可选：使用 DataStore）
    await dhis2Api.post(`/api/dataStore/caseCloseLogs/${currentTeiId}`, {
      closedBy: currentUser.id,
      closedAt: new Date().toISOString(),
      reason: closeReason
    });
    
    // 6. 刷新页面并跳转回列表
    showSuccessToast('结案成功');
    navigate('/case/list');
    
  } catch (error) {
    console.error('Close case failed:', error);
    showErrorToast('结案失败: ' + error.message);
  }
};
```

#### 3.2.8 操作日志实现

**数据变更审计（API-09）：**

```javascript
// 获取指定Data Element的变更历史
const fetchDataValueAudit = async (dataElement, programStage) => {
  const params = {
    de: dataElement,
    ps: programStage,
    ou: currentOrgUnit,
    startDate: '2024-01-01',
    endDate: '2024-12-31',
    auditType: 'UPDATE' // CREATE, UPDATE, DELETE
  };
  
  const url = `/api/dataValueAudit?${new URLSearchParams(params)}`;
  const response = await dhis2Api.get(url);
  
  return response.dataValueAudits.map(audit => ({
    timestamp: audit.created,
    user: audit.modifiedBy,
    field: audit.dataElement,
    oldValue: audit.previousValue,
    newValue: audit.value,
    auditType: audit.auditType
  }));
};
```

**TEI级别审计（API-10）：**

```javascript
// 获取TEI的创建、更新、删除记录
const fetchTEIAudit = async (teiId) => {
  const url = `/api/trackedEntityInstances/${teiId}/audit`;
  const response = await dhis2Api.get(url);
  
  return response.trackedEntityInstanceAudits.map(audit => ({
    timestamp: audit.created,
    user: audit.accessedBy,
    action: audit.auditType, // CREATE, UPDATE, DELETE, SEARCH
    details: audit.value
  }));
};
```

**操作日志Tab展示：**

```javascript
// 合并所有审计日志并按时间排序
const loadAuditLogs = async () => {
  const [dataValueAudits, teiAudits] = await Promise.all([
    fetchDataValueAudit('DeCaseStat1', 'PsInvestig1'),
    fetchDataValueAudit('DeHlthStat1', 'PsFollowUp1'),
    // ... 其他关键字段
    fetchTEIAudit(currentTeiId)
  ]);
  
  const allLogs = [
    ...dataValueAudits,
    ...teiAudits
  ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  
  return allLogs;
};
```

#### 3.2.9 附件上传与下载

**上传实验室报告PDF：**

```javascript
// 在检测记录中上传实验室报告
const handleUploadLabReport = async (eventId, file) => {
  try {
    // 1. 上传文件到 DHIS2 FileResources
    const formData = new FormData();
    formData.append('file', file);
    
    const uploadResponse = await fetch('/api/fileResources', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${dhis2Token}`
      },
      body: formData
    });
    
    const uploadResult = await uploadResponse.json();
    const fileResourceId = uploadResult.response.fileResource.id;
    
    // 2. 更新 Event 的 DeLabRptUrl 字段
    await dhis2Api.put(`/api/events/${eventId}`, {
      dataValues: [
        { 
          dataElement: 'DeLabRptUrl', 
          value: `/api/fileResources/${fileResourceId}/data` 
        }
      ]
    });
    
    await refreshCaseData();
    showSuccessToast('上传成功');
    
  } catch (error) {
    console.error('Upload failed:', error);
    showErrorToast('上传失败: ' + error.message);
  }
};
```

**下载实验室报告：**

```javascript
  // 点击"查看报告"按钮
const handleDownloadLabReport = async (fileUrl) => {
  try {
    const response = await fetch(fileUrl, {
      headers: {
        'Authorization': `Bearer ${dhis2Token}`
      }
    });
    
    const blob = await response.blob();
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `实验室报告_${currentCase.tei.caseNumber}.pdf`;
    link.click();
    
  } catch (error) {
    console.error('Download failed:', error);
    showErrorToast('下载失败: ' + error.message);
  }
};
```

### 3.3 性能优化策略

1. **数据预加载：** Program元数据和选项集在应用启动时加载并缓存
2. **懒加载Tab：** 仅加载当前激活Tab的数据，其他Tab延迟加载
3. **虚拟滚动：** 随访/治疗/检测/追踪记录超过20条时使用虚拟滚动
4. **防抖保存：** 表单自动保存使用防抖（3秒无操作后保存）
5. **乐观更新：** 保存数据时先更新UI，失败后回滚

### 3.4 数据一致性保证

```javascript
// 使用版本号防止并发修改冲突
const updateEventWithVersionCheck = async (eventId, updates, expectedVersion) => {
  try {
    const response = await dhis2Api.put(`/api/events/${eventId}`, {
      ...updates,
      lastUpdated: expectedVersion // DHIS2 会验证版本
    });
    
    return response;
  } catch (error) {
    if (error.status === 409) { // Conflict
      showErrorModal({
        title: '数据冲突',
        message: '该记录已被其他用户修改，请刷新后重试',
        actions: [
          { label: '刷新页面', action: () => refreshCaseData() },
          { label: '取消', action: () => {} }
        ]
      });
    }
    throw error;
  }
};
```

------

## 4. Example Request & Response

### API-01: 获取个案完整信息

**请求地址**

```
GET http://[基地址]/api/trackedEntityInstances/TEI123456?fields=*,attributes[attribute,value,displayName,valueType],enrollments[*,attributes[attribute,value,displayName],events[*,dataValues[dataElement,value]]]&program=PrgCaseMgt1
```

**返回消息体**

```json
{
  "trackedEntityInstance": "TEI123456",
  "trackedEntityType": "TetPerson01",
  "orgUnit": "OuWuhou0001",
  "created": "2024-01-15T10:30:00.000",
  "lastUpdated": "2024-01-20T14:20:00.000",
  "inactive": false,
  "deleted": false,
  "attributes": [
    {
      "attribute": "AtrFullNm01",
      "value": "张三",
      "displayName": "姓名",
      "valueType": "TEXT"
    },
    {
      "attribute": "AtrNatnlId1",
      "value": "110101197901011234",
      "displayName": "身份证号",
      "valueType": "TEXT"
    },
    {
      "attribute": "AtrGender01",
      "value": "MALE",
      "displayName": "性别",
      "valueType": "TEXT"
    },
    {
      "attribute": "AtrAge00001",
      "value": "45",
      "displayName": "年龄",
      "valueType": "INTEGER"
    },
    {
      "attribute": "AtrPhone001",
      "value": "13800138000",
      "displayName": "联系电话",
      "valueType": "PHONE_NUMBER"
    },
    {
      "attribute": "AtrAddr0001",
      "value": "北京市朝阳区XX街道XX小区XX号楼XX单元",
      "displayName": "住址",
      "valueType": "LONG_TEXT"
    }
  ],
  "enrollments": [
    {
      "enrollment": "ENROLLMENT_789",
      "created": "2024-01-15T10:30:00.000",
      "lastUpdated": "2024-01-20T14:20:00.000",
      "program": "PrgCaseMgt1",
      "orgUnit": "OuWuhou0001",
      "enrollmentDate": "2024-01-15",
      "incidentDate": "2024-01-10",
      "status": "ACTIVE",
      "followup": false,
      "deleted": false,
      "attributes": [
        {
          "attribute": "AtrCaseNo01",
          "value": "CASE-20240115-0001",
          "displayName": "个案编号"
        },
        {
          "attribute": "AtrDiseaCd1",
          "value": "B03",
          "displayName": "疾病编码"
        },
        {
          "attribute": "AtrRptOrg01",
          "value": "OuWuhou0001",
          "displayName": "报告机构"
        },
        {
          "attribute": "AtrRptDt001",
          "value": "2024-01-15",
          "displayName": "报告日期"
        },
        {
          "attribute": "AtrSymptDt1",
          "value": "2024-01-10",
          "displayName": "症状起始日期"
        },
        {
          "attribute": "AtrDiagDt01",
          "value": "2024-01-14",
          "displayName": "诊断日期"
        },
        {
          "attribute": "AtrCaseSrc1",
          "value": "ACTIVE_SURVEILLANCE",
          "displayName": "个案来源"
        }
      ],
      "events": [
        {
          "event": "EVENT_456",
          "programStage": "PsInvestig1",
          "program": "PrgCaseMgt1",
          "enrollment": "ENROLLMENT_789",
          "trackedEntityInstance": "TEI123456",
          "orgUnit": "OuWuhou0001",
          "eventDate": "2024-01-15",
          "status": "ACTIVE",
          "created": "2024-01-15T10:35:00.000",
          "lastUpdated": "2024-01-18T09:20:00.000",
          "deleted": false,
          "dataValues": [
            {
              "dataElement": "DeInitDiag1",
              "value": "疑似新冠肺炎"
            },
            {
              "dataElement": "DeConfDiag1",
              "value": "新冠肺炎（待核实）"
            },
            {
              "dataElement": "DeCaseStat1",
              "value": "IN_PROGRESS"
            },
            {
              "dataElement": "DeExposHst1",
              "value": "近14天内有疫区旅居史，曾前往XX市XX区"
            },
            {
              "dataElement": "DeContHst01",
              "value": "与确诊病例有密切接触史，接触时间2024-01-08"
            },
            {
              "dataElement": "DeTravHst01",
              "value": "2024-01-01至01-07期间前往XX省XX市"
            },
            {
              "dataElement": "DePushEpi01",
              "value": "false"
            }
          ]
        },
        {
          "event": "EVENT_501",
          "programStage": "PsFollowUp1",
          "eventDate": "2024-01-16",
          "status": "ACTIVE",
          "created": "2024-01-16T14:20:00.000",
          "lastUpdated": "2024-01-16T14:20:00.000",
          "dataValues": [
            {
              "dataElement": "DeFlwUpMthd",
              "value": "PHONE"
            },
            {
              "dataElement": "DeHlthStat1",
              "value": "NORMAL"
            },
            {
              "dataElement": "DeTemp00001",
              "value": "36.8"
            },
            {
              "dataElement": "DeSymptoms1",
              "value": "咳嗽减轻，无发热"
            },
            {
              "dataElement": "DeTrtCompl1",
              "value": "GOOD"
            },
            {
              "dataElement": "DeNxtFlwDt1",
              "value": "2024-01-18"
            },
            {
              "dataElement": "DeRemarks01",
              "value": "患者状况良好，继续居家隔离"
            }
          ]
        },
        {
          "event": "EVENT_502",
          "programStage": "PsFollowUp1",
          "eventDate": "2024-01-18",
          "status": "ACTIVE",
          "created": "2024-01-18T15:10:00.000",
          "lastUpdated": "2024-01-18T15:10:00.000",
          "dataValues": [
            {
              "dataElement": "DeFlwUpMthd",
              "value": "PHONE"
            },
            {
              "dataElement": "DeHlthStat1",
              "value": "NORMAL"
            },
            {
              "dataElement": "DeTemp00001",
              "value": "36.5"
            },
            {
              "dataElement": "DeSymptoms1",
              "value": "症状基本消失"
            },
            {
              "dataElement": "DeTrtCompl1",
              "value": "GOOD"
            },
            {
              "dataElement": "DeNxtFlwDt1",
              "value": "2024-01-20"
            }
          ]
        },
        {
          "event": "EVENT_601",
          "programStage": "PsTreatmnt1",
          "eventDate": "2024-01-15",
          "status": "ACTIVE",
          "created": "2024-01-15T11:00:00.000",
          "lastUpdated": "2024-01-15T11:00:00.000",
          "dataValues": [
            {
              "dataElement": "DeTrtType01",
              "value": "HOME_ISOLATION"
            },
            {
              "dataElement": "DeHospNm001",
              "value": "北京市朝阳区人民医院"
            },
            {
              "dataElement": "DeDeptNm001",
              "value": "呼吸内科"
            },
            {
              "dataElement": "DeDocNm0001",
              "value": "李医生"
            },
            {
              "dataElement": "DeDiagnos01",
              "value": "新冠肺炎（轻症）"
            },
            {
              "dataElement": "DeTrtPlan01",
              "value": "居家隔离观察，对症治疗"
            },
            {
              "dataElement": "DeMedicat01",
              "value": "抗病毒药物、退热药"
            },
            {
              "dataElement": "DeTrtOutcm1",
              "value": "IMPROVED"
            }
          ]
        },
        {
          "event": "EVENT_701",
          "programStage": "PsTest00001",
          "eventDate": "2024-01-14",
          "status": "ACTIVE",
          "created": "2024-01-14T09:30:00.000",
          "lastUpdated": "2024-01-15T10:00:00.000",
          "dataValues": [
            {
              "dataElement": "DeTestNo001",
              "value": "TEST-20240114-0089"
            },
            {
              "dataElement": "DeSmplColDt",
              "value": "2024-01-14"
            },
            {
              "dataElement": "DeSmplType1",
              "value": "THROAT_SWAB"
            },
            {
              "dataElement": "DeTestType1",
              "value": "NAT"
            },
            {
              "dataElement": "DeTestOrg01",
              "value": "北京市疾控中心实验室"
            },
            {
              "dataElement": "DeTestDt001",
              "value": "2024-01-14"
            },
            {
              "dataElement": "DeTestRslt1",
              "value": "POSITIVE"
            },
            {
              "dataElement": "DeRsltDtl01",
              "value": "SARS-CoV-2核酸检测阳性，Ct值28"
            },
            {
              "dataElement": "DePathogen1",
              "value": "V103"
            },
            {
              "dataElement": "DeTestStat1",
              "value": "CONFIRMED"
            },
            {
              "dataElement": "DePushLab01",
              "value": "true"
            },
            {
              "dataElement": "DePushLabDt",
              "value": "2024-01-14T15:30:00.000"
            },
            {
              "dataElement": "DeLabRptUrl",
              "value": "/api/fileResources/FILE_12345/data"
            }
          ]
        },
        {
          "event": "EVENT_801",
          "programStage": "PsTracking1",
          "eventDate": "2024-01-16",
          "status": "ACTIVE",
          "created": "2024-01-16T10:00:00.000",
          "lastUpdated": "2024-01-16T10:00:00.000",
          "dataValues": [
            {
              "dataElement": "DeTrackTp01",
              "value": "TRAVEL_HISTORY"
            },
            {
              "dataElement": "DeStartDt01",
              "value": "2024-01-01"
            },
            {
              "dataElement": "DeEndDt0001",
              "value": "2024-01-07"
            },
            {
              "dataElement": "DeLocDesc01",
              "value": "XX省XX市XX区"
            },
            {
              "dataElement": "DeRelRgn001",
              "value": "OuXXProvince"
            },
            {
              "dataElement": "DeExpDtl001",
              "value": "乘坐高铁前往，住宿XX酒店"
            },
            {
              "dataElement": "DeRiskAsmt1",
              "value": "HIGH"
            },
            {
              "dataElement": "DeTrkPshEpi",
              "value": "true"
            },
            {
              "dataElement": "DeTrkPshDt1",
              "value": "2024-01-16T11:00:00.000"
            }
          ]
        }
      ]
    }
  ]
}
```

------

### API-02: 获取Program元数据

**请求地址**

```
GET http://[基地址]/api/programs/PrgCaseMgt1/metadata?fields=id,name,programTrackedEntityAttributes[id,trackedEntityAttribute[id,name,shortName,valueType,optionSet[id]]],programStages[id,name,sortOrder,programStageDataElements[id,compulsory,dataElement[id,name,shortName,valueType,optionSet[id]]]]
```

**返回消息体**

```json
{
  "programs": [
    {
      "id": "PrgCaseMgt1",
      "name": "已知疾病个案管理",
      "programTrackedEntityAttributes": [
        {
          "id": "PteaCaseNo1",
          "trackedEntityAttribute": {
            "id": "AtrCaseNo01",
            "name": "个案编号",
            "shortName": "个案编号",
            "valueType": "TEXT"
          }
        },
        {
          "id": "PteaDiseCd1",
          "trackedEntityAttribute": {
            "id": "AtrDiseaCd1",
            "name": "疾病编码",
            "shortName": "疾病",
            "valueType": "TEXT",
            "optionSet": {
              "id": "OsDiseasCd1"
            }
          }
        }
        // ... 其他属性
      ],
      "programStages": [
        {
          "id": "PsInvestig1",
          "name": "个案调查",
          "sortOrder": 1,
          "programStageDataElements": [
            {
              "id": "PsdeInitDg1",
              "compulsory": false,
              "dataElement": {
                "id": "DeInitDiag1",
                "name": "初步诊断",
                "shortName": "初步诊断",
                "valueType": "LONG_TEXT"
              }
            },
            {
              "id": "PsdeCseSt01",
              "compulsory": true,
              "dataElement": {
                "id": "DeCaseStat1",
                "name": "个案状态",
                "shortName": "个案状态",
                "valueType": "TEXT",
                "optionSet": {
                  "id": "OsCaseStat1"
                }
              }
            }
            // ... 其他Data Elements
          ]
        },
        {
          "id": "PsFollowUp1",
          "name": "随访记录",
          "sortOrder": 2,
          "programStageDataElements": [
            // ...
          ]
        }
        // ... 其他Stages
      ]
    }
  ]
}
```

------

### API-03: 批量获取选项集

**请求地址**

```
GET http://[基地址]/api/optionSets?fields=id,name,options[id,code,name,sortOrder]&filter=id:in:[OsGender001,OsDiseasCd1,OsCaseStat1,OsFlwUpMthd,OsHlthStat1,OsTrtCompl1,OsTrtType01,OsTrtOutcm1,OsSampleTp1,OsTestType1,OsTestRslt1,OsTestStat1,OsTrackTp01,OsRiskAsmt1]&paging=false
```

**返回消息体**

```json
{
  "optionSets": [
    {
      "id": "OsGender001",
      "name": "性别",
      "options": [
        { "id": "OptMale0001", "code": "MALE", "name": "男", "sortOrder": 1 },
        { "id": "OptFemale01", "code": "FEMALE", "name": "女", "sortOrder": 2 },
        { "id": "OptUnknown1", "code": "UNKNOWN", "name": "未知", "sortOrder": 3 }
      ]
    },
    {
      "id": "OsDiseasCd1",
      "name": "疾病编码",
      "options": [
        { "id": "OptDiseaA10", "code": "A01", "name": "鼠疫", "sortOrder": 1 },
        { "id": "OptDiseaA20", "code": "A02", "name": "霍乱", "sortOrder": 2 },
        { "id": "OptDiseaB30", "code": "B03", "name": "新型冠状病毒肺炎(COVID-19)", "sortOrder": 11 }
      ]
    },
    {
      "id": "OsCaseStat1",
      "name": "个案状态",
      "options": [
        { "id": "OptNew00001", "code": "NEW", "name": "新建", "sortOrder": 1 },
        { "id": "OptVerifid1", "code": "VERIFIED", "name": "已核实", "sortOrder": 2 },
        { "id": "OptInProg10", "code": "IN_PROGRESS", "name": "处理中", "sortOrder": 3 },
        { "id": "OptClosed01", "code": "CLOSED", "name": "已关闭", "sortOrder": 4 }
      ]
    },
    {
      "id": "OsHlthStat1",
      "name": "健康状态",
      "options": [
        { "id": "OptNormal01", "code": "NORMAL", "name": "正常", "sortOrder": 1 },
        { "id": "OptAbnorml1", "code": "ABNORMAL", "name": "异常", "sortOrder": 2 },
        { "id": "OptHospitl1", "code": "HOSPITALIZED", "name": "住院", "sortOrder": 3 },
        { "id": "OptDeath001", "code": "DEATH", "name": "死亡", "sortOrder": 4 }
      ]
    }
    // ... 其他选项集
  ]
}
```

------

### API-04: 创建新的随访记录Event

**请求地址**

```
POST http://[基地址]/api/events
Content-Type: application/json
```

**请求消息体**

```json
{
  "program": "PrgCaseMgt1",
  "programStage": "PsFollowUp1",
  "enrollment": "ENROLLMENT_789",
  "orgUnit": "OuWuhou0001",
  "eventDate": "2024-01-20",
  "status": "ACTIVE",
  "trackedEntityInstance": "TEI123456",
  "dataValues": [
    {
      "dataElement": "DeFlwUpMthd",
      "value": "PHONE"
    },
    {
      "dataElement": "DeHlthStat1",
      "value": "NORMAL"
    },
    {
      "dataElement": "DeTemp00001",
      "value": "36.6"
    },
    {
      "dataElement": "DeSymptoms1",
      "value": "症状完全消失，体征正常"
    },
    {
      "dataElement": "DeTrtCompl1",
      "value": "GOOD"
    },
    {
      "dataElement": "DeNxtFlwDt1",
      "value": "2024-01-22"
    },
    {
      "dataElement": "DeRemarks01",
      "value": "患者恢复良好，建议继续观察2天"
    }
  ]
}
```

**返回消息体**

```json
{
  "httpStatus": "OK",
  "httpStatusCode": 200,
  "status": "SUCCESS",
  "response": {
    "responseType": "ImportSummaries",
    "status": "SUCCESS",
    "imported": 1,
    "updated": 0,
    "deleted": 0,
    "ignored": 0,
    "importSummaries": [
      {
        "responseType": "ImportSummary",
        "status": "SUCCESS",
        "importCount": {
          "imported": 1,
          "updated": 0,
          "ignored": 0,
          "deleted": 0
        },
        "reference": "EVENT_NEW_503",
        "href": "http://[基地址]/api/events/EVENT_NEW_503"
      }
    ]
  }
}
```

------

### API-05: 更新检测记录Event（标记为已推送）

**请求地址**

```
PUT http://[基地址]/api/events/EVENT_701
Content-Type: application/json
```

**请求消息体**

```json
{
  "event": "EVENT_701",
  "dataValues": [
    {
      "dataElement": "DePushLab01",
      "value": "true"
    },
    {
      "dataElement": "DePushLabDt",
      "value": "2024-01-14T15:30:00.000"
    }
  ]
}
```

**返回消息体**

```json
{
  "httpStatus": "OK",
  "httpStatusCode": 200,
  "status": "SUCCESS",
  "response": {
    "responseType": "ImportSummaries",
    "status": "SUCCESS",
    "imported": 0,
    "updated": 1,
    "deleted": 0,
    "ignored": 0,
    "importSummaries": [
      {
        "responseType": "ImportSummary",
        "status": "SUCCESS",
        "reference": "EVENT_701"
      }
    ]
  }
}
```

------

### API-06: 删除随访记录Event

**请求地址**

```
DELETE http://[基地址]/api/events/EVENT_502
```

**返回消息体**

```json
{
  "httpStatus": "OK",
  "httpStatusCode": 200,
  "status": "OK",
  "message": "Event deleted successfully"
}
```

------

### API-07: 更新TEI和Enrollment属性

**请求地址**

```
PUT http://[基地址]/api/trackedEntityInstances/TEI123456
Content-Type: application/json
```

**请求消息体**

```json
{
  "trackedEntityInstance": "TEI123456",
  "orgUnit": "OuWuhou0001",
  "attributes": [
    {
      "attribute": "AtrPhone001",
      "value": "13900139000"
    },
    {
      "attribute": "AtrAddr0001",
      "value": "北京市朝阳区XX街道XX小区XX号楼XX单元（已更新）"
    }
  ],
  "enrollments": [
    {
      "enrollment": "ENROLLMENT_789",
      "attributes": [
        {
          "attribute": "AtrDiagDt01",
          "value": "2024-01-15"
        }
      ]
    }
  ]
}
```

**返回消息体**

```json
{
  "httpStatus": "OK",
  "httpStatusCode": 200,
  "status": "SUCCESS",
  "response": {
    "responseType": "ImportSummaries",
    "status": "SUCCESS",
    "imported": 0,
    "updated": 1,
    "deleted": 0,
    "ignored": 0,
    "importSummaries": [
      {
        "responseType": "ImportSummary",
        "status": "SUCCESS",
        "reference": "TEI123456"
      }
    ]
  }
}
```

------

### API-08: 更新Enrollment状态（结案）

**请求地址**

```
PUT http://[基地址]/api/enrollments/ENROLLMENT_789
Content-Type: application/json
```

**请求消息体**

```json
{
  "enrollment": "ENROLLMENT_789",
  "status": "COMPLETED",
  "completedDate": "2024-01-20"
}
```

**返回消息体**

```json
{
  "httpStatus": "OK",
  "httpStatusCode": 200,
  "status": "SUCCESS",
  "response": {
    "responseType": "ImportSummaries",
    "status": "SUCCESS",
    "imported": 0,
    "updated": 1,
    "deleted": 0,
    "ignored": 0,
    "importSummaries": [
      {
        "responseType": "ImportSummary",
        "status": "SUCCESS",
        "reference": "ENROLLMENT_789"
      }
    ]
  }
}
```

------

### API-09: 获取数据变更审计日志

**请求地址**

```
GET http://[基地址]/api/dataValueAudit?de=DeCaseStat1&ps=PsInvestig1&ou=OuWuhou0001&startDate=2024-01-01&endDate=2024-12-31&auditType=UPDATE
```

**返回消息体**

```json
{
  "pager": {
    "page": 1,
    "pageSize": 50,
    "total": 3
  },
  "dataValueAudits": [
    {
      "dataElement": "DeCaseStat1",
      "period": "",
      "orgUnit": "OuWuhou0001",
      "categoryOptionCombo": "",
      "attributeOptionCombo": "",
      "value": "IN_PROGRESS",
      "previousValue": "VERIFIED",
      "modifiedBy": "wuhou_cdc_001",
      "created": "2024-01-16T09:00:00.000",
      "auditType": "UPDATE"
    },
    {
      "dataElement": "DeCaseStat1",
      "period": "",
      "orgUnit": "OuWuhou0001",
      "categoryOptionCombo": "",
      "attributeOptionCombo": "",
      "value": "VERIFIED",
      "previousValue": "NEW",
      "modifiedBy": "wuhou_cdc_001",
      "created": "2024-01-15T15:30:00.000",
      "auditType": "UPDATE"
    },
    {
      "dataElement": "DeCaseStat1",
      "period": "",
      "orgUnit": "OuWuhou0001",
      "categoryOptionCombo": "",
      "attributeOptionCombo": "",
      "value": "NEW",
      "previousValue": "",
      "modifiedBy": "wuhou_cdc_001",
      "created": "2024-01-15T10:35:00.000",
      "auditType": "CREATE"
    }
  ]
}
```

------

### API-10: 获取TEI审计日志

**请求地址**

```
GET http://[基地址]/api/trackedEntityInstances/TEI123456/audit
```

**返回消息体**

```json
{
  "trackedEntityInstanceAudits": [
    {
      "trackedEntityInstance": "TEI123456",
      "created": "2024-01-20T14:20:00.000",
      "accessedBy": "wuhou_cdc_001",
      "auditType": "UPDATE",
      "value": "Updated phone number and address"
    },
    {
      "trackedEntityInstance": "TEI123456",
      "created": "2024-01-18T09:20:00.000",
      "accessedBy": "wuhou_cdc_001",
      "auditType": "SEARCH",
      "value": "Accessed via search"
    },
    {
      "trackedEntityInstance": "TEI123456",
      "created": "2024-01-15T10:30:00.000",
      "accessedBy": "wuhou_cdc_001",
      "auditType": "CREATE",
      "value": "Created new tracked entity instance"
    }
  ]}
```

# 

### API-11: 上传实验室报告附件

**请求地址**
```

POST http://[基地址]/api/fileResources Content-Type: multipart/form-data

```
**请求消息体**
```

------WebKitFormBoundary7MA4YWxkTrZu0gW Content-Disposition: form-data; name="file"; filename="lab_report_TEST-20240114-0089.pdf" Content-Type: application/pdf

[Binary PDF Data] ------WebKitFormBoundary7MA4YWxkTrZu0gW--

```
**返回消息体**
```json
{
  "httpStatus": "OK",
  "httpStatusCode": 200,
  "status": "OK",
  "response": {
    "responseType": "FileResource",
    "fileResource": {
      "id": "FILE_12345",
      "name": "lab_report_TEST-20240114-0089.pdf",
      "created": "2024-01-14T15:25:00.000",
      "lastUpdated": "2024-01-14T15:25:00.000",
      "contentType": "application/pdf",
      "contentLength": 245678,
      "contentMd5": "d41d8cd98f00b204e9800998ecf8427e",
      "storageStatus": "STORED"
    }
  }
}
```

**后续操作：更新Event的DeLabRptUrl字段**

```json
PUT /api/events/EVENT_701
{
  "event": "EVENT_701",
  "dataValues": [
    {
      "dataElement": "DeLabRptUrl",
      "value": "/api/fileResources/FILE_12345/data"
    }
  ]
}
```

------

### API-12: 下载实验室报告附件

**请求地址**

```
GET http://[基地址]/api/fileResources/FILE_12345/data
Authorization: Bearer {access_token}
```

**返回消息体**

```
HTTP/1.1 200 OK
Content-Type: application/pdf
Content-Disposition: attachment; filename="lab_report_TEST-20240114-0089.pdf"
Content-Length: 245678

[Binary PDF Data]
```

------

## 5. Error Handling

### 5.1 TEI不存在或无权限访问

**API-01 返回：**

```json
{
  "httpStatus": "Not Found",
  "httpStatusCode": 404,
  "status": "ERROR",
  "message": "TrackedEntityInstance with id 'TEI123456' could not be found."
}
```

**前端处理：**

```javascript
if (response.status === 404) {
  showErrorPage({
    title: '个案不存在',
    message: '该个案可能已被删除或您没有访问权限',
    actions: [
      { label: '返回列表', action: () => navigate('/case/list') }
    ]
  });
}
```

### 5.2 并发修改冲突

**API-05 返回：**

```json
{
  "httpStatus": "Conflict",
  "httpStatusCode": 409,
  "status": "ERROR",
  "message": "Event was updated since last read. Please refresh and try again.",
  "response": {
    "conflicts": [
      {
        "object": "EVENT_701",
        "value": "Event has been modified by another user"
      }
    ]
  }
}
```

**前端处理：**

```javascript
if (response.status === 409) {
  showConfirmDialog({
    title: '数据冲突',
    message: '该记录已被其他用户修改，是否刷新页面重新加载？',
    actions: [
      { label: '刷新', action: () => refreshCaseData() },
      { label: '取消', action: () => {} }
    ]
  });
}
```

### 5.3 Program Rules验证失败

**API-04 返回（创建随访记录时体温超出范围）：**

```json
{
  "httpStatus": "OK",
  "httpStatusCode": 200,
  "status": "WARNING",
  "response": {
    "responseType": "ImportSummaries",
    "status": "WARNING",
    "imported": 1,
    "conflicts": [
      {
        "object": "DeTemp00001",
        "value": "体温超出正常范围(35-42℃)，请检查数据是否正确"
      }
    ],
    "importSummaries": [
      {
        "responseType": "ImportSummary",
        "status": "SUCCESS",
        "reference": "EVENT_NEW_504"
      }
    ]
  }
}
```

**前端处理：**

```javascript
if (response.status === 'WARNING' && response.response.conflicts) {
  showWarningModal({
    title: '数据验证警告',
    message: response.response.conflicts.map(c => c.value).join('\n'),
    actions: [
      { label: '我知道了', action: () => refreshCaseData() }
    ]
  });
}
```

### 5.4 必填字段缺失

**API-04 返回：**

```json
{
  "httpStatus": "Conflict",
  "httpStatusCode": 409,
  "status": "ERROR",
  "message": "DataElement 'DeHlthStat1' is mandatory but no value was found.",
  "response": {
    "conflicts": [
      {
        "object": "DeHlthStat1",
        "value": "DataElement is mandatory"
      }
    ]
  }
}
```

**前端处理：**

```javascript
// 在提交前进行客户端验证
const validateFollowUpForm = (formData) => {
  const errors = [];
  
  if (!formData.followUpMethod) {
    errors.push({ field: 'followUpMethod', message: '随访方式为必填项' });
  }
  
  if (!formData.healthStatus) {
    errors.push({ field: 'healthStatus', message: '健康状态为必填项' });
  }
  
  // ... 其他必填字段验证
  
  return errors;
};

// 提交前验证
const handleSubmit = async () => {
  const errors = validateFollowUpForm(formData);
  if (errors.length > 0) {
    highlightErrorFields(errors);
    showErrorToast('请填写所有必填字段');
    return;
  }
  
  await submitFollowUp(formData);
};
```

### 5.5 文件上传失败

**API-11 返回：**

```json
{
  "httpStatus": "Bad Request",
  "httpStatusCode": 400,
  "status": "ERROR",
  "message": "File size exceeds maximum allowed size of 10MB"
}
```

**前端处理：**

```javascript
const handleFileUpload = async (file) => {
  // 客户端验证
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    showErrorToast('文件大小不能超过10MB');
    return;
  }
  
  const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
  if (!allowedTypes.includes(file.type)) {
    showErrorToast('仅支持PDF、JPG、PNG格式');
    return;
  }
  
  try {
    const result = await uploadFile(file);
    showSuccessToast('上传成功');
  } catch (error) {
    showErrorToast('上传失败: ' + error.message);
  }
};
```

------

## 6. UI State Management

### 6.1 页面状态定义

```javascript
const [pageState, setPageState] = useState({
  loading: true,
  mode: 'view', // 'view' | 'edit'
  activeTab: 'basic', // 'basic' | 'epi' | 'followup' | 'treatment' | 'test' | 'tracking' | 'audit'
  data: null,
  metadata: null,
  optionSets: null,
  error: null
});
```

### 6.2 编辑状态管理

```javascript
const [editState, setEditState] = useState({
  editing: false,
  editingTab: null,
  formData: {},
  originalData: {},
  hasChanges: false,
  validationErrors: []
});

// 开始编辑
const startEdit = (tab) => {
  setEditState({
    editing: true,
    editingTab: tab,
    formData: cloneDeep(getCurrentTabData(tab)),
    originalData: cloneDeep(getCurrentTabData(tab)),
    hasChanges: false,
    validationErrors: []
  });
};

// 取消编辑
const cancelEdit = () => {
  if (editState.hasChanges) {
    showConfirmDialog({
      title: '放弃修改',
      message: '是否放弃当前修改？',
      actions: [
        { label: '放弃', action: () => resetEditState() },
        { label: '继续编辑', action: () => {} }
      ]
    });
  } else {
    resetEditState();
  }
};

// 保存编辑
const saveEdit = async () => {
  const errors = validateFormData(editState.formData);
  if (errors.length > 0) {
    setEditState(prev => ({ ...prev, validationErrors: errors }));
    return;
  }
  
  try {
    await updateCaseData(editState.editingTab, editState.formData);
    await refreshCaseData();
    resetEditState();
    showSuccessToast('保存成功');
  } catch (error) {
    showErrorToast('保存失败: ' + error.message);
  }
};
```

### 6.3 子记录管理状态

```javascript
const [subRecordState, setSubRecordState] = useState({
  modalOpen: false,
  modalType: null, // 'followup' | 'treatment' | 'test' | 'tracking'
  modalMode: 'create', // 'create' | 'edit' | 'view'
  currentRecord: null,
  formData: {}
});

// 打开新增随访模态框
const openAddFollowUpModal = () => {
  setSubRecordState({
    modalOpen: true,
    modalType: 'followup',
    modalMode: 'create',
    currentRecord: null,
    formData: getDefaultFollowUpData()
  });
};

// 打开编辑随访模态框
const openEditFollowUpModal = (record) => {
  setSubRecordState({
    modalOpen: true,
    modalType: 'followup',
    modalMode: 'edit',
    currentRecord: record,
    formData: cloneDeep(record)
  });
};
```

------

## 7. Component Structure

### 7.1 页面组件层级

```
CaseDetailPage
├── CaseHeader (个案摘要 + 操作按钮)
│   ├── CaseSummary
│   └── ActionButtons
│       ├── EditButton
│       ├── PushToEpiButton
│       ├── CloseCaseButton
│       └── BackButton
├── CaseTabNavigation (Tab导航)
└── CaseTabContent (Tab内容)
    ├── BasicInfoTab (基本信息)
    │   ├── PatientInfoSection
    │   ├── ReportInfoSection
    │   └── DiagnosisInfoSection
    ├── EpidemiologyTab (流行病学信息)
    │   ├── ExposureHistorySection
    │   ├── ContactHistorySection
    │   └── TravelHistorySection
    ├── FollowUpTab (随访记录)
    │   ├── AddFollowUpButton
    │   ├── FollowUpTimeline
    │   │   └── FollowUpCard[] (可展开/折叠/编辑/删除)
    │   └── FollowUpModal (新增/编辑模态框)
    ├── TreatmentTab (治疗记录)
    │   ├── AddTreatmentButton
    │   ├── TreatmentTimeline
    │   │   └── TreatmentCard[]
    │   └── TreatmentModal
    ├── TestTab (检测记录)
    │   ├── AddTestButton
    │   ├── TestTimeline
    │   │   └── TestCard[] (带推送状态标识)
    │   └── TestModal
    ├── TrackingTab (追踪记录)
    │   ├── AddTrackingButton
    │   ├── TrackingTimeline
    │   │   └── TrackingCard[]
    │   ├── TrackingMap (地图可视化)
    │   └── TrackingModal
    └── AuditTab (操作日志)
        ├── AuditFilters
        └── AuditTable
```

### 7.2 关键组件示例

#### CaseHeader 组件

```javascript
const CaseHeader = ({ caseData, onEdit, onPushToEpi, onCloseCase, onBack }) => {
  const statusColors = {
    'NEW': 'bg-yellow-100 text-yellow-800',
    'VERIFIED': 'bg-blue-100 text-blue-800',
    'IN_PROGRESS': 'bg-indigo-100 text-indigo-800',
    'CLOSED': 'bg-green-100 text-green-800'
  };
  
  return (
    <div className="bg-white shadow rounded-lg p-6 mb-6">
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-4 mb-2">
            <h1 className="text-2xl font-bold">
              {caseData.tei.attributes.caseNumber}
            </h1>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[caseData.investigation.caseStatus]}`}>
              {getCaseStatusName(caseData.investigation.caseStatus)}
            </span>
          </div>
          
          <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm text-gray-600">
            <div>
              <span className="font-medium">患者姓名：</span>
              {caseData.tei.attributes.patientName}
            </div>
            <div>
              <span className="font-medium">疾病类型：</span>
              {getDiseaseName(caseData.enrollment.attributes.diseaseCode)}
            </div>
            <div>
              <span className="font-medium">报告日期：</span>
              {formatDate(caseData.enrollment.attributes.reportDate)}
            </div>
            <div>
              <span className="font-medium">报告人：</span>
              {caseData.enrollment.reportedBy}
            </div>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button onClick={onEdit} variant="outline" icon={<EditIcon />}>
            编辑
          </Button>
          
          {canPushToEpi(caseData) && (
            <Button onClick={onPushToEpi} variant="primary" icon={<SendIcon />}>
              推送流调
            </Button>
          )}
          
          {canCloseCase(caseData) && (
            <Button onClick={onCloseCase} variant="danger" icon={<LockIcon />}>
              结案
            </Button>
          )}
          
          <Button onClick={onBack} variant="ghost" icon={<BackIcon />}>
            返回列表
          </Button>
        </div>
      </div>
    </div>
  );
};
```

#### FollowUpCard 组件

```javascript
const FollowUpCard = ({ followUp, onEdit, onDelete, canEdit }) => {
  const [expanded, setExpanded] = useState(false);
  
  const healthStatusIcons = {
    'NORMAL': '✅',
    'ABNORMAL': '⚠️',
    'HOSPITALIZED': '🏥',
    'DEATH': '💀'
  };
  
  return (
    <div className="border rounded-lg p-4 mb-3 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-sm text-gray-500">
              📅 {formatDate(followUp.eventDate)}
            </span>
            <span className="text-sm text-gray-500">
              {getFollowUpMethodName(followUp.dataValues.followUpMethod)}
            </span>
            <span className="text-lg">
              {healthStatusIcons[followUp.dataValues.healthStatus]}
              {getHealthStatusName(followUp.dataValues.healthStatus)}
            </span>
          </div>
          
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-gray-600">体温：</span>
              <span className={followUp.dataValues.temperature > 37.3 ? 'text-red-600 font-medium' : ''}>
                {followUp.dataValues.temperature}°C
              </span>
            </div>
            <div>
              <span className="text-gray-600">治疗依从性：</span>
              {getTreatmentComplianceName(followUp.dataValues.treatmentCompliance)}
            </div>
          </div>
          
          {expanded && (
            <div className="mt-3 pt-3 border-t">
              <div className="mb-2">
                <span className="text-gray-600 text-sm">症状描述：</span>
                <p className="text-sm mt-1">{followUp.dataValues.symptoms || '无'}</p>
              </div>
              {followUp.dataValues.remarks && (
                <div>
                  <span className="text-gray-600 text-sm">备注：</span>
                  <p className="text-sm mt-1">{followUp.dataValues.remarks}</p>
                </div>
              )}
            </div>
          )}
        </div>
        
        <div className="flex gap-2 ml-4">
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? '收起' : '展开'}
          </Button>
          
          {canEdit && (
            <>
              <Button size="sm" variant="outline" onClick={() => onEdit(followUp)}>
                编辑
              </Button>
              <Button size="sm" variant="ghost" onClick={() => onDelete(followUp.id)}>
                删除
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
```

------

## 8. Performance Optimization

### 8.1 数据加载优化

```javascript
// 使用React Query进行数据缓存和自动刷新
import { useQuery, useMutation, useQueryClient } from 'react-query';

const useCaseDetail = (teiId) => {
  return useQuery(
    ['caseDetail', teiId],
    () => fetchCaseDetail(teiId),
    {
      staleTime: 30000, // 30秒内使用缓存
      cacheTime: 5 * 60 * 1000, // 缓存5分钟
      refetchOnWindowFocus: false,
      retry: 2
    }
  );
};

// 更新数据后自动刷新
const useUpdateFollowUp = (teiId) => {
  const queryClient = useQueryClient();
  
  return useMutation(
    (data) => updateFollowUp(data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['caseDetail', teiId]);
      }
    }
  );
};
```

### 8.2 Tab内容懒加载

```javascript
const CaseTabContent = ({ activeTab, caseData }) => {
  // 仅渲染当前激活的Tab
  return (
    <div className="bg-white shadow rounded-lg p-6">
      {activeTab === 'basic' && <BasicInfoTab data={caseData} />}
      {activeTab === 'epi' && <EpidemiologyTab data={caseData} />}
      {activeTab === 'followup' && <FollowUpTab data={caseData} />}
      {activeTab === 'treatment' && <TreatmentTab data={caseData} />}
      {activeTab === 'test' && <TestTab data={caseData} />}
      {activeTab === 'tracking' && <TrackingTab data={caseData} />}
      {activeTab === 'audit' && <AuditTab data={caseData} />}
    </div>
  );
};
```

### 8.3 虚拟滚动（随访记录超过20条时）

```javascript
import { FixedSizeList } from 'react-window';

const FollowUpTimeline = ({ followUps }) => {
  if (followUps.length <= 20) {
    // 少于20条，直接渲染
    return (
      <div>
        {followUps.map(followUp => (
          <FollowUpCard key={followUp.id} followUp={followUp} />
        ))}
      </div>
    );
  }
  
  // 超过20条，使用虚拟滚动
  return (
    <FixedSizeList
      height={600}
      itemCount={followUps.length}
      itemSize={150}
      width="100%"
    >
      {({ index, style }) => (
        <div style={style}>
          <FollowUpCard followUp={followUps[index]} />
        </div>
      )}
    </FixedSizeList>
  );
};
```

### 8.4 防抖保存

```javascript
import { useDebouncedCallback } from 'use-debounce';

const EditableField = ({ value, onChange, onSave }) => {
  // 3秒无操作后自动保存
  const debouncedSave = useDebouncedCallback(
    (newValue) => {
      onSave(newValue);
    },
    3000
  );
  
  const handleChange = (newValue) => {
    onChange(newValue);
    debouncedSave(newValue);
  };
  
  return (
    <input 
      value={value} 
      onChange={(e) => handleChange(e.target.value)} 
    />
  );
};
```

------

## 9. Accessibility & UX Enhancements

### 9.1 键盘快捷键

```javascript
useEffect(() => {
  const handleKeyPress = (e) => {
    // Ctrl+S 保存
    if (e.ctrlKey && e.key === 's') {
      e.preventDefault();
      if (editState.editing) {
        saveEdit();
      }
    }
    
    // Esc 取消编辑
    if (e.key === 'Escape') {
      if (editState.editing) {
        cancelEdit();
      }
      if (subRecordState.modalOpen) {
        closeModal();
      }
    }
    
    // Ctrl+1~7 切换Tab
    if (e.ctrlKey && e.key >= '1' && e.key <= '7') {
      e.preventDefault();
      const tabs = ['basic', 'epi', 'followup', 'treatment', 'test', 'tracking', 'audit'];
      switchTab(tabs[parseInt(e.key) - 1]);
    }
  };
  
  window.addEventListener('keydown', handleKeyPress);
  return () => window.removeEventListener('keydown', handleKeyPress);
}, [editState, subRecordState]);
```

### 9.2 页面离开提示

```javascript
useEffect(() => {
  const handleBeforeUnload = (e) => {
    if (editState.hasChanges) {
      e.preventDefault();
      e.returnValue = '您有未保存的修改，确定要离开吗？';
      return e.returnValue;
    }
  };
  
  window.addEventListener('beforeunload', handleBeforeUnload);
  return () => window.removeEventListener('beforeunload', handleBeforeUnload);
}, [editState.hasChanges]);
```

### 9.3 加载骨架屏

```javascript
const CaseDetailSkeleton = () => {
  return (
    <div className="animate-pulse">
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="grid grid-cols-2 gap-4">
          <div className="h-4 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded"></div>
        </div>
      </div>
      
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex gap-4 mb-6">
          <div className="h-10 bg-gray-200 rounded w-24"></div>
          <div className="h-10 bg-gray-200 rounded w-24"></div>
          <div className="h-10 bg-gray-200 rounded w-24"></div>
        </div>
        <div className="space-y-4">
          <div className="h-4 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    </div>
  );
};

// 使用
const CaseDetailPage = ({ teiId }) => {
  const { data, isLoading, error } = useCaseDetail(teiId);
  
  if (isLoading) return <CaseDetailSkeleton />;
  if (error) return <ErrorPage error={error} />;
  
  return <CaseDetailContent data={data} />;
};
```

------

## 

## 10. Testing Scenarios

### 10.1 单元测试用例

```javascript
describe('CaseDetailPage', () => {
  test('should load case data on mount', async () => {
    const { getByText } = render(<CaseDetailPage teiId="TEI123456" />);
    await waitFor(() => {
      expect(getByText('CASE-20240115-0001')).toBeInTheDocument();
    });
  });
  
  test('should show edit mode when click edit button', () => {
    const { getByText, getByRole } = render(<CaseDetailPage teiId="TEI123456" />);
    fireEvent.click(getByText('编辑'));
    expect(getByRole('textbox', { name: '联系电话' })).toBeEnabled();
  });
  
  test('should validate required fields before submit', async () => {
    const { getByText, getByRole } = render(<FollowUpModal />);
    fireEvent.click(getByText('保存'));
    await waitFor(() => {
      expect(getByText('健康状态为必填项')).toBeInTheDocument();
    });
  });
  
  test('should disable edit when case is closed', () => {
    const closedCase = { ...mockCaseData, enrollment: { status: 'COMPLETED' } };
    const { getByText } = render(<CaseDetailPage data={closedCase} />);
    expect(getByText('编辑')).toBeDisabled();
  });
});
```

### 10.2 集成测试场景

| 场景         | 测试步骤                                                     | 预期结果                                |
| ------------ | ------------------------------------------------------------ | --------------------------------------- |
| 查看个案详情 | 1. 访问 `/case/TEI123456`<br/>2. 等待数据加载                | 显示完整个案信息，7个Tab正常切换        |
| 编辑基本信息 | 1. 点击"编辑"<br/>2. 修改联系电话<br/>3. 点击"保存"          | 数据更新成功，退出编辑模式              |
| 新增随访记录 | 1. 切换到"随访记录"Tab<br/>2. 点击"新增随访记录"<br/>3. 填写表单<br/>4. 提交 | 新记录出现在时间线顶部                  |
| 推送流调系统 | 1. 个案状态为"已核实"<br/>2. 点击"推送流调"<br/>3. 确认      | 推送成功，按钮变为已推送状态            |
| 结案操作     | 1. 点击"结案"<br/>2. 输入结案原因<br/>3. 确认                | Enrollment状态变为COMPLETED，跳转回列表 |
| 并发修改冲突 | 1. 用户A打开个案<br/>2. 用户B修改并保存<br/>3. 用户A尝试保存 | 显示冲突提示，提示刷新页面              |

------

