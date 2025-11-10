import { useState } from 'react';
import { Select, Spin, Empty, Card } from 'antd';
import { searchUsers } from '../../services/userLookup';

interface AssigneeSelectProps {
  value?: { uid: string; displayName: string; username: string; firstName: string; surname: string } | null;
  onChange?: (user: AssigneeSelectProps['value']) => void;
}

export default function AssigneeSelect({ value, onChange }: AssigneeSelectProps) {
  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState<Array<{ value: string; label: string; raw: any }>>([]);

  const handleSearch = async (q: string) => {
    if (!q || q.length < 2) {
      setOptions([]);
      return;
    }
    setLoading(true);
    try {
      const res = await searchUsers(q);
      setOptions((res.users || []).map(u => ({ value: u.id, label: u.displayName, raw: u })));
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (_: string, opt: any) => {
    if (!opt) return onChange?.(null);
    const u = opt.raw;
    onChange?.({
      uid: u.id,
      displayName: u.displayName,
      username: u.username,
      firstName: u.firstName,
      surname: u.surname,
    });
  };

  return (
    <Card title="分配者">
      <Select
        showSearch
        allowClear
        placeholder="输入用户名搜索分配者"
        value={value?.uid}
        onSearch={handleSearch}
        onChange={handleSelect}
        loading={loading}
        filterOption={false}
        options={options}
        notFoundContent={loading ? <Spin size="small" /> : <Empty description="没有结果" />}
        style={{ width: '100%' }}
      />
    </Card>
  );
}