import { Form, Button, Space, message, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';
import PathogenForm from '../../components/forms/PathogenForm';
import type { PathogenFormData } from '../../types/forms';
import { createOption, listOptions } from '../../api/optionsService';
import { fromPathogenFormToPayload } from '../../utils/optionMapping';
import { OPTION_SET_IDS } from '../../types/dhis2';

const { Title } = Typography;

const NewPathogen = () => {
  const [form] = Form.useForm<PathogenFormData>();
  const navigate = useNavigate();

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const resp = await listOptions({ optionSetId: OPTION_SET_IDS.Pathogens, page: 1, pageSize: 1 });
      const sortOrder = (resp.pager?.total || 0) + 1;
      const payload = fromPathogenFormToPayload(values as any, sortOrder);
      await createOption(payload as any);
      message.success('病原体信息创建成功!');
      navigate('/pathogens');
    } catch (error: any) {
      message.error(error?.message || '创建失败，请检查表单填写项。');
    }
  };

  const handleCancel = () => {
    navigate('/pathogens');
  };

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={4}>新增病原体</Title>
      <PathogenForm form={form} />
      <div style={{ textAlign: 'right', marginTop: 24 }}>
        <Space>
          <Button onClick={handleCancel}>取消</Button>
          <Button type="primary" onClick={handleSubmit}>保存</Button>
        </Space>
      </div>
    </Space>
  );
};

export default NewPathogen;