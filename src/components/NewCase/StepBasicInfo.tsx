import { Card, Col, DatePicker, Form, Input, Radio, Row, Select, Typography, Button, message } from 'antd';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import { useEffect } from 'react';
import { validateNotFuture, validateSymptomOnsetDate } from '../../utils/dateValidators';

const { Title } = Typography;

export interface StepBasicInfoValues {
  diseaseCode?: string;
  fullName?: string;
  genderZh?: '男' | '女' | '未知';
  nationalId?: string;
  dob?: Dayjs;
  age?: number;
  phone?: string;
  addressProvince?: string;
  addressCity?: string;
  addressDistrict?: string;
  addressDetail?: string;
  reportOrgId?: string;
  reportOrgName?: string;
  reportUser?: string;
  reportDate?: Dayjs;
  symptomOnsetDate?: Dayjs;
}

interface Props {
  form: any;
  diseaseOptions: { value: string; label: string }[];
  defaultOrg: { id: string; name: string } | null;
  onValidateId?: (id: string) => Promise<void>;
}

export default function StepBasicInfo({ form, diseaseOptions, defaultOrg, onValidateId }: Props) {
  useEffect(() => {
    if (defaultOrg) {
      form.setFieldsValue({
        reportOrgId: defaultOrg.id,
        reportOrgName: defaultOrg.name,
      });
    }
    if (!form.getFieldValue('reportDate')) {
      form.setFieldsValue({ reportDate: dayjs() });
    }
    if (!form.getFieldValue('reportUser')) {
      form.setFieldsValue({ reportUser: '当前用户' });
    }
  }, [defaultOrg, form]);

  const onValidate = async () => {
    const id = form.getFieldValue('nationalId');
    if (!id) {
      message.info('请先输入身份证号');
      return;
    }
    if (onValidateId) await onValidateId(id);
  };

  const onNationalIdBlur = () => {
    const id: string = form.getFieldValue('nationalId') || '';
    if (id.length === 18) {
      const y = Number(id.slice(6, 10));
      const m = Number(id.slice(10, 12));
      const d = Number(id.slice(12, 14));
      if (y > 1900 && m >= 1 && m <= 12 && d >= 1 && d <= 31) {
        const dob = dayjs(`${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`);
        const age = dayjs().diff(dob, 'year');
        form.setFieldsValue({ dob, age });
      }
    }
  };

  return (
    <Card>
      <Title level={4}>第一步: 患者基本信息</Title>
      <Form layout="vertical" form={form}>
        <Row gutter={16}>
          <Col span={24}>
            <Form.Item label="疾病类型" name="diseaseCode" rules={[{ required: true, message: '请选择疾病类型' }]}>
              <Select placeholder="请选择疾病" options={diseaseOptions} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item 
              label="患者姓名" 
              name="fullName" 
              rules={[
                { required: true, message: '请输入患者姓名' }, 
                { min: 2, max: 50, message: '姓名长度为2-50个字符' },
                { pattern: /^[\u4e00-\u9fa5a-zA-Z\s·]+$/, message: '姓名只能包含中文、英文、空格和·' }
              ]}
            >
              <Input placeholder="请输入姓名" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="性别" name="genderZh" rules={[{ required: true, message: '请选择性别' }]}>
              <Radio.Group>
                <Radio value="男">男</Radio>
                <Radio value="女">女</Radio>
                <Radio value="未知">未知</Radio>
              </Radio.Group>
            </Form.Item>
          </Col>
          <Col span={16}>
            <Form.Item
              label="身份证号"
              name="nationalId"
              rules={[
                { required: true, message: '请输入身份证号' },
                { 
                  pattern: /^[1-9]\d{5}(18|19|20)\d{2}((0[1-9])|(1[0-2]))(([0-2][1-9])|10|20|30|31)\d{3}[0-9Xx]$/, 
                  message: '身份证号格式不正确' 
                },
              ]}
              help="系统将自动检测重复病例"
            >
              <Input placeholder="请输入18位身份证号" onBlur={onNationalIdBlur} maxLength={18} />
            </Form.Item>
          </Col>
          <Col span={8} style={{ display: 'flex', alignItems: 'end', paddingBottom: '24px' }}>
            <Button type="primary" onClick={onValidate}>验证身份证</Button>
          </Col>

          <Col span={6}>
            <Form.Item label="出生日期" name="dob">
              <DatePicker 
                style={{ width: '100%' }} 
                format="YYYY-MM-DD"
                disabledDate={(current) => current && current > dayjs().endOf('day')}
                placeholder="自动填充"
              />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item 
              label="年龄" 
              name="age" 
              rules={[
                { type: 'number', transform: (v) => Number(v), min: 0, max: 150, message: '年龄范围0-150岁' }
              ]}
            >
              <Input suffix="岁" placeholder="自动填充" type="number" min={0} max={150} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="联系电话"
              name="phone"
              rules={[
                { required: true, message: '请输入联系电话' },
                { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的11位手机号' },
              ]}
            >
              <Input placeholder="请输入11位手机号" maxLength={11} />
            </Form.Item>
          </Col>

          <Col span={8}>
            <Form.Item 
              label="省/直辖市" 
              name="addressProvince" 
              rules={[
                { required: true, message: '请选择省/直辖市' },
                { min: 2, max: 50, message: '省份名称2-50个字符' }
              ]}
            >
              <Input placeholder="如：北京市" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item 
              label="市" 
              name="addressCity" 
              rules={[
                { required: true, message: '请选择市' },
                { min: 2, max: 50, message: '城市名称2-50个字符' }
              ]}
            >
              <Input placeholder="如：北京市" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item 
              label="区/县" 
              name="addressDistrict" 
              rules={[
                { required: true, message: '请选择区/县' },
                { min: 2, max: 50, message: '区县名称2-50个字符' }
              ]}
            >
              <Input placeholder="如：朝阳区" />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item 
              label="详细地址" 
              name="addressDetail" 
              rules={[
                { required: true, message: '请输入详细地址' }, 
                { min: 5, max: 200, message: '详细地址5-200个字符' }
              ]}
            >
              <Input placeholder="街道、小区、楼栋、门牌等详细信息" />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item label="报告单位" name="reportOrgName">
              <Input readOnly placeholder="自动填充" disabled style={{ color: 'rgba(0, 0, 0, 0.85)' }} />
            </Form.Item>
            <Form.Item name="reportOrgId" hidden>
              <Input />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="报告人员" name="reportUser">
              <Input readOnly disabled style={{ color: 'rgba(0, 0, 0, 0.85)' }} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item 
              label="报告日期" 
              name="reportDate" 
              rules={[
                { required: true, message: '请选择报告日期' },
                { validator: validateNotFuture }
              ]}
            >
              <DatePicker 
                style={{ width: '100%' }} 
                format="YYYY-MM-DD" 
                disabledDate={(current) => current && current > dayjs().endOf('day')}
                placeholder="选择报告日期"
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item 
              label="症状开始日期" 
              name="symptomOnsetDate" 
              rules={[
                { required: true, message: '请选择症状开始日期' },
                ({ getFieldValue }) => ({
                  validator: validateSymptomOnsetDate(() => getFieldValue('reportDate'))
                })
              ]}
              tooltip="症状开始日期应早于或等于报告日期，不能晚于今天"
            >
              <DatePicker 
                style={{ width: '100%' }} 
                format="YYYY-MM-DD" 
                disabledDate={(current) => current && current > dayjs().endOf('day')}
                placeholder="选择症状开始日期"
              />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Card>
  );
}