export interface Case {
  id: string;
  caseNo: string;
  patientName: string;
  disease: string;
  reportDate: string;
  status: '待核实' | '处理中' | '已关闭';
  gender: '男' | '女';
  age: number;
  idCard: string;
  phone: string;
  address: string;
  reportUnit: string;
  reporter: string;
  symptomOnsetDate: string;
  diagnosisDate: string;
  diagnosis: string;
  source: string;
}

export const cases: Case[] = [
  {
    id: '1',
    caseNo: 'CAS-2024-156',
    patientName: '张三',
    disease: '新冠肺炎',
    reportDate: '2024-01-15',
    status: '待核实',
    gender: '男',
    age: 45,
    idCard: '110101197901011234',
    phone: '138****5678',
    address: '北京市朝阳区XX街道XX小区XX号楼XX单元',
    reportUnit: '北京市朝阳区疾控中心',
    reporter: '李医生',
    symptomOnsetDate: '2024-01-10',
    diagnosisDate: '2024-01-14',
    diagnosis: '新冠肺炎（待核实）',
    source: '主动监测',
  },
  {
    id: '2',
    caseNo: 'CAS-2024-155',
    patientName: '李四',
    disease: '霍乱',
    reportDate: '2024-01-15',
    status: '待核实',
    gender: '女',
    age: 32,
    idCard: '440101199203045678',
    phone: '139****1234',
    address: '广东省广州市天河区XX路',
    reportUnit: '广州市天河区疾控中心',
    reporter: '王医生',
    symptomOnsetDate: '2024-01-12',
    diagnosisDate: '2024-01-15',
    diagnosis: '霍乱',
    source: '被动报告',
  },
  {
    id: '3',
    caseNo: 'CAS-2024-154',
    patientName: '王五',
    disease: '鼠疫',
    reportDate: '2024-01-14',
    status: '处理中',
    gender: '男',
    age: 50,
    idCard: '51010119740506123X',
    phone: '137****8765',
    address: '四川省成都市武侯区XX街',
    reportUnit: '成都市武侯区疾控中心',
    reporter: '赵医生',
    symptomOnsetDate: '2024-01-11',
    diagnosisDate: '2024-01-14',
    diagnosis: '鼠疫',
    source: '主动监测',
  },
  {
    id: '4',
    caseNo: 'CAS-2024-153',
    patientName: '赵六',
    disease: '新冠肺炎',
    reportDate: '2024-01-14',
    status: '处理中',
    gender: '男',
    age: 28,
    idCard: '310101199608094321',
    phone: '136****5432',
    address: '上海市浦东新区XX大道',
    reportUnit: '上海市浦东新区疾控中心',
    reporter: '孙医生',
    symptomOnsetDate: '2024-01-10',
    diagnosisDate: '2024-01-13',
    diagnosis: '新冠肺炎',
    source: '被动报告',
  },
  {
    id: '5',
    caseNo: 'CAS-2024-152',
    patientName: '孙七',
    disease: '霍乱',
    reportDate: '2024-01-13',
    status: '已关闭',
    gender: '女',
    age: 65,
    idCard: '330101195911128765',
    phone: '135****9876',
    address: '浙江省杭州市西湖区XX路',
    reportUnit: '杭州市西湖区疾控中心',
    reporter: '周医生',
    symptomOnsetDate: '2024-01-09',
    diagnosisDate: '2024-01-12',
    diagnosis: '霍乱',
    source: '主动监测',
  },
];