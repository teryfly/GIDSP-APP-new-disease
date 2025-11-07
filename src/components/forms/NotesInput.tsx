import { useState } from 'react';
import { Button, Input, Space, List, Card, Typography, message } from 'antd';
import type { NoteData } from '../../types/labTest';
import { getCurrentUser } from '../../services/unknownCase/labTest';

const { TextArea } = Input;
const { Text } = Typography;

interface NotesInputProps {
  notes: NoteData[];
  onChange: (notes: NoteData[]) => void;
}

const NotesInput = ({ notes, onChange }: NotesInputProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [noteValue, setNoteValue] = useState('');

  const handleAddNote = async () => {
    if (!noteValue.trim()) {
      message.warning('请输入笔记内容');
      return;
    }

    try {
      const user = await getCurrentUser();
      const displayName = `${user.firstName} ${user.surname}`;
      const newNote: NoteData = {
        id: `note-${Date.now()}`,
        value: noteValue,
        createdBy: displayName,
      };

      onChange([...notes, newNote]);
      setNoteValue('');
      setIsEditing(false);
      message.success('笔记添加成功');
    } catch (e: any) {
      message.error(`添加笔记失败: ${e.message}`);
    }
  };

  const handleCancel = () => {
    setNoteValue('');
    setIsEditing(false);
  };

  return (
    <Card title="笔记">
      <Space direction="vertical" style={{ width: '100%' }}>
        {!isEditing ? (
          <Button onClick={() => setIsEditing(true)}>编写说明</Button>
        ) : (
          <>
            <TextArea
              rows={4}
              value={noteValue}
              onChange={(e) => setNoteValue(e.target.value)}
              placeholder="请输入笔记内容"
            />
            <Space>
              <Button type="primary" onClick={handleAddNote}>
                添加笔记
              </Button>
              <Button onClick={handleCancel}>取消</Button>
            </Space>
          </>
        )}

        {notes.length > 0 && (
          <List
            dataSource={notes}
            renderItem={(note) => (
              <List.Item key={note.id}>
                <Text>
                  {note.createdBy}: {note.value}
                </Text>
              </List.Item>
            )}
          />
        )}
      </Space>
    </Card>
  );
};

export default NotesInput;