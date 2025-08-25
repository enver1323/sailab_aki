import {
    Line,
    LineChart,
    Tooltip,
    XAxis,
    YAxis,
    ResponsiveContainer
} from "recharts";
import { COLORS, getDayAxisKey, getDayTicks } from "@/components/utils/graphUtils"
import { StarDot } from "@/components/graphs/atomic/LRPStarDot"
import { ITimeSeriesData } from "@/types/patientDetails";
import styled from "styled-components";
import { DateTooltip } from "../utils/GraphTooltip";

const GraphRow = styled.div`
    display: flex;
`


const PrescriptionGraph: React.FC<{ data: ITimeSeriesData['prescription_data'] }> = ({ data }) => {
    const height = 360;

    const allDataKeys = data.daily.length > 0 ? Object.keys(data.daily[0]) : []
    const dataColumns: string[] = []
    const lrpColumns: string[] = []

    for (const k of allDataKeys) {
        if (k in {'day': true, 'slot': true, 'date': true})
            continue;
        if (k.substring(k.length - 3) === 'lrp')
            lrpColumns.push(k)
        else
            dataColumns.push(k)
    }

    return (
        <GraphRow>
            <ResponsiveContainer width="100%" height={height}>
                <LineChart data={data.pre6m.map(datum => ({
                    ...datum,
                    tick: "입원 전 6개월 이내"
                }))}>
                    <YAxis yAxisId="value" type="category" fontSize={10} />
                    <XAxis dataKey="tick" fontSize={14}></XAxis>
                    {dataColumns.map((col, id) =>
                        <Line
                            yAxisId="value"
                            name={col}
                            dataKey={col}
                            type="linear"
                            stroke={COLORS[id]}
                            strokeWidth={3}
                            key={col}
                            fill={COLORS[id]}
                        />
                    )}
                    {lrpColumns.map((col, id) =>
                        <Line
                            yAxisId="value"
                            dataKey={col}
                            dot={<StarDot />}
                            key={col}
                            stroke={COLORS[id]}
                            strokeWidth={3}
                            legendType="none"
                        />
                    )}
                    <Tooltip contentStyle={{ fontSize: 14 }} />
                </LineChart>
            </ResponsiveContainer>
            <ResponsiveContainer width="100%" height={height}>
                <LineChart data={data.daily.map((item) => ({
                    ...item,
                    tick: getDayAxisKey(item)
                }))}>
                    <YAxis yAxisId="value" ticks={dataColumns} type="category" fontSize={10} />
                    <XAxis dataKey="tick" fontSize={14}>
                    </XAxis>
                    {dataColumns.map((col, id) =>
                        <Line
                            yAxisId="value"
                            name={col}
                            dataKey={col}
                            type="linear"
                            dot={true}
                            stroke={COLORS[id]}
                            strokeWidth={3}
                            key={col}
                            fill={COLORS[id]}
                        />
                    )}
                    {lrpColumns.map((col, id) =>
                        <Line
                            yAxisId="value"
                            dataKey={col}
                            dot={<StarDot />}
                            key={col}
                            stroke={COLORS[id]}
                            strokeWidth={3}
                            legendType="none"
                        />
                    )}
                    <Tooltip contentStyle={{ fontSize: 14 }} content={<DateTooltip />} />
                </LineChart>
            </ResponsiveContainer>
        </GraphRow>
    );
};

export default PrescriptionGraph;
