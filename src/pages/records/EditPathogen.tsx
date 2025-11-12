import { useState, useEffect } from 'react';
import { Form, Button, Space, message, Spin, Typography } from 'antd';
import { useParams, useNavigate } from 'react-router-dom';
import PathogenForm from '../../components/forms/PathogenForm';
import type { PathogenFormData } from '../../types/forms';
import { listOptions } from '../../api/optionsService';
import { fromPathogenFormToPayload } from '../../utils/optionMapping';
import { OPTION_SET_IDS, ATTRIBUTE_IDS } from '../../types/dhis2';
import { dhis2Client } from '../../api/dhis2Client';

const { Title } = Typography;

const EditPathogen = () => {
  const [form] = Form.useForm<PathogenFormData>();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [sortOrder, setSortOrder] = useState<number>(0);
  const [codeValue, setCodeValue] = useState<string>('');
  const [displayName, setDisplayName] = useState<string>('');

  useEffect(() => {
    (async () => {
      if (!id) {
        message.error('缺少必要的ID，无法编辑病原体信息。');
        navigate('/pathogens');
        return;
      }
      try {
        const resp = await listOptions({ optionSetId: OPTION_SET_IDS.Pathogens, page: 1, pageSize: 200, search: id });
        const item = resp.options.find(o => o.id === id);
        if (!item) {
          message.error('未找到该病原体信息。');
          navigate('/pathogens');
          return;
        }
        setSortOrder(item.sortOrder ?? 0);
        setCodeValue(item.code || '');
        setDisplayName(item.displayName || item.name || '');

        const scientificName = (item.attributeValues || []).find(a => a.attribute.id === ATTRIBUTE_IDS.SCIENTIFIC_NAME)?.value as string | undefined;
        const type = (item.attributeValues || []).find(a => a.attribute.id === ATTRIBUTE_IDS.PATHOGEN_TYPE)?.value as string | undefined;
        const bsl = (item.attributeValues || []).find(a => a.attribute.id === ATTRIBUTE_IDS.BSL)?.value as string | undefined;
        const enabled = String((item.attributeValues || []).find(a => a.attribute.id === ATTRIBUTE_IDS.ENABLED)?.value) === 'true';
        const associatedDiseases = (item.attributeValues || []).find(a => a.attribute.id === ATTRIBUTE_IDS.ASSOCIATED_DISEASES)?.value as string | undefined;
        const description = (item.attributeValues || []).find(a => a.attribute.id === ATTRIBUTE_IDS.PATHOGEN_DESC)?.value as string | undefined;

        form.setFieldsValue({
          pathogenCode: item.code,
          pathogenName: item.displayName || item.name || '',
          pathogenType: type || undefined,
          scientificName: scientificName || '',
          associatedDiseases: associatedDiseases || '',
          description: description || '',
          biosafettyLevel: bsl || undefined,
          isActive: enabled,
        });
      } catch (e: any) {
        message.error(e?.message || '加载失败');
        navigate('/pathogens');
      } finally {
        setLoading(false);
      }
    })();
  }, [id, navigate, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const payload = fromPathogenFormToPayload(values as any, sortOrder);
      // PUT for editing with mergeMode=REPLACE
      const path = `/api/29/options/${id}`;
      const params = { mergeMode: 'REPLACE' };
      await dhis2Client.put(path, {
        ...(payload as any),
        id,
        code: codeValue,
      }, params);
      message.success('病原体信息更新成功!');
      navigate('/pathogens');
    } catch (error: any) {
      message.error(error?.message || '保存失败，请检查表单填写项。');
    }
  };

  const handleCancel = () => {
    navigate('/pathogens');
  };

  if (loading) {
    return <Spin size="large" style={{ display: 'block', margin: '50px auto' }} />;
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={4}>编辑病原体：{displayName || codeValue}</Title>
      <PathogenForm form={form} disableCode initialValues={form.getFieldsValue()} />
      <div style={{ textAlign: 'right', marginTop: 24 }}>
        <Space>
          <Button onClick={handleCancel}>取消</Button>
          <Button type="primary" onClick={handleSubmit}>保存</Button>
        </Space>
      </div>
    </Space>
  );
};

export default EditPathogen;