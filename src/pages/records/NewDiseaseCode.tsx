import { Form, Button, Space, message, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';
import DiseaseCodeForm from '../../components/forms/DiseaseCodeForm';
import type { DiseaseCodeFormData } from '../../types/forms';
import { createOption, listOptions } from '../../api/optionsService';
import { fromDiseaseFormToPayload } from '../../utils/optionMapping';
import { OPTION_SET_IDS } from '../../types/dhis2';

const { Title } = Typography;

const NewDiseaseCode = () => {
  const [form] = Form.useForm<DiseaseCodeFormData>();
  const navigate = useNavigate();

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const resp = await listOptions({ optionSetId: OPTION_SET_IDS.DiseaseCodes, page: 1, pageSize: 1 });
      const sortOrder = (resp.pager?.total || 0) + 1;
      const payload = fromDiseaseFormToPayload(values as any, sortOrder);
      await createOption(payload as any);
      message.success('疾病编码创建成功!');
      navigate('/disease-codes');
    } catch (error: any) {
      message.error(error?.message || '创建失败，请检查表单填写项。');
    }
  };

  const handleCancel = () => {
    navigate('/disease-codes');
  };

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={4}>新增疾病编码</Title>
      <DiseaseCodeForm form={form} />
      <div style={{ textAlign: 'right', marginTop: 24 }}>
        <Space>
          <Button onClick={handleCancel}>取消</Button>
          <Button type="primary" onClick={handleSubmit}>保存</Button>
        </Space>
      </div>
    </Space>
  );
};

export default NewDiseaseCode;