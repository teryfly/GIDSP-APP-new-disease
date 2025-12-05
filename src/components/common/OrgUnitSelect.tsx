import { useEffect, useState } from 'react';
import { Select } from 'antd';
import type { OrgUnit } from '../../services/caseService2';
import { getOrgUnitsByPath, getMe } from '../../services/caseService2';

interface Props {
  value?: string;
  onChange?: (val?: string, option?: { value: string; label: string }) => void;
}

const OrgUnitSelect = ({ value, onChange }: Props) => {
  const [options, setOptions] = useState<{ value: string; label: string }[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const me = await getMe();
        const path = me.organisationUnits?.[0]?.path || '';
        const ous: OrgUnit[] = await getOrgUnitsByPath(path.substring(0, path.lastIndexOf('/')) || path);
        const opts = ous.map((ou) => ({ value: ou.id, label: ou.name }));
        setOptions(opts);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // 处理选择变化
  const handleChange = (val?: string, option?: any) => {
    // 调用外部传入的onChange
    if (onChange) {
      onChange(val, option);
    }
  };

  return (
    <Select
      showSearch
      allowClear
      placeholder="请选择"
      value={value}
      onChange={handleChange}
      loading={loading}
      options={options}
      filterOption={(input, option) => (option?.label as string)?.toLowerCase().includes(input.toLowerCase())}
    />
  );
};

export default OrgUnitSelect;