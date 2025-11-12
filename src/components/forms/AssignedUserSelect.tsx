import { useState } from 'react';
import { Select, Spin, Empty } from 'antd';
import type { SelectProps } from 'antd';
import { searchUsers } from '../../services/unknownCase/labTest';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';

interface AssignedUserSelectProps {
  value?: string;
  onChange?: (value?: string, user?: any) => void;
}

const AssignedUserSelect = ({ value, onChange }: AssignedUserSelectProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);

  const debouncedQuery = useDebouncedValue(searchQuery, 400);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (!query || query.length < 2) {
      setUsers([]);
      return;
    }

    setLoading(true);
    try {
      const result = await searchUsers(query);
      setUsers(result.users || []);
    } catch (error) {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (userId?: string) => {
    const user = users.find((u) => u.id === userId);
    setSelectedUser(user);
    onChange?.(userId, user);
  };

  const options = users.map((user) => ({
    value: user.id,
    label: user.displayName,
  }));

  return (
    <Select
      showSearch
      allowClear
      placeholder="请输入用户名搜索"
      value={value}
      onSearch={handleSearch}
      onChange={handleChange}
      loading={loading}
      options={options}
      filterOption={false}
      notFoundContent={
        loading ? <Spin size="small" /> : searchQuery && !users.length ? <Empty description="没有结果" /> : null
      }
    />
  );
};

export default AssignedUserSelect;