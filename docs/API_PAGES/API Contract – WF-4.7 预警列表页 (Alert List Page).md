# API Contract – WF-4.7 预警列表页 (Alert List Page)

## 1. Page Description

预警列表页用于展示系统检测到的各类预警事件，包括病例聚集、异常症状、新发疾病等。用户可以根据预警类型、发生地区、预警等级、检测时间范围和预警状态进行筛选，并对预警事件进行处理（查看详情、处理、标记误报等）。页面支持分页显示预警事件列表，每条预警显示关键信息如预警编号、类型、发生地区、检测时间、预警等级、状态以及摘要信息。

------

## 2. Required DHIS2 APIs

| #    | Endpoint                          | Method | Description                                           | Key Parameters                                               | Expected Response / Data Type                     |
| ---- | --------------------------------- | ------ | ----------------------------------------------------- | ------------------------------------------------------------ | ------------------------------------------------- |
| 1    | `/api/messageConversations`       | GET    | 获取预警事件列表（基于DHIS2消息会话机制实现预警功能） | `fields=id,subject,lastMessage,messageCount,status,priority,lastUpdated,lastSender,userMessages[user,lastUpdated]`<br>`filter=priority:in:[URGENT,HIGH]`<br>`filter=status:eq:OPEN`<br>`page=1`<br>`pageSize=10`<br>`order=lastUpdated:desc` | `{"pager": {...}, "messageConversations": [...]}` |
| 2    | `/api/organisationUnits`          | GET    | 加载组织机构列表（用于地区筛选下拉框）                | `fields=id,name,level`<br>`filter=level:le:3`<br>`paging=false` | `{"organisationUnits": [...]}`                    |
| 3    | `/api/programRuleActions`         | GET    | 获取程序规则动作（用于识别预警触发规则）              | `fields=id,name,programRule[id,name,program],programRuleActionType`<br>`filter=programRuleActionType:in:[SENDMESSAGE,SCHEDULEMESSAGE]`<br>`paging=false` | `{"programRuleActions": [...]}`                   |
| 4    | `/api/messageConversations/{uid}` | GET    | 获取单个预警事件详情                                  | `fields=id,subject,lastMessage,messages[id,text,sender,created],userMessages` | `{"id": "...", "subject": "...", ...}`            |
| 5    | `/api/messageConversations/{uid}` | PUT    | 更新预警状态（标记为已处理/误报）                     | `status=CLOSED` or custom metadata field                     | `{"httpStatus": "OK", ...}`                       |
| 6    | `/api/trackedEntities`            | GET    | 获取关联的跟踪实体（病例）信息                        | `program={programUid}`<br>`orgUnit={orgUnitUid}`<br>`fields=trackedEntity,attributes,enrollments[enrollment,events]`<br>`filter=...` (based on alert criteria)<br>`paging=false` | `{"trackedEntities": [...]}`                      |

------

## 3. Notes

### 3.1 预警实现机制说明

- **DHIS2原生预警功能限制**：DHIS2 v2.41的Tracker模块原生支持Program Notifications和Program Rule Notifications，但这些通知主要用于发送SMS/Email，而非作为应用内预警事件管理。

- 替代方案

  ：本页面基于DHIS2的

  Message Conversations

   (

  ```
  /api/messageConversations
  ```

  )实现预警事件管理：

  - 预警触发时，通过Program Rules的`SENDMESSAGE`或`SCHEDULEMESSAGE`动作创建Message Conversation
  - Message的`subject`字段存储预警类型和摘要信息
  - Message的`priority`字段映射预警等级（`URGENT`=一级，`HIGH`=二级，`MEDIUM`=三级，`LOW`=四级）
  - Message的`status`字段表示预警状态（`OPEN`=待处理，`IN_PROGRESS`=处理中，`VALIDATED`=已核实，`INVALID`=误报，`CLOSED`=已关闭）

### 3.2 API依赖关系

1. **API-2必须先于API-1执行**：需要先加载组织机构列表，以便在筛选条件中使用
2. **API-3可与API-1并行**：用于识别预警规则，可在后台异步加载
3. **API-4和API-5按需调用**：仅在用户点击"查看详情"或"处理"时触发
4. **API-6按需调用**：仅在需要显示关联病例详情时调用

### 3.3 分页与排序

- 默认按`lastUpdated:desc`排序（最新预警优先）
- 默认每页显示10条，支持用户自定义（10/20/50）
- 使用DHIS2标准分页参数`page`和`pageSize`

### 3.4 筛选参数映射

| 页面筛选字段 | DHIS2 API参数                                                | 说明                       |
| ------------ | ------------------------------------------------------------ | -------------------------- |
| 预警编号     | `filter=id:like:{keyword}`                                   | 模糊匹配Message UID        |
| 预警类型     | `filter=subject:like:{type}`                                 | 从subject中提取类型关键词  |
| 发生地区     | `filter=userMessages.user.organisationUnits.id:eq:{orgUnitUid}` | 通过发送者所属组织机构筛选 |
| 预警等级     | `filter=priority:in:[URGENT,HIGH,MEDIUM,LOW]`                | 直接使用priority字段       |
| 检测时间     | `filter=lastUpdated:ge:{startDate}`<br>`filter=lastUpdated:le:{endDate}` | 使用lastUpdated时间范围    |
| 预警状态     | `filter=status:in:[OPEN,IN_PROGRESS,VALIDATED,INVALID,CLOSED]` | 直接使用status字段         |

### 3.5 元数据依赖

- **Organisation Units**：需要从Metadata Initialization Files中获取四川省三级组织机构层级
- **Program Rules**：预警触发规则定义在Program中的Program Rules，需要确保规则已配置SENDMESSAGE动作

### 3.6 性能优化建议

- 使用`fields`参数限制返回字段，避免返回完整Message内容
- 考虑在前端缓存组织机构列表（API-2结果），避免重复请求
- 对于高频筛选操作，建议前端实现防抖（debounce）机制

------

## 4. Example Request & Response

### API-01: 获取预警事件列表

**[请求地址]**

```
GET http://[基地址]/api/messageConversations?fields=id,subject,lastMessage,messageCount,status,priority,lastUpdated,lastSender[id,name],userMessages[user[id,name,organisationUnits[id,name]],lastUpdated]&filter=priority:in:[URGENT,HIGH]&filter=status:eq:OPEN&page=1&pageSize=10&order=lastUpdated:desc
```

**[请求动作]**：GET

**[返回消息体]**

```json
{
  "pager": {
    "page": 1,
    "pageSize": 10,
    "total": 15,
    "pageCount": 2
  },
  "messageConversations": [
    {
      "id": "ALT-2024-012-UID",
      "subject": "病例聚集预警：北京市朝阳区XX街道近7天内发现5例新冠肺炎确诊病例",
      "lastMessage": "触发规则：7天内同地区同疾病>5例。关联病例：CAS-2024-156, CAS-2024-155, CAS-2024-154, CAS-2024-153, CAS-2024-152",
      "messageCount": 1,
      "status": "OPEN",
      "priority": "URGENT",
      "lastUpdated": "2024-01-15T10:30:00.000",
      "lastSender": {
        "id": "system-alert-uid",
        "name": "系统预警"
      },
      "userMessages": [
        {
          "user": {
            "id": "user-beijing-uid",
            "name": "北京市疾控中心用户",
            "organisationUnits": [
              {
                "id": "OuChengdu01",
                "name": "北京市"
              }
            ]
          },
          "lastUpdated": "2024-01-15T10:30:00.000"
        }
      ]
    },
    {
      "id": "ALT-2024-011-UID",
      "subject": "异常症状聚集预警：上海市浦东区发现3例患者出现相似异常症状",
      "lastMessage": "触发规则：出现异常症状聚集。关联病例：CAS-2024-150, CAS-2024-149, CAS-2024-148",
      "messageCount": 1,
      "status": "OPEN",
      "priority": "HIGH",
      "lastUpdated": "2024-01-14T15:20:00.000",
      "lastSender": {
        "id": "system-alert-uid",
        "name": "系统预警"
      },
      "userMessages": [
        {
          "user": {
            "id": "user-shanghai-uid",
            "name": "上海市疾控中心用户",
            "organisationUnits": [
              {
                "id": "OuShanghai01",
                "name": "上海市"
              }
            ]
          },
          "lastUpdated": "2024-01-14T15:20:00.000"
        }
      ]
    }
  ]
}
```

**[返回字段说明]**

| 节点名称                                                     | 类型     | 必填 | 描述                                                      |
| ------------------------------------------------------------ | -------- | ---- | --------------------------------------------------------- |
| pager                                                        | Object   | 是   | 分页信息                                                  |
| pager.page                                                   | Number   | 是   | 当前页码                                                  |
| pager.pageSize                                               | Number   | 是   | 每页条数                                                  |
| pager.total                                                  | Number   | 是   | 总记录数                                                  |
| pager.pageCount                                              | Number   | 是   | 总页数                                                    |
| messageConversations                                         | Array    | 是   | 预警事件列表                                              |
| messageConversations[].id                                    | String   | 是   | 预警事件唯一标识（UID）                                   |
| messageConversations[].subject                               | String   | 是   | 预警主题（包含预警类型和摘要）                            |
| messageConversations[].lastMessage                           | String   | 是   | 最后一条消息内容（预警详情）                              |
| messageConversations[].messageCount                          | Number   | 是   | 消息数量                                                  |
| messageConversations[].status                                | String   | 是   | 预警状态（OPEN/IN_PROGRESS/VALIDATED/INVALID/CLOSED）     |
| messageConversations[].priority                              | String   | 是   | 预警等级（URGENT=一级，HIGH=二级，MEDIUM=三级，LOW=四级） |
| messageConversations[].lastUpdated                           | DateTime | 是   | 最后更新时间（检测时间）                                  |
| messageConversations[].lastSender                            | Object   | 是   | 最后发送者信息                                            |
| messageConversations[].lastSender.id                         | String   | 是   | 发送者UID                                                 |
| messageConversations[].lastSender.name                       | String   | 是   | 发送者名称                                                |
| messageConversations[].userMessages                          | Array    | 是   | 接收用户列表                                              |
| messageConversations[].userMessages[].user                   | Object   | 是   | 接收用户信息                                              |
| messageConversations[].userMessages[].user.id                | String   | 是   | 用户UID                                                   |
| messageConversations[].userMessages[].user.name              | String   | 是   | 用户名称                                                  |
| messageConversations[].userMessages[].user.organisationUnits | Array    | 是   | 用户所属组织机构（用于提取发生地区）                      |
| messageConversations[].userMessages[].lastUpdated            | DateTime | 是   | 用户接收时间                                              |

------

### API-02: 加载组织机构列表

**[请求地址]**

```
GET http://[基地址]/api/organisationUnits?fields=id,name,level&filter=level:le:3&paging=false
```

**[请求动作]**：GET

**[返回消息体]**

```json
{
  "organisationUnits": [
    {
      "id": "OuSichuan10",
      "name": "四川省",
      "level": 1
    },
    {
      "id": "OuChengdu01",
      "name": "成都市",
      "level": 2
    },
    {
      "id": "OuMianyang1",
      "name": "绵阳市",
      "level": 2
    },
    {
      "id": "OuWuhou0001",
      "name": "武侯区",
      "level": 3
    },
    {
      "id": "OuJinjiang1",
      "name": "锦江区",
      "level": 3
    }
  ]
}
```

**[返回字段说明]**

| 节点名称                  | 类型   | 必填 | 描述                             |
| ------------------------- | ------ | ---- | -------------------------------- |
| organisationUnits         | Array  | 是   | 组织机构列表                     |
| organisationUnits[].id    | String | 是   | 组织机构UID                      |
| organisationUnits[].name  | String | 是   | 组织机构名称                     |
| organisationUnits[].level | Number | 是   | 组织机构层级（1=省，2=市，3=县） |

------

### API-04: 获取单个预警事件详情

**[请求地址]**

```
GET http://[基地址]/api/messageConversations/ALT-2024-012-UID?fields=id,subject,lastMessage,messages[id,text,sender[id,name],created],userMessages[user[id,name],read,lastUpdated]
```

**[请求动作]**：GET

**[返回消息体]**

```json
{
  "id": "ALT-2024-012-UID",
  "subject": "病例聚集预警：北京市朝阳区XX街道近7天内发现5例新冠肺炎确诊病例",
  "lastMessage": "触发规则：7天内同地区同疾病>5例。关联病例：CAS-2024-156, CAS-2024-155, CAS-2024-154, CAS-2024-153, CAS-2024-152",
  "messages": [
    {
      "id": "msg-001",
      "text": "触发规则：7天内同地区同疾病>5例。关联病例：CAS-2024-156, CAS-2024-155, CAS-2024-154, CAS-2024-153, CAS-2024-152。详细信息：\n- 发生地区：北京市朝阳区XX街道\n- 疾病类型：新冠肺炎\n- 时间范围：2024-01-08 至 2024-01-15\n- 病例数量：5例",
      "sender": {
        "id": "system-alert-uid",
        "name": "系统预警"
      },
      "created": "2024-01-15T10:30:00.000"
    }
  ],
  "userMessages": [
    {
      "user": {
        "id": "user-beijing-uid",
        "name": "北京市疾控中心用户"
      },
      "read": false,
      "lastUpdated": "2024-01-15T10:30:00.000"
    }
  ]
}
```

**[返回字段说明]**

| 节点名称                   | 类型     | 必填 | 描述             |
| -------------------------- | -------- | ---- | ---------------- |
| id                         | String   | 是   | 预警事件UID      |
| subject                    | String   | 是   | 预警主题         |
| lastMessage                | String   | 是   | 最后一条消息摘要 |
| messages                   | Array    | 是   | 完整消息列表     |
| messages[].id              | String   | 是   | 消息UID          |
| messages[].text            | String   | 是   | 消息完整内容     |
| messages[].sender          | Object   | 是   | 发送者信息       |
| messages[].created         | DateTime | 是   | 消息创建时间     |
| userMessages               | Array    | 是   | 接收用户列表     |
| userMessages[].user        | Object   | 是   | 用户信息         |
| userMessages[].read        | Boolean  | 是   | 是否已读         |
| userMessages[].lastUpdated | DateTime | 是   | 最后更新时间     |

------

### API-05: 更新预警状态

**[请求地址]**

```
PUT http://[基地址]/api/messageConversations/ALT-2024-012-UID
```

**[请求动作]**：PUT

**[请求消息体]**

```json
{
  "status": "VALIDATED"
}
```

**[请求字段说明]**

| 字段名称 | 类型   | 必填 | 描述         | 允许值                                                       |
| -------- | ------ | ---- | ------------ | ------------------------------------------------------------ |
| status   | String | 是   | 新的预警状态 | OPEN（待处理）<br>IN_PROGRESS（处理中）<br>VALIDATED（已核实）<br>INVALID（误报）<br>CLOSED（已关闭） |

**[返回消息体]**

```json
{
  "httpStatus": "OK",
  "httpStatusCode": 200,
  "status": "OK",
  "message": "Message conversation updated successfully"
}
```

------

### API-06: 获取关联病例信息

**[请求地址]**

```
GET http://[基地址]/api/tracker/trackedEntities?program=IpHINAT79UW&orgUnit=OuChengdu01&orgUnitMode=DESCENDANTS&fields=trackedEntity,attributes[attribute,value],enrollments[enrollment,enrolledAt,status]&filter=w75KJ2mc4zz:in:CAS-2024-156;CAS-2024-155;CAS-2024-154;CAS-2024-153;CAS-2024-152&paging=false
```

**[请求动作]**：GET

**[说明]**：此API用于获取预警关联的具体病例信息，`filter`参数中的个案编号列表从预警消息的`lastMessage`字段中解析获得。

**[返回消息体]**

```json
{
  "trackedEntities": [
    {
      "trackedEntity": "te-uid-001",
      "attributes": [
        {
          "attribute": "w75KJ2mc4zz",
          "value": "CAS-2024-156"
        },
        {
          "attribute": "zDhUuAYrxNC",
          "value": "张三"
        }
      ],
      "enrollments": [
        {
          "enrollment": "enr-uid-001",
          "enrolledAt": "2024-01-15T00:00:00.000",
          "status": "ACTIVE"
        }
      ]
    },
    {
      "trackedEntity": "te-uid-002",
      "attributes": [
        {
          "attribute": "w75KJ2mc4zz",
          "value": "CAS-2024-155"
        },
        {
          "attribute": "zDhUuAYrxNC",
          "value": "李四"
        }
      ],
      "enrollments": [
        {
          "enrollment": "enr-uid-002",
          "enrolledAt": "2024-01-15T00:00:00.000",
          "status": "ACTIVE"
        }
      ]
    }
  ]
}
```

**[返回字段说明]**

| 节点名称                                   | 类型     | 必填 | 描述        |
| ------------------------------------------ | -------- | ---- | ----------- |
| trackedEntities                            | Array    | 是   | 病例列表    |
| trackedEntities[].trackedEntity            | String   | 是   | 跟踪实体UID |
| trackedEntities[].attributes               | Array    | 是   | 属性列表    |
| trackedEntities[].attributes[].attribute   | String   | 是   | 属性UID     |
| trackedEntities[].attributes[].value       | String   | 是   | 属性值      |
| trackedEntities[].enrollments              | Array    | 是   | 登记列表    |
| trackedEntities[].enrollments[].enrollment | String   | 是   | 登记UID     |
| trackedEntities[].enrollments[].enrolledAt | DateTime | 是   | 登记时间    |
| trackedEntities[].enrollments[].status     | String   | 是   | 登记状态    |

------

## 5. Additional Implementation Notes

### 5.1 预警类型提取规则

从`subject`字段中提取预警类型，建议使用正则表达式：

- 病例聚集：`/病例聚集/`
- 异常症状：`/异常症状/`
- 新发疾病：`/新发疾病/`

### 5.2 预警等级颜色映射

| DHIS2 Priority | 预警等级     | 显示颜色  | 图标 |
| -------------- | ------------ | --------- | ---- |
| URGENT         | 一级（红色） | `#FF0000` | 🔴    |
| HIGH           | 二级（橙色） | `#FF9900` | 🟡    |
| MEDIUM         | 三级（黄色） | `#FFFF00` | 🟢    |
| LOW            | 四级（蓝色） | `#0099FF` | ⚪    |

### 5.3 预警状态映射

| DHIS2 Status | 页面显示状态 | 显示颜色  | 图标 |
| ------------ | ------------ | --------- | ---- |
| OPEN         | 待处理       | `#FFCC00` | 🟡    |
| IN_PROGRESS  | 处理中       | `#0099FF` | 🔵    |
| VALIDATED    | 已核实       | `#00CC00` | 🟢    |
| INVALID      | 误报         | `#CCCCCC` | ⚪    |
| CLOSED       | 已关闭       | `#006600` | 🟢    |

### 5.4 权限控制

- 用户仅能查看其所属组织机构及下级机构的预警事件
- 使用DHIS2的Organisation Unit Mode参数控制数据可见范围：
  - `orgUnitMode=ACCESSIBLE`：用户搜索范围内的组织机构
  - `orgUnitMode=DESCENDANTS`：指定组织机构及其所有下级

### 5.5 性能优化

- 建议前端缓存组织机构列表，有效期24小时
- 对于大量预警事件，考虑使用虚拟滚动（Virtual Scrolling）技术
- 预警摘要信息可以在列表页显示，完整详情在详情页异步加载

------

