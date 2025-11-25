import {
    Tooltip,
    XAxis,
    YAxis,
    ResponsiveContainer,
    BarChart,
    Bar,
    TooltipProps,
    DefaultTooltipContent
} from "recharts";
import { COLORS } from "@/components/utils/graphUtils"
import { SurgicalDataEntry } from "@/types/patientDetails";
import { Payload, ValueType } from "recharts/types/component/DefaultTooltipContent";
import { getGraphEvaluator } from "@/utils/evaluation";

const CustomTooltip: React.FC<TooltipProps<any, any>> = (props) => {
    const { payload } = props

    const updatedPayload = (!payload || payload?.length == 0)
        ? payload
        : Object.entries(payload[0].payload).map(([k, v]) => (
            {
                name: k,
                value: k !== 'date' ? v : new Date(v as number).toLocaleDateString('ko-Kr')
            }
        ));
    const updatedProps = {
        ...props,
        payload: updatedPayload as Payload<ValueType, any>[]
    }

    return <DefaultTooltipContent {...updatedProps} />
}

const SurgeryTimeGraph: React.FC<{ data: SurgicalDataEntry[] }> = ({ data }) => {
    const height = 360;

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

    const clickHandler = getGraphEvaluator()

    return (
        <ResponsiveContainer width="100%" height={height}>
            <BarChart
                data={data.map((item) => ({
                    ...item,
                }))}
                onClick={clickHandler}
            >
                <YAxis yAxisId="value" tickCount={5} fontSize={14} />
                <XAxis dataKey="day" tickCount={7} fontSize={14} />
                <Bar
                    yAxisId="value"
                    name="surgery_time"
                    dataKey="surgery_time"
                    type="linear"
                    strokeWidth={3}
                    fill={COLORS[0]}
                />
                <Tooltip contentStyle={{ fontSize: 14 }} content={<CustomTooltip />} />
            </BarChart>
        </ResponsiveContainer>
    );
};

export default SurgeryTimeGraph;
