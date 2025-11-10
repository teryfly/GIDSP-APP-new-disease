import { useState } from 'react';
import { Button, Input, Space, List, Card, Typography, message } from 'antd';
import { getCurrentUser } from '../../services/userLookup';

const { TextArea } = Input;
const { Text } = Typography;

export interface NoteItem {
  value: string;
  createdBy?: string;
}

interface NotesEditorProps {
  notes: NoteItem[];
  onChange: (notes: NoteItem[]) => void;
}

export default function NotesEditor({ notes, onChange }: NotesEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [noteValue, setNoteValue] = useState('');

  const handleAddNote = async () => {
    const v = noteValue.trim();
    if (!v) {
      message.warning('请输入笔记内容');
      return;
    }
    try {
      const me = await getCurrentUser();
      const createdBy = `${me.firstName} ${me.surname}`.trim();
      onChange([...(notes || []), { value: v, createdBy }]);
      setNoteValue('');
      setIsEditing(false);
      message.success('笔记添加成功');
    } catch (e: any) {
      message.error(e.message || '获取当前用户失败');
    }
  };

  return (
    <Card title="笔记">
      <Space direction="vertical" style={{ width: '100%' }}>
        {!isEditing ? (
          <Button onClick={() => setIsEditing(true)}>编写说明</Button>
        ) : (
          <>
            <TextArea rows={3} value={noteValue} onChange={(e) => setNoteValue(e.target.value)} placeholder="请输入笔记内容" />
            <Space>
              <Button type="primary" onClick={handleAddNote}>添加笔记</Button>
              <Button onClick={() => { setIsEditing(false); setNoteValue(''); }}>取消</Button>
            </Space>
          </>
        )}
        {(notes || []).length > 0 && (
          <List
            dataSource={notes}
            renderItem={(n, i) => (
              <List.Item key={i}>
                <Text>{n.createdBy ? `${n.createdBy}: ` : ''}{n.value}</Text>
              </List.Item>
            )}
          />
        )}
      </Space>
    </Card>
  );
}