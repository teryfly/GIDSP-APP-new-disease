import { useState, useEffect } from 'react';
import { Form, Button, Space, message, Spin, Typography } from 'antd';
import { useParams, useNavigate } from 'react-router-dom';
import DiseaseCodeForm from '../../components/forms/DiseaseCodeForm';
import type { DiseaseCodeFormData } from '../../types/forms';
import { listOptions, updateOption } from '../../api/optionsService';
import { fromDiseaseFormToPayload } from '../../utils/optionMapping';
import { OPTION_SET_IDS, ATTRIBUTE_IDS } from '../../types/dhis2';

const { Title } = Typography;

const EditDiseaseCode = () => {
  const [form] = Form.useForm<DiseaseCodeFormData>();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [sortOrder, setSortOrder] = useState<number>(0);
  const [codeValue, setCodeValue] = useState<string>('');
  const [displayName, setDisplayName] = useState<string>('');

  useEffect(() => {
    (async () => {
      if (!id) {
        message.error('缺少必要的ID，无法编辑疾病编码。');
        navigate('/disease-codes');
        return;
      }
      try {
        // Load item by searching with token and matching id
        const resp = await listOptions({ optionSetId: OPTION_SET_IDS.DiseaseCodes, page: 1, pageSize: 200, search: id });
        const item = resp.options.find(o => o.id === id);
        if (!item) {
          message.error('未找到该疾病编码。');
          navigate('/disease-codes');
          return;
        }
        setSortOrder(item.sortOrder ?? 0);
        setCodeValue(item.code || '');
        setDisplayName(item.displayName || item.name || '');

        const icd = (item.attributeValues || []).find(a => a.attribute.id === ATTRIBUTE_IDS.ICD_CODE)?.value as string | undefined;
        const category = (item.attributeValues || []).find(a => a.attribute.id === ATTRIBUTE_IDS.DISEASE_CATEGORY)?.value as string | undefined;
        const risk = (item.attributeValues || []).find(a => a.attribute.id === ATTRIBUTE_IDS.RISK_LEVEL)?.value as string | undefined;
        const enabled = String((item.attributeValues || []).find(a => a.attribute.id === ATTRIBUTE_IDS.ENABLED)?.value) === 'true';
        const quarantine = String((item.attributeValues || []).find(a => a.attribute.id === ATTRIBUTE_IDS.QUARANTINE)?.value) === 'true';
        const related = (item.attributeValues || []).find(a => a.attribute.id === ATTRIBUTE_IDS.RELATED_PATHOGEN)?.value as string | undefined;
        const desc = (item.attributeValues || []).find(a => a.attribute.id === ATTRIBUTE_IDS.DISEASE_DESC)?.value as string | undefined;

        form.setFieldsValue({
          diseaseCode: item.code,
          diseaseName: item.displayName || item.name || '',
          icdCode: icd || '',
          diseaseCategory: category || undefined,
          riskLevel: risk || undefined,
          isActive: enabled,
          isQuarantine: quarantine,
          relatedPathogens: related ? [related] : [],
          description: desc || '',
        });
      } catch (e: any) {
        message.error(e?.message || '加载失败');
        navigate('/disease-codes');
      } finally {
        setLoading(false);
      }
    })();
  }, [id, navigate, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const payload = fromDiseaseFormToPayload(values as any, sortOrder);
      // Use PUT for editing with mergeMode=REPLACE
      const url = `/api/29/options/${id}?mergeMode=REPLACE`;
      const resp = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(payload as any),
          id,
          code: codeValue,
        }),
        credentials: 'include',
      });
      if (!resp.ok) {
        const txt = await resp.text();
        throw new Error(txt || '保存失败');
      }
      message.success('疾病编码更新成功!');
      navigate('/disease-codes');
    } catch (error: any) {
      message.error(error?.message || '保存失败，请检查表单填写项。');
    }
  };

  const handleCancel = () => {
    navigate('/disease-codes');
  };

  if (loading) {
    return <Spin size="large" style={{ display: 'block', margin: '50px auto' }} />;
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={4}>编辑疾病编码：{displayName || codeValue}</Title>
      <DiseaseCodeForm form={form} disableCode initialValues={form.getFieldsValue()} />
      <div style={{ textAlign: 'right', marginTop: 24 }}>
        <Space>
          <Button onClick={handleCancel}>取消</Button>
          <Button type="primary" onClick={handleSubmit}>保存</Button>
        </Space>
      </div>
    </Space>
  );
};

export default EditDiseaseCode;