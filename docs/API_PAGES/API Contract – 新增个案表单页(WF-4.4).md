# API Contract – 新增个案表单页 (WF-4.4)

## 1. Page Description

新增个案表单页是疾控业务人员录入已知疾病个案的核心入口。该页面采用分步填写模式（基本信息 → 流行病学信息 → 诊断信息 → 确认提交），支持草稿保存和实时验证。用户完成表单提交后，系统将创建新的 Tracked Entity Instance (TEI) 并关联到"已知疾病个案管理"Program，同时自动生成个案调查 Stage 的首个 Event。

------

## 2. Required DHIS2 APIs

| #    | Endpoint                      | Method | Description                                      | Key Parameters                                               | Expected Response / Data Type                                |
| ---- | ----------------------------- | ------ | ------------------------------------------------ | ------------------------------------------------------------ | ------------------------------------------------------------ |
| 1    | `/api/programs/PrgCaseMgt1`   | GET    | 获取"已知疾病个案管理"Program元数据              | `fields=id,name,programTrackedEntityAttributes[id,mandatory,trackedEntityAttribute[id,name,valueType,optionSet[id,options[id,code,name]]]],programStages[id,name,programStageDataElements[id,dataElement[id,name,valueType,optionSet]]]` | Program对象（含属性和Stage配置）                             |
| 2    | `/api/optionSets/OsDiseasCd1` | GET    | 获取疾病编码选项集（用于疾病类型下拉）           | `fields=id,name,options[id,code,name,sortOrder]`             | OptionSet对象（疾病列表）                                    |
| 3    | `/api/optionSets/OsGender001` | GET    | 获取性别选项集                                   | `fields=id,name,options[id,code,name]`                       | OptionSet对象（男/女/未知）                                  |
| 4    | `/api/optionSets/OsCaseSrc01` | GET    | 获取个案来源选项集                               | `fields=id,name,options[id,code,name]`                       | OptionSet对象（主动监测/被动报告/不明原因转入）              |
| 5    | `/api/organisationUnits`      | GET    | 获取当前用户可访问的机构树（用于地址选择）       | `userDataViewFallback=true&fields=id,name,path,level&paging=false` | List<OrganisationUnit>                                       |
| 6    | `/api/me`                     | GET    | 获取当前登录用户信息（自动填充报告人和报告单位） | `fields=id,username,firstName,surname,organisationUnits[id,name]` | User对象                                                     |
| 7    | `/api/trackedEntityInstances` | GET    | 身份证号查重（防止重复录入）                     | `ou={userOrgUnit}&ouMode=ACCESSIBLE&filter=AtrNatnlId1:EQ:{nationalId}&fields=trackedEntityInstance,attributes` | TrackedEntityInstanceList                                    |
| 8    | `/api/trackedEntityInstances` | POST   | 创建新的TEI及Enrollment                          | 见 Section 4 示例                                            | `{ "httpStatus": "OK", "response": { "importSummaries": [...] } }` |
| 9    | `/api/events`                 | POST   | 创建"个案调查"Stage的首个Event                   | 见 Section 4 示例                                            | `{ "httpStatus": "OK", "response": { "importSummaries": [...] } }` |

------

## 3. Notes

### 3.1 API 调用顺序与依赖关系

```
页面加载阶段：
  API-01 (Program元数据) 
    └─> API-02 (疾病编码)
    └─> API-03 (性别)
    └─> API-04 (个案来源)
    └─> API-05 (机构树)
  API-06 (当前用户)

用户交互阶段：
  [输入身份证号] 
    └─> API-07 (查重校验)

表单提交阶段：
  API-08 (创建TEI + Enrollment)
    └─> [成功后] API-09 (创建首个Event)
```

### 3.2 关键技术说明

1. **身份证号查重逻辑 (API-07)**
   - 使用 `filter=AtrNatnlId1:EQ:{nationalId}` 精确匹配
   - 如果返回结果非空，提示"该患者已登记"并允许用户查看已有记录或继续创建（不同Program可共享TEI）
2. **个案编号自动生成**
   - `AtrCaseNo01` 配置为 `generated=true`，DHIS2 后端根据 `pattern="CASE-"+CURRENT_DATE(yyyyMMdd)+"-"+SEQUENTIAL(####)` 自动生成
   - 前端无需传递此字段值
3. **报告单位和报告人自动填充**
   - 使用 API-06 返回的 `organisationUnits[0].id` 作为 `AtrRptOrg01` 的值
   - 报告人姓名 = `firstName + surname`（存储在备注或自定义字段中）
4. **分步表单的数据结构**
   - 前端采用单一 JSON 对象存储所有步骤数据
   - 最终提交时一次性调用 API-08（包含 Enrollment 和 TEI Attributes）
   - API-09 仅创建 Stage 1 的 Event（基本信息）
5. **Program Rules 触发**
   - 提交后 DHIS2 自动执行 Program Rules（如 PR3.1 诊断日期验证）
   - 前端应处理 API 返回的 `conflicts` 字段，展示验证错误

### 3.3 表单字段与 DHIS2 对象映射

| 表单字段（步骤1-基本信息） | DHIS2 对象类型    | 对象ID      | Mandatory | 备注                  |
| -------------------------- | ----------------- | ----------- | --------- | --------------------- |
| 疾病类型                   | Program Attribute | AtrDiseaCd1 | Yes       | 关联 OsDiseasCd1      |
| 患者姓名                   | TEI Attribute     | AtrFullNm01 | Yes       | -                     |
| 性别                       | TEI Attribute     | AtrGender01 | Yes       | 关联 OsGender001      |
| 身份证号                   | TEI Attribute     | AtrNatnlId1 | Yes       | Unique=true           |
| 出生日期                   | -                 | -           | No        | 可由身份证号解析      |
| 年龄                       | TEI Attribute     | AtrAge00001 | Yes       | 可由身份证号计算      |
| 联系电话                   | TEI Attribute     | AtrPhone001 | No        | -                     |
| 现住地址（省/市/区）       | TEI Attribute     | AtrAddr0001 | No        | 拼接为 LONG_TEXT      |
| 报告单位                   | Program Attribute | AtrRptOrg01 | Yes       | 自动填充              |
| 报告人员                   | -                 | -           | No        | 存储在 Event 或备注中 |
| 报告日期                   | Program Attribute | AtrRptDt001 | Yes       | 默认当天              |
| 症状开始日期               | Program Attribute | AtrSymptDt1 | Yes       | -                     |

| 表单字段（步骤2-流行病学） | DHIS2 对象类型         | 对象ID      | Mandatory |
| -------------------------- | ---------------------- | ----------- | --------- |
| 暴露史                     | Data Element (Stage 1) | DeExposHst1 | No        |
| 接触史                     | Data Element (Stage 1) | DeContHst01 | No        |
| 旅行史                     | Data Element (Stage 1) | DeTravHst01 | No        |

| 表单字段（步骤3-诊断信息） | DHIS2 对象类型         | 对象ID      | Mandatory |
| -------------------------- | ---------------------- | ----------- | --------- |
| 初步诊断                   | Data Element (Stage 1) | DeInitDiag1 | No        |
| 症状描述                   | -                      | -           | No        |

### 3.4 草稿保存机制

- **方案一（推荐）**：使用浏览器 `localStorage` 暂存表单数据，不调用 DHIS2 API
- **方案二**：创建 TEI + Enrollment 但不创建 Event，标记为"草稿"状态（需额外 Data Element）

------

## 4. Example Request & Response

### API-01: 获取Program元数据

**请求地址**

```
GET http://[基地址]/api/programs/PrgCaseMgt1?fields=id,name,programTrackedEntityAttributes[id,mandatory,trackedEntityAttribute[id,name,shortName,valueType,unique,optionSet[id,options[id,code,name]]]],programStages[id,name,sortOrder]
```

**返回消息体**

```json
{
  "id": "PrgCaseMgt1",
  "name": "已知疾病个案管理",
  "programTrackedEntityAttributes": [
    {
      "id": "PteaFullNm1",
      "mandatory": true,
      "trackedEntityAttribute": {
        "id": "AtrFullNm01",
        "name": "姓名",
        "shortName": "姓名",
        "valueType": "TEXT",
        "unique": false
      }
    },
    {
      "id": "PteaNatnId1",
      "mandatory": true,
      "trackedEntityAttribute": {
        "id": "AtrNatnlId1",
        "name": "身份证号",
        "shortName": "身份证号",
        "valueType": "TEXT",
        "unique": true
      }
    },
    {
      "id": "PteaGender1",
      "mandatory": true,
      "trackedEntityAttribute": {
        "id": "AtrGender01",
        "name": "性别",
        "valueType": "TEXT",
        "optionSet": {
          "id": "OsGender001",
          "options": [
            { "id": "OptMale0001", "code": "MALE", "name": "男" },
            { "id": "OptFemale01", "code": "FEMALE", "name": "女" },
            { "id": "OptUnknown1", "code": "UNKNOWN", "name": "未知" }
          ]
        }
      }
    }
    // ... 其他属性
  ],
  "programStages": [
    {
      "id": "PsInvestig1",
      "name": "个案调查",
      "sortOrder": 1
    }
    // ...
  ]
}
```

------

### API-02: 获取疾病编码选项集

**请求地址**

```
GET http://[基地址]/api/optionSets/OsDiseasCd1?fields=id,name,options[id,code,name,sortOrder]
```

**返回消息体**

```json
{
  "id": "OsDiseasCd1",
  "name": "疾病编码",
  "options": [
    {
      "id": "OptDiseaA10",
      "code": "A01",
      "name": "鼠疫",
      "sortOrder": 1
    },
    {
      "id": "OptDiseaA20",
      "code": "A02",
      "name": "霍乱",
      "sortOrder": 2
    },
    {
      "id": "OptDiseaB30",
      "code": "B03",
      "name": "新型冠状病毒肺炎(COVID-19)",
      "sortOrder": 11
    }
    // ...
  ]
}
```

------

### API-05: 获取机构树

**请求地址**

```
GET http://[基地址]/api/organisationUnits?userDataViewFallback=true&fields=id,name,path,level&paging=false
```

**返回消息体**

```json
{
  "organisationUnits": [
    {
      "id": "OuSichuan10",
      "name": "四川省",
      "path": "/OuSichuan10",
      "level": 1
    },
    {
      "id": "OuChengdu01",
      "name": "成都市",
      "path": "/OuSichuan10/OuChengdu01",
      "level": 2
    },
    {
      "id": "OuWuhou0001",
      "name": "武侯区",
      "path": "/OuSichuan10/OuChengdu01/OuWuhou0001",
      "level": 3
    }
    // ...
  ]
}
```

------

### API-06: 获取当前用户信息

**请求地址**

```
GET http://[基地址]/api/me?fields=id,username,firstName,surname,organisationUnits[id,name]
```

**返回消息体**

```json
{
  "id": "UserWuhou01",
  "username": "wuhou_cdc_001",
  "firstName": "王x",
  "surname": "强x",
  "organisationUnits": [
    {
      "id": "OuWuhou0001",
      "name": "武侯区"
    }
  ]
}
```

------

### API-07: 身份证号查重

**请求地址**

```
GET http://[基地址]/api/trackedEntityInstances?ou=OuWuhou0001&ouMode=ACCESSIBLE&filter=AtrNatnlId1:EQ:110101197901011234&fields=trackedEntityInstance,attributes
```

**返回消息体（无重复）**

```json
{
  "trackedEntityInstances": []
}
```

**返回消息体（存在重复）**

```json
{
  "trackedEntityInstances": [
    {
      "trackedEntityInstance": "TEI123456",
      "attributes": [
        {
          "attribute": "AtrNatnlId1",
          "value": "110101197901011234"
        },
        {
          "attribute": "AtrFullNm01",
          "value": "张三"
        }
      ]
    }
  ]
}
```

------

### API-08: 创建TEI及Enrollment

**请求地址**

```
POST http://[基地址]/api/trackedEntityInstances
Content-Type: application/json
```

**请求消息体**

```json
{
  "trackedEntityType": "TetPerson01",
  "orgUnit": "OuWuhou0001",
  "attributes": [
    {
      "attribute": "AtrFullNm01",
      "value": "张三"
    },
    {
      "attribute": "AtrNatnlId1",
      "value": "110101197901011234"
    },
    {
      "attribute": "AtrGender01",
      "value": "MALE"
    },
    {
      "attribute": "AtrAge00001",
      "value": "45"
    },
    {
      "attribute": "AtrPhone001",
      "value": "13800138000"
    },
    {
      "attribute": "AtrAddr0001",
      "value": "北京市朝阳区XX街道XX小区XX号楼XX单元"
    }
  ],
  "enrollments": [
    {
      "program": "PrgCaseMgt1",
      "orgUnit": "OuWuhou0001",
      "enrollmentDate": "2024-01-15",
      "incidentDate": "2024-01-10",
      "attributes": [
        {
          "attribute": "AtrDiseaCd1",
          "value": "B03"
        },
        {
          "attribute": "AtrRptOrg01",
          "value": "OuWuhou0001"
        },
        {
          "attribute": "AtrRptDt001",
          "value": "2024-01-15"
        },
        {
          "attribute": "AtrSymptDt1",
          "value": "2024-01-10"
        },
        {
          "attribute": "AtrCaseSrc1",
          "value": "ACTIVE_SURVEILLANCE"
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
  "status": "OK",
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
        "reference": "TEI_NEW_ID_123456",
        "href": "http://[基地址]/api/trackedEntityInstances/TEI_NEW_ID_123456",
        "enrollments": {
          "responseType": "ImportSummaries",
          "status": "SUCCESS",
          "imported": 1,
          "importSummaries": [
            {
              "reference": "ENROLLMENT_ID_789",
              "href": "http://[基地址]/api/enrollments/ENROLLMENT_ID_789"
            }
          ]
        }
      }
    ]
  }
}
```

------

### API-09: 创建"个案调查"Stage的首个Event

**请求地址**

```
POST http://[基地址]/api/events
Content-Type: application/json
```

**请求消息体**

```json
{
  "program": "PrgCaseMgt1",
  "programStage": "PsInvestig1",
  "enrollment": "ENROLLMENT_ID_789",
  "orgUnit": "OuWuhou0001",
  "eventDate": "2024-01-15",
  "status": "ACTIVE",
  "trackedEntityInstance": "TEI_NEW_ID_123456",
  "dataValues": [
    {
      "dataElement": "DeInitDiag1",
      "value": "疑似新冠肺炎"
    },
    {
      "dataElement": "DeCaseStat1",
      "value": "NEW"
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
        "reference": "EVENT_ID_456",
        "href": "http://[基地址]/api/events/EVENT_ID_456"
      }
    ]
  }
}
```

------

## 5. Error Handling

### 5.1 身份证号重复（API-07返回非空）

**前端处理逻辑：**

```javascript
if (response.trackedEntityInstances.length > 0) {
  showConfirmDialog({
    title: '该患者已登记',
    message: `身份证号 ${nationalId} 已存在于系统中，患者姓名：${existingTEI.name}`,
    actions: [
      { label: '查看已有记录', action: () => navigate(`/case/${existingTEI.id}`) },
      { label: '继续创建（不同疾病）', action: () => submitForm() }
    ]
  });
}
```

### 5.2 Program Rules 验证失败

**API-08 返回 conflicts：**

```json
{
  "httpStatus": "OK",
  "status": "WARNING",
  "response": {
    "status": "WARNING",
    "conflicts": [
      {
        "object": "AtrDiagDt01",
        "value": "诊断日期不能早于症状起始日期"
      }
    ]
  }
}
```

**前端处理：** 高亮相关字段并展示错误提示。

### 5.3 必填字段缺失

**API-08 返回错误：**

```json
{
  "httpStatus": "Conflict",
  "httpStatusCode": 409,
  "status": "ERROR",
  "message": "Attribute 'AtrDiseaCd1' is mandatory but no value was found."
}
```

------

## 6. Performance Considerations

1. **API-01 至 API-06 可并行请求**（使用 `Promise.all()`）
2. **机构树数据缓存**：首次加载后存入 `sessionStorage`，避免重复请求
3. **Option Sets 数据复用**：多个页面共享相同选项集时，使用全局状态管理（如 Redux/Vuex）
4. **身份证号查重防抖**：输入框 `onBlur` 时触发，延迟 500ms 避免频繁请求

