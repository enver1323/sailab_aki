import {
    CartesianGrid,
    Legend,
    Line,
    LineChart,
    Tooltip,
    XAxis,
    YAxis,
    Label,
    ResponsiveContainer,
    DotProps,
    Area,
    AreaChart,
    ComposedChart
} from "recharts";
import { StarDot } from "@/components/graphs/atomic/LRPStarDot"
import { COLORS, getDayAxisKey, getDayTicks } from "@/components/utils/graphUtils"
import { LongRangeEntry, MidRangeEntry, SmallRangeEntry } from "@/types/patientDetails";
import { DateTooltip } from "../utils/GraphTooltip";

type PredictionGraphProps = {
    data: Array<LongRangeEntry | MidRangeEntry | SmallRangeEntry>;
}

const VitalGraph: React.FC<PredictionGraphProps> = ({ data }) => {
    const height = 260;
    const offset = 5;

    const allDataKeys = data.length > 0 ? Object.keys(data[0]) : []
    const dataColumns = []
    const lrpColumns = []
    const areaColumns = []

    for (const k of allDataKeys) {
        if (k in { 'day': true, 'slot': true, 'date': true })
            continue;
        if (k.substring(k.length - 3) === 'lrp')
            lrpColumns.push(k)
        else if (k.substring(k.length - 4) === 'area')
            areaColumns.push(k)
        else
            dataColumns.push(k)
    }

    const allValueColumns = [...areaColumns, ...dataColumns]
    const allDataValues = data
        .map(datum => allValueColumns.map(col => datum[(col as keyof typeof datum)]))
        .flat(Infinity)
        .filter(val => !!val) as number[]

    const domain = data.length > 0 ? [
        Math.min(...allDataValues) - offset,
        Math.max(...allDataValues) + offset
    ] : ['auto', 'auto'];


    return (
        <ResponsiveContainer width="100%" height={height}>
            <ComposedChart
                data={data.map((item) => ({
                    ...item,
                    tick: getDayAxisKey(item),
                }))}
            >
                <YAxis yAxisId="value" tickCount={5} domain={domain} />
                <XAxis dataKey="tick" tickCount={7}>
                    <Label value="입원 후 일수" position="top" style={{ textAnchor: "middle" }} />
                </XAxis>
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
                        connectNulls
                    />
                )}
                {areaColumns.map((col, id) =>
                    <Area
                        yAxisId="value"
                        name={col}
                        dataKey={col}
                        type="linear"
                        stroke={COLORS[id]}
                        strokeWidth={1}
                        key={col}
                        fill={COLORS[id]}
                        connectNulls
                        legendType="none"
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
            </ComposedChart>
        </ResponsiveContainer>
    );
};

export default VitalGraph;
