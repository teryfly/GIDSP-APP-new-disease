import { useEffect, useState } from 'react';
import { Select } from 'antd';
import type { OrgUnit } from '../../services/caseService2';
import { getOrgUnitsByPath, getMe } from '../../services/caseService2';

interface Props {
  value?: string;
  onChange?: (val?: string) => void;
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

  return (
    <Select
      showSearch
      allowClear
      placeholder="全部"
      value={value}
      onChange={onChange}
      loading={loading}
      options={options}
      filterOption={(input, option) => (option?.label as string)?.toLowerCase().includes(input.toLowerCase())}
    />
  );
};

export default OrgUnitSelect;