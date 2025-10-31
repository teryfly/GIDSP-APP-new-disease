import { useState, useEffect } from 'react';
import { Modal, Button, Steps, Result, Descriptions, Spin, Alert } from 'antd';
import { CheckCircleOutlined, SyncOutlined } from '@ant-design/icons';
import type { UnknownCase } from '../data/unknownCases';

interface PushCaseFlowProps {
    visible: boolean;
    onClose: () => void;
    caseData: UnknownCase | null;
}

const PushCaseFlow = ({ visible, onClose, caseData }: PushCaseFlowProps) => {
    const [step, setStep] = useState(0); // 0: confirm, 1: progress, 2: result
    const [progress, setProgress] = useState(0);
    const [progressStatus, setProgressStatus] = useState<any>('process');
    const [newCaseNo, setNewCaseNo] = useState('');

    useEffect(() => {
        if (step === 1) {
            const timer = setInterval(() => {
                setProgress(prev => {
                    if (prev >= 100) {
                        clearInterval(timer);
                        setStep(2);
                        return 100;
                    }
                    return prev + 20;
                });
            }, 500);

            // Simulate generating a new case number
            setNewCaseNo(`CAS-2024-${Math.floor(Math.random() * 1000)}`);

            return () => clearInterval(timer);
        }
    }, [step]);
    
    const handlePush = () => {
        setStep(1);
    };

    const handleClose = () => {
        setStep(0);
        setProgress(0);
        setProgressStatus('process');
        onClose();
    };

    const renderConfirmModal = () => (
        <Modal
            title="推送病例至个案管理"
            open={visible}
            onCancel={handleClose}
            footer={[
                <Button key="back" onClick={handleClose}>取消</Button>,
                <Button key="submit" type="primary" onClick={handlePush}>确认推送</Button>,
            ]}
            width={600}
        >
            <p>确认将以下病例推送至个案管理系统？</p>
            <Descriptions bordered column={1} size="small">
                <Descriptions.Item label="病例编号">{caseData?.caseNo}</Descriptions.Item>
                <Descriptions.Item label="患者姓名">{caseData?.patientName}</Descriptions.Item>
                <Descriptions.Item label="确诊疾病">{caseData?.confirmedDisease}</Descriptions.Item>
            </Descriptions>
            <Alert
                style={{ marginTop: 16 }}
                message="推送后将执行以下操作:"
                description={
                    <ul>
                        <li>自动创建个案记录</li>
                        <li>复制检测记录至个案</li>
                        <li>推送至应急指挥系统</li>
                        <li>更新不明原因病例状态为"已推送"</li>
                    </ul>
                }
                type="info"
            />
            <Alert
                style={{ marginTop: 16 }}
                message="注意: 推送后将无法撤销，请确认信息无误。"
                type="warning"
                showIcon
            />
        </Modal>
    );

    const renderProgressModal = () => (
        <Modal
            title="正在推送病例..."
            open={visible}
            closable={false}
            footer={null}
        >
            <Steps direction="vertical" current={Math.floor(progress / 25)} status={progressStatus}>
                <Steps.Step title="数据校验" icon={progress >= 0 ? <CheckCircleOutlined /> : <Spin />} />
                <Steps.Step title="创建个案记录" icon={progress >= 25 ? <CheckCircleOutlined /> : <Spin />} description={progress >= 25 ? `新个案编号: ${newCaseNo}` : ''}/>
                <Steps.Step title="复制检测记录" icon={progress >= 50 ? <CheckCircleOutlined /> : <Spin />} />
                <Steps.Step title="推送至应急指挥系统" icon={progress >= 75 ? <SyncOutlined spin /> : <Spin />} />
                <Steps.Step title="更新病例状态" icon={progress >= 100 ? <CheckCircleOutlined /> : <Spin />} />
            </Steps>
        </Modal>
    );
    
    const renderResultModal = () => (
        <Modal
            title="推送完成"
            open={visible}
            onCancel={handleClose}
            footer={[
                <Button key="viewCase" type="primary" onClick={handleClose}>查看个案详情</Button>,
                <Button key="back" onClick={handleClose}>返回病例列表</Button>,
            ]}
        >
            <Result
                status="success"
                title="病例推送成功！"
                subTitle={`已成功创建个案记录 ${newCaseNo}。`}
            />
        </Modal>
    );

    if (!visible) return null;

    if (step === 1) return renderProgressModal();
    if (step === 2) return renderResultModal();
    return renderConfirmModal();
};

export default PushCaseFlow;