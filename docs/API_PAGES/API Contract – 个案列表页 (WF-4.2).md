# API Contract – 个案列表页 (WF-4.2)

## 1. Page Description

个案列表页是疾控业务人员查看和管理已知疾病个案的核心页面。该页面展示所有已登记的个案记录，支持多维度筛选（个案编号、患者姓名、疾病类型、报告日期、个案状态、报告单位）、分页浏览、批量操作（批量推送、批量导出）以及快速跳转至个案详情。左侧菜单支持按状态快速过滤（全部/我的/待核实/处理中/已关闭）。

------

## 2. Required DHIS2 APIs

| #    | Endpoint                             | Method | Description                             | Key Parameters                                               | Expected Response / Data Type |
| ---- | ------------------------------------ | ------ | --------------------------------------- | ------------------------------------------------------------ | ----------------------------- |
| 1    | `/api/trackedEntityInstances`        | GET    | 获取个案列表数据                        | `ou={orgUnit}&ouMode=DESCENDANTS&program=PrgCaseMgt1&fields=*&page={page}&pageSize={size}&filter={filters}&order={orderBy}` | TrackedEntityInstanceList     |
| 2    | `/api/programs/PrgCaseMgt1/metadata` | GET    | 获取Program元数据（用于表头和筛选条件） | `fields=id,name,programTrackedEntityAttributes[trackedEntityAttribute[id,name,shortName,optionSet]],programStages[id,name]` | Program元数据                 |
| 3    | `/api/optionSets/OsDiseasCd1`        | GET    | 获取疾病编码选项集（筛选条件）          | `fields=id,options[id,code,name]`                            | OptionSet对象                 |
| 4    | `/api/optionSets/OsCaseStat1`        | GET    | 获取个案状态选项集（筛选条件）          | `fields=id,options[id,code,name]`                            | OptionSet对象                 |
| 5    | `/api/organisationUnits`             | GET    | 获取机构列表（筛选条件-报告单位）       | `userDataViewFallback=true&fields=id,name,path&paging=false` | List<OrganisationUnit>        |
| 6    | `/api/me`                            | GET    | 获取当前用户信息（用于"我的"过滤）      | `fields=id,organisationUnits[id]`                            | User对象                      |
| 7    | `/api/enrollments/{enrollmentId}`    | DELETE | 删除个案（级联删除Enrollment和Events）  | -                                                            | `{ "httpStatus": "OK" }`      |
| 8    | `/api/trackedEntityInstances.csv`    | GET    | 导出个案列表为CSV                       | 同API-01的参数 + `skipPaging=true`                           | CSV文件流                     |

------

## 3. Notes

### 3.1 API 调用顺序与依赖关系

```
页面加载阶段：
  API-02 (Program元数据)
    └─> API-03 (疾病编码选项)
    └─> API-04 (个案状态选项)
    └─> API-05 (机构列表)
  API-06 (当前用户)
  API-01 (个案列表数据 - 初始加载)

用户交互阶段：
  [筛选/分页/排序] 
    └─> API-01 (刷新列表数据)
  
  [点击删除] 
    └─> API-07 (删除Enrollment)
    └─> API-01 (刷新列表)

  [点击导出] 
    └─> API-08 (下载CSV文件)
```

### 3.2 关键技术说明

#### 3.2.1 个案列表数据检索 (API-01)

**核心查询参数：**

| 参数            | 值             | 说明                               |
| --------------- | -------------- | ---------------------------------- |
| `ou`            | `{用户机构ID}` | 当前用户所属机构                   |
| `ouMode`        | `DESCENDANTS`  | 包含下级机构数据                   |
| `program`       | `PrgCaseMgt1`  | 限定为"已知疾病个案管理"Program    |
| `programStatus` | `ACTIVE`       | 仅显示活跃Enrollment（排除已完成） |
| `fields`        | 见示例         | 精确控制返回字段                   |
| `page`          | `1`            | 当前页码（从1开始）                |
| `pageSize`      | `10`           | 每页记录数                         |
| `totalPages`    | `true`         | 返回总页数                         |

**筛选参数构造（filter）：**

```javascript
// 示例：筛选条件 = { 患者姓名: "张三", 疾病类型: "B03", 个案状态: "NEW", 报告日期: "2024-01-01~2024-01-31" }

const filters = [];

// 1. 患者姓名（模糊匹配）
if (searchParams.patientName) {
  filters.push(`AtrFullNm01:LIKE:${searchParams.patientName}`);
}

// 2. 个案编号（精确匹配）
if (searchParams.caseNumber) {
  filters.push(`AtrCaseNo01:EQ:${searchParams.caseNumber}`);
}

// 3. 疾病类型（精确匹配）
if (searchParams.diseaseCode) {
  filters.push(`AtrDiseaCd1:EQ:${searchParams.diseaseCode}`);
}

// 4. 报告日期范围
if (searchParams.reportDateStart && searchParams.reportDateEnd) {
  filters.push(`AtrRptDt001:GE:${searchParams.reportDateStart}`);
  filters.push(`AtrRptDt001:LE:${searchParams.reportDateEnd}`);
}

// 5. 报告单位
if (searchParams.reportOrgUnit) {
  filters.push(`AtrRptOrg01:EQ:${searchParams.reportOrgUnit}`);
}

// 构造URL
const filterQuery = filters.map(f => `filter=${f}`).join('&');
// 结果: filter=AtrFullNm01:LIKE:张三&filter=AtrDiseaCd1:EQ:B03&...
```

**排序参数构造（order）：**

```javascript
// 默认按报告日期降序
const orderBy = 'AtrRptDt001:desc';

// 用户点击列表头排序
// 示例：按患者姓名升序
const orderBy = 'AtrFullNm01:asc';
```

**"我的"个案过滤：**

```javascript
// 仅显示当前用户所属机构的个案（不包含下级）
const ouMode = 'SELECTED'; // 替换 DESCENDANTS
```

**"待核实"/"处理中"/"已关闭"状态过滤：**

由于个案状态存储在 `Stage 1: 个案调查` 的 Data Element `DeCaseStat1` 中，需要通过以下方式过滤：

```javascript
// 方法一：前端过滤（推荐）
// 获取所有个案后，根据 enrollment.events[0].dataValues 中的 DeCaseStat1 值过滤

// 方法二：使用 DHIS2 v2.41 的 Event Filters（需确认版本支持）
const eventFilters = `eventFilters=PsInvestig1.DeCaseStat1:EQ:NEW`;
```

**注意：** DHIS2 Tracker API 对 Event 级别的过滤支持有限，推荐在前端进行二次过滤。

#### 3.2.2 表格列数据映射

| 列名     | 数据来源           | 映射路径                                                     |
| -------- | ------------------ | ------------------------------------------------------------ |
| 个案编号 | TEI Attribute      | `attributes.find(a => a.attribute === 'AtrCaseNo01').value`  |
| 患者姓名 | TEI Attribute      | `attributes.find(a => a.attribute === 'AtrFullNm01').value`  |
| 疾病类型 | Program Attribute  | `enrollments[0].attributes.find(a => a.attribute === 'AtrDiseaCd1').value` |
| 报告日期 | Program Attribute  | `enrollments[0].attributes.find(a => a.attribute === 'AtrRptDt001').value` |
| 个案状态 | Event Data Element | `enrollments[0].events.find(e => e.programStage === 'PsInvestig1').dataValues.find(dv => dv.dataElement === 'DeCaseStat1').value` |

**状态颜色映射：**

```javascript
const statusColors = {
  'NEW': '🟡', // 待核实 - 黄色
  'VERIFIED': '🟡', // 已核实 - 黄色
  'IN_PROGRESS': '🔵', // 处理中 - 蓝色
  'CLOSED': '🟢' // 已关闭 - 绿色
};
```

#### 3.2.3 分页机制

DHIS2 使用 **1-based 分页**：

```javascript
// 第1页
GET /api/trackedEntityInstances?page=1&pageSize=10

// 第2页
GET /api/trackedEntityInstances?page=2&pageSize=10
```

**响应中的分页信息：**

```json
{
  "pager": {
    "page": 1,
    "pageSize": 10,
    "pageCount": 16,
    "total": 156
  },
  "trackedEntityInstances": [...]
}
```

#### 3.2.4 批量操作

**批量推送至流调系统：**

由于 DHIS2 不支持单一 API 批量更新 Data Elements，需要：

```javascript
// 伪代码
const selectedCases = [tei1, tei2, tei3];

for (const tei of selectedCases) {
  const enrollmentId = tei.enrollments[0].enrollment;
  const eventId = tei.enrollments[0].events[0].event;
  
  // 更新 Event 的 DePushEpi01 = true
  await fetch(`/api/events/${eventId}`, {
    method: 'PUT',
    body: JSON.stringify({
      dataValues: [
        { dataElement: 'DePushEpi01', value: 'true' },
        { dataElement: 'DePushEpiDt', value: new Date().toISOString() }
      ]
    })
  });
  
  // 调用外部系统推送接口（自定义服务）
  await pushToEpiSystem(enrollmentId);
}
```

#### 3.2.5 导出功能 (API-08)

DHIS2 原生支持 CSV/JSON/XML 导出：

```javascript
// CSV导出
GET /api/trackedEntityInstances.csv?ou=...&program=PrgCaseMgt1&skipPaging=true

// JSON导出（前端可转换为Excel）
GET /api/trackedEntityInstances.json?ou=...&program=PrgCaseMgt1&skipPaging=true
```

**注意：** `skipPaging=true` 导出所有记录（忽略分页限制）。

### 3.3 性能优化建议

1. **字段精简：** 使用 `fields` 参数仅获取必要字段，避免返回完整 TEI 对象
2. **缓存元数据：** API-02 至 API-05 的结果可缓存至 `sessionStorage`（有效期1小时）
3. **虚拟滚动：** 列表数据超过100条时，考虑虚拟滚动技术减少DOM渲染
4. **防抖/节流：** 筛选条件输入框使用防抖（300ms），避免频繁请求

------

## 4. Example Request & Response

### API-01: 获取个案列表数据

**请求地址**

```
GET http://[基地址]/api/trackedEntityInstances?ou=OuWuhou0001&ouMode=DESCENDANTS&program=PrgCaseMgt1&programStatus=ACTIVE&fields=trackedEntityInstance,created,lastUpdated,attributes[attribute,value,displayName],enrollments[enrollment,enrollmentDate,incidentDate,status,attributes[attribute,value],events[event,programStage,eventDate,dataValues[dataElement,value]]]&page=1&pageSize=10&totalPages=true&filter=AtrFullNm01:LIKE:张&filter=AtrDiseaCd1:EQ:B03&filter=AtrRptDt001:GE:2024-01-01&filter=AtrRptDt001:LE:2024-01-31&order=AtrRptDt001:desc
```

**返回消息体**

```json
{
  "pager": {
    "page": 1,
    "pageSize": 10,
    "pageCount": 2,
    "total": 15
  },
  "trackedEntityInstances": [
    {
      "trackedEntityInstance": "TEI123456",
      "created": "2024-01-15T10:30:00.000",
      "lastUpdated": "2024-01-15T14:20:00.000",
      "attributes": [
        {
          "attribute": "AtrCaseNo01",
          "value": "CASE-20240115-0001",
          "displayName": "个案编号"
        },
        {
          "attribute": "AtrFullNm01",
          "value": "张三",
          "displayName": "姓名"
        },
        {
          "attribute": "AtrNatnlId1",
          "value": "110101197901011234",
          "displayName": "身份证号"
        },
        {
          "attribute": "AtrGender01",
          "value": "MALE",
          "displayName": "性别"
        },
        {
          "attribute": "AtrAge00001",
          "value": "45",
          "displayName": "年龄"
        }
      ],
      "enrollments": [
        {
          "enrollment": "ENROLLMENT_789",
          "enrollmentDate": "2024-01-15",
          "incidentDate": "2024-01-10",
          "status": "ACTIVE",
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
              "attribute": "AtrCaseSrc1",
              "value": "ACTIVE_SURVEILLANCE"
            }
          ],
          "events": [
            {
              "event": "EVENT_456",
              "programStage": "PsInvestig1",
              "eventDate": "2024-01-15",
              "dataValues": [
                {
                  "dataElement": "DeCaseStat1",
                  "value": "NEW"
                },
                {
                  "dataElement": "DeInitDiag1",
                  "value": "疑似新冠肺炎"
                },
                {
                  "dataElement": "DePushEpi01",
                  "value": "false"
                }
              ]
            }
          ]
        }
      ]
    },
    {
      "trackedEntityInstance": "TEI123457",
      "created": "2024-01-14T09:15:00.000",
      "lastUpdated": "2024-01-16T11:30:00.000",
      "attributes": [
        {
          "attribute": "AtrCaseNo01",
          "value": "CASE-20240114-0023"
        },
        {
          "attribute": "AtrFullNm01",
          "value": "张四"
        }
        // ... 其他属性
      ],
      "enrollments": [
        {
          "enrollment": "ENROLLMENT_790",
          "attributes": [
            {
              "attribute": "AtrDiseaCd1",
              "value": "B03"
            },
            {
              "attribute": "AtrRptDt001",
              "value": "2024-01-14"
            }
          ],
          "events": [
            {
              "event": "EVENT_457",
              "programStage": "PsInvestig1",
              "dataValues": [
                {
                  "dataElement": "DeCaseStat1",
                  "value": "IN_PROGRESS"
                }
              ]
            }
          ]
        }
      ]
    }
    // ... 其他8条记录
  ]
}
```

------

### API-02: 获取Program元数据

**请求地址**

```
GET http://[基地址]/api/programs/PrgCaseMgt1/metadata?fields=id,name,programTrackedEntityAttributes[trackedEntityAttribute[id,name,shortName,valueType,optionSet[id,name]]],programStages[id,name,sortOrder]
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
          "trackedEntityAttribute": {
            "id": "AtrCaseNo01",
            "name": "个案编号",
            "shortName": "个案编号",
            "valueType": "TEXT"
          }
        },
        {
          "trackedEntityAttribute": {
            "id": "AtrDiseaCd1",
            "name": "疾病编码",
            "shortName": "疾病",
            "valueType": "TEXT",
            "optionSet": {
              "id": "OsDiseasCd1",
              "name": "疾病编码"
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
        },
        {
          "id": "PsFollowUp1",
          "name": "随访记录",
          "sortOrder": 2
        }
        // ...
      ]
    }
  ]
}
```

------

### API-03: 获取疾病编码选项集

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

### API-04: 获取个案状态选项集

**请求地址**

```
GET http://[基地址]/api/optionSets/OsCaseStat1?fields=id,name,options[id,code,name]
```

**返回消息体**

```json
{
  "id": "OsCaseStat1",
  "name": "个案状态",
  "options": [
    {
      "id": "OptNew00001",
      "code": "NEW",
      "name": "新建"
    },
    {
      "id": "OptVerifid1",
      "code": "VERIFIED",
      "name": "已核实"
    },
    {
      "id": "OptInProg10",
      "code": "IN_PROGRESS",
      "name": "处理中"
    },
    {
      "id": "OptClosed01",
      "code": "CLOSED",
      "name": "已关闭"
    }
  ]
}
```

------

### API-06: 获取当前用户信息

**请求地址**

```
GET http://[基地址]/api/me?fields=id,username,organisationUnits[id,name]
```

**返回消息体**

```json
{
  "id": "UserWuhou01",
  "username": "wuhou_cdc_001",
  "organisationUnits": [
    {
      "id": "OuWuhou0001",
      "name": "武侯区"
    }
  ]
}
```

------

### API-07: 删除个案（删除Enrollment）

**请求地址**

```
DELETE http://[基地址]/api/enrollments/ENROLLMENT_789
```

**返回消息体**

```json
{
  "httpStatus": "OK",
  "httpStatusCode": 200,
  "status": "OK",
  "message": "Import was successful."
}
```

**注意：** 删除 Enrollment 会级联删除所有关联的 Events，但不会删除 TEI 本身（TEI 可能在其他 Program 中注册）。

------

### API-08: 导出个案列表为CSV

**请求地址**

```
GET http://[基地址]/api/trackedEntityInstances.csv?ou=OuWuhou0001&ouMode=DESCENDANTS&program=PrgCaseMgt1&skipPaging=true&fields=trackedEntityInstance,attributes,enrollments
```

**返回消息体**

```csv
trackedEntityInstance,AtrCaseNo01,AtrFullNm01,AtrDiseaCd1,AtrRptDt001,DeCaseStat1
TEI123456,CASE-20240115-0001,张三,B03,2024-01-15,NEW
TEI123457,CASE-20240114-0023,张四,B03,2024-01-14,IN_PROGRESS
...
```

**前端处理：** 触发浏览器下载：

```javascript
const response = await fetch(url);
const blob = await response.blob();
const link = document.createElement('a');
link.href = URL.createObjectURL(blob);
link.download = `个案列表_${new Date().toISOString().split('T')[0]}.csv`;
link.click();
```

------

## 5. Error Handling

### 5.1 无权限访问机构数据

**API-01 返回：**

```json
{
  "httpStatus": "Forbidden",
  "httpStatusCode": 403,
  "status": "ERROR",
  "message": "User does not have access to organisation unit: OuChengdu01"
}
```

**前端处理：** 提示"您无权查看该机构的数据"，并重置筛选条件。

### 5.2 筛选参数错误

**API-01 返回：**

```json
{
  "httpStatus": "Bad Request",
  "httpStatusCode": 400,
  "status": "ERROR",
  "message": "Invalid filter operator: INVALID_OP"
}
```

**前端处理：** 检查筛选条件构造逻辑，记录错误日志。

------

## 6. UI State Management

### 6.1 列表加载状态

```javascript
const [listState, setListState] = useState({
  loading: true,       // 加载中
  data: [],            // 列表数据
  error: null,         // 错误信息
  pagination: {
    page: 1,
    pageSize: 10,
    total: 0,
    pageCount: 0
  }
});
```

### 6.2 筛选条件状态

```javascript
const [filters, setFilters] = useState({
  caseNumber: '',
  patientName: '',
  diseaseCode: '',
  reportDateStart: '',
  reportDateEnd: '',
  caseStatus: '',
  reportOrgUnit: ''
});
```

### 6.3 左侧菜单状态过滤

```javascript
// 点击"待核实"
const handleFilterByStatus = (status) => {
  setFilters({ ...filters, caseStatus: status });
  fetchCaseList({ ...filters, caseStatus: status, page: 1 });
};

// 点击"我的"
const handleFilterMyCase = () => {
  setOuMode('SELECTED'); // 仅当前机构
  fetchCaseList({ ...filters, page: 1 });
};
```

------

## 7. Performance Considerations

1. **初次加载优化：**
   - 默认加载前10条数据（`pageSize=10`）
   - 元数据（API-02 至 API-05）并行请求
2. **筛选优化：**
   - 输入框防抖 300ms
   - 日期范围选择器仅在"确认"时触发请求
3. **分页加载：**
   - 使用"加载更多"模式替代传统分页（移动端友好）
   - 缓存已加载页面数据，前后翻页时直接从缓存读取
4. **批量操作优化：**
   - 限制单次批量操作数量（最多50条）
   - 使用队列机制控制并发请求数（最多5个并发）

------

