import { useState, useEffect } from 'react';
import { Select } from 'antd';
import config from '../config.json';

const { Option } = Select;

const Statistics = () => {
    // 定义统计表选项
    const statisticTables = [
        {
            id: '1',
            name: '病原微生物目录地区统计表',
            path: '/apps/dashboard#/Sk8HZSxCfIx'
        },
        {
            id: '2',
            name: '病原微生物目录分类统计表',
            path: '/apps/dashboard#/F6pt2kbYEL5'
        },
        {
            id: '3',
            name: '检疫传染病分地区统计表',
            path: '/apps/dashboard#/h8gRLy29qKo'
        }
    ];

    const [selectedTable, setSelectedTable] = useState(statisticTables[0]);
    const [baseUrl, setBaseUrl] = useState('');

    // 根据配置确定基础URL
    useEffect(() => {
        // 与dhis2Client.ts保持一致的逻辑
        const useUrlConfig = config.dhis2?.useUrlIs === true;
        if (useUrlConfig && config.dhis2?.baseUrl) {
            setBaseUrl(config.dhis2.baseUrl.replace(/\/+$/, ''));
        } else {
            // 使用当前服务器地址
            setBaseUrl(window.location.origin);
        }
    }, []);

    // 构建完整的iframe URL
    const buildIframeUrl = () => {
        return `${baseUrl}${selectedTable.path}`;
    };

    const handleTableChange = (value: string) => {
        const table = statisticTables.find(t => t.id === value);
        if (table) {
            setSelectedTable(table);
        }
    };

    return (
        <div style={{ position: 'relative', height: '800px', width: '100%' }}>
            {/* 遮罩层，隐藏顶部60px的内容，并包含选择器 */}
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '60px',
                backgroundColor: 'white',
                zIndex: 10,
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 20px'
            }}>
                <h2 style={{ margin: 0 }}>统计分析</h2>
                <Select 
                    value={selectedTable.id} 
                    onChange={handleTableChange}
                    style={{ width: 250 }}
                >
                    {statisticTables.map(table => (
                        <Option key={table.id} value={table.id}>{table.name}</Option>
                    ))}
                </Select>
            </div>
            
            {/* iframe容器 */}
            <iframe
                src={buildIframeUrl()}
                style={{
                    width: '100%',
                    height: '100%',
                    border: 'none',
                    marginTop: '0px'
                }}
                title={selectedTable.name}
            />
        </div>
    );
};

export default Statistics;