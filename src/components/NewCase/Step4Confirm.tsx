import { Descriptions, Typography, Divider } from 'antd';

const { Title } = Typography;

// This component will receive form data as props in a real implementation
const Step4Confirm = () => {
    return (
        <div>
            <Title level={4}>确认提交</Title>
            <p>请核对您填写的信息，确认无误后提交。</p>
            
            <Title level={5} style={{ marginTop: 24 }}>患者基本信息</Title>
            <Divider />
            <Descriptions bordered column={2}>
                <Descriptions.Item label="疾病类型">新冠肺炎</Descriptions.Item>
                <Descriptions.Item label="患者姓名">张三</Descriptions.Item>
                <Descriptions.Item label="性别">男</Descriptions.Item>
                <Descriptions.Item label="身份证号">110101197901011234</Descriptions.Item>
                <Descriptions.Item label="联系电话">138****5678</Descriptions.Item>
                <Descriptions.Item label="现住地址">北京市朝阳区XX街道XX小区XX号楼XX单元</Descriptions.Item>
            </Descriptions>
            
            <Title level={5} style={{ marginTop: 24 }}>报告信息</Title>
            <Divider />
            <Descriptions bordered column={2}>
                <Descriptions.Item label="报告单位">北京市朝阳区疾控中心</Descriptions.Item>
                <Descriptions.Item label="报告人员">李医生</Descriptions.Item>
                <Descriptions.Item label="报告日期">2024-01-15</Descriptions.Item>
                <Descriptions.Item label="症状开始日期">2024-01-10</Descriptions.Item>
            </Descriptions>

            <Title level={5} style={{ marginTop: 24 }}>流行病学信息</Title>
            <Divider />
             <Descriptions bordered column={1}>
                <Descriptions.Item label="暴露史">无</Descriptions.Item>
                <Descriptions.Item label="接触史">无</Descriptions.Item>
                <Descriptions.Item label="旅行史">2024-01-01至01-07期间前往XX省XX市</Descriptions.Item>
            </Descriptions>

            <Title level={5} style={{ marginTop: 24 }}>诊断信息</Title>
            <Divider />
            <Descriptions bordered column={2}>
                <Descriptions.Item label="初步诊断">疑似新冠肺炎</Descriptions.Item>
                <Descriptions.Item label="诊断日期">2024-01-14</Descriptions.Item>
                <Descriptions.Item label="个案来源">主动监测</Descriptions.Item>
                <Descriptions.Item label="症状">发热, 咳嗽</Descriptions.Item>
            </Descriptions>
        </div>
    );
};

export default Step4Confirm;