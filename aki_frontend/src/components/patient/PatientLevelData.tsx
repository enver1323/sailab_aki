import { SectionSubTitle, SectionTitle } from '@/routes/predictions/atomic/Titles';
import React from 'react';
import { PieChart, Pie, Cell } from 'recharts';
import styled from 'styled-components';

const DataRow = styled.div`
    display: flex;
    width: 100%;
`

const DataCol = styled.div`
    margin: 0 2rem;
    font-size: ${(props) => props.theme.font.size.m};
    flex-grow: 1;
`

const RADIAN = Math.PI / 180;
const data = [
    { name: 'Safe', value: 0.33333, color: '#00ff00' },
    { name: 'Normal', value: 0.33333, color: '#ffff00' },
    { name: 'Severe', value: 0.33333, color: '#ff0000' },
];
const cx = 150;
const cy = 200;
const iR = 50;
const oR = 100;

const needle = (value: number, data: any[], cx: number, cy: number, iR: number, oR: number, color: string) => {
    let total = 0;
    data.forEach((v) => {
        total += v.value;
    });
    const ang = 180.0 * (1 - value / total);
    const length = (iR + 2 * oR) / 3;
    const sin = Math.sin(-RADIAN * ang);
    const cos = Math.cos(-RADIAN * ang);
    const r = 5;
    const x0 = cx + 5;
    const y0 = cy + 5;
    const xba = x0 + r * sin;
    const yba = y0 - r * cos;
    const xbb = x0 - r * sin;
    const ybb = y0 + r * cos;
    const xp = x0 + length * cos;
    const yp = y0 + length * sin;

    return [
        <circle cx={x0} cy={y0} r={r} fill={color} stroke="none"/>,
        <path d={`M${xba} ${yba}L${xbb} ${ybb} L${xp} ${yp} L${xba} ${yba}`} stroke="#none" fill={color}/>
    ];
};

export const PatientLevelData: React.FC<{ value: number, threshold: number }> = ({ value, threshold }) => {
    return (
        <DataRow>
            <PieChart height={210} width={260}>
                <Pie
                    dataKey="value"
                    startAngle={180}
                    endAngle={0}
                    data={data}
                    cx={cx}
                    cy={cy}
                    innerRadius={iR}
                    outerRadius={oR}
                    fill="#8884d8"
                    stroke="none"
                >
                    {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                </Pie>
                {...needle(value, data, cx, cy, iR, oR, '#0000ff')}
            </PieChart>
            <DataCol>
                <SectionTitle>예측 결과</SectionTitle>
                <SectionSubTitle>모델 예측: 정상</SectionSubTitle>
                <SectionSubTitle>위혐도: {(value * 100).toFixed(2)}%</SectionSubTitle>

                <SectionTitle>실제 결과</SectionTitle>
                <SectionSubTitle>실제 AKI 발생: 정상</SectionSubTitle>
            </DataCol>
            <DataCol>
                <SectionTitle>추가 설명</SectionTitle>
                <ul>
                    <li>위험도 점수가 {(threshold * 100).toFixed()}% 이삼일 때 AKI 발생으로 예측합니다.</li>
                    <li>임계값 ({(threshold * 100).toFixed()}%) 이상인 경우 게이지가 주황색으로 변합니다</li>
                </ul>

            </DataCol>
        </DataRow>
    );
}
