import { Dispatch, ReactElement, SVGProps, SetStateAction } from "react";
import {
  Legend,
  Line,
  LineChart,
  ReferenceArea,
  ReferenceLine,
  Tooltip,
  XAxis,
  YAxis,
  Label,
  ResponsiveContainer
} from "recharts";
import { ITimeSeriesData, TimeSeriesEntry } from "@/types/patientDetails";
import { getDayKey } from "@/components/utils/graphUtils"
import { DateTooltip } from "@/components//utils/GraphTooltip";

type TickType =
  | SVGProps<SVGTextElement>
  | ReactElement<SVGElement>
  | ((props: any) => ReactElement<SVGElement>)
  | boolean;

const XAxisTick: TickType = ({ x, y, stroke, payload }: any) => (
  <g transform={`translate(${x},${y})`}>
    <text
      x={0}
      y={0}
      dy={0}
      textAnchor="middle"
      fill="#666"
      transform="rotate(-35)"
      fontSize="0.4em"
    >{payload.value}</text>
  </g>
);

const getReferenceRegions = (data: ITimeSeriesData["prob_data"], condition: ((datum: TimeSeriesEntry) => boolean)) => {
  const regions: Array<Array<string>> = [];
  let lastProbKey: string | null = null;
  data.forEach((datum) => {
    const key = getDayKey(datum);

    if (condition(datum)) {
      if (
        regions.length === 0 ||
        (regions.length > 0 && regions[regions.length - 1].length === 2)
      )
        regions.push([key]);
      lastProbKey = key;
    } else if (lastProbKey !== null) {
      regions[regions.length - 1].push(lastProbKey);
      lastProbKey = null;
    }
  });
  if (regions.length > 0 && regions[regions.length - 1].length === 1)
    regions[regions.length - 1].push(getDayKey(data[data.length - 1]));
  return regions;
};

const getPredictionSteps = (data: ITimeSeriesData["prob_data"]) => {
  const maxDay = Math.max(0, Math.trunc((data ?? []).length / 3))

  return data
    .filter((item) => item.probability_daily && item.day + 1 < data.length)
    .map(({ day, probability_daily }) => ({
      segment: [
        { x: getDayKey({ day: Math.min(maxDay, day), slot: 1 }), y: probability_daily! },
        { x: getDayKey({ day: Math.min(maxDay, day + 1), slot: 3 }), y: probability_daily! },
      ],
      key: `daily_${day}`,
    }));
}

const getTodaySegment = (data: ITimeSeriesData["prob_data"]) => {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const todayTS = Math.floor(today.getTime() / 1000)

  const todayOffset = data.find((item) => {
    return item.date === todayTS
  })

  if (!todayOffset) return null

  const x = getDayKey(todayOffset)
  return [
    { x, y: 0 },
    { x, y: 1 }
  ]
}

type PredictionGraphProps = {
  data: ITimeSeriesData["prob_data"];
  selectedDay: number | null;
  setSelectedDay: Dispatch<SetStateAction<number | null>>;
}

const PredictionGraph: React.FC<PredictionGraphProps> = ({ data, selectedDay, setSelectedDay }) => {
  const height = 480;

  if (selectedDay !== null)
    data = data.filter((entry) => entry.day >= selectedDay && entry.day <= selectedDay + 2)

  const alertRegions = getReferenceRegions(data, (datum) => datum.probability > datum.threshold);
  const highlightedRegions = selectedDay ? getReferenceRegions(data, (datum) => datum.day >= selectedDay && datum.day < selectedDay + 2) : [];

  const predictionSteps = getPredictionSteps(data);
  const todaySegment = getTodaySegment(data)

  const onChartClick = ({ activePayload }: any) => {
    if (!activePayload || activePayload.length === 0) return
    setSelectedDay(n => activePayload[0].payload.day)
  };
  const onChartDoubleClick = (e: any) => {
    setSelectedDay(n => null)
  };


  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart
        data={data.map((item) => ({
          ...item,
          x: getDayKey(item),
        }))}
        onClick={onChartClick}
        onDoubleClick={onChartDoubleClick}
      >
        <XAxis dataKey="x" angle={-45} tick={XAxisTick} />
        <YAxis yAxisId="probability" domain={[0, 1]} style={{ fontSize: 15 }} tickCount={6}>
          <Label
            angle={-90}
            value="Probability"
            position="insideLeft"
            style={{ textAnchor: "middle" }}
          />
        </YAxis>
        <YAxis
          yAxisId="creatinine"
          orientation="right"
          tickCount={9}
          domain={[0, 4]}
          style={{ fontSize: 15 }}
        >
          <Label
            angle={90}
            value="Creatinine"
            position="insideRight"
            style={{ textAnchor: "middle" }}
          />
        </YAxis>
        <Line
          yAxisId="probability"
          dataKey="probability"
          name="예측 발생 확률"
          type="linear"
          dot={false}
          stroke="#4AD354"
          strokeWidth={3}
        />
        <Line
          yAxisId="probability"
          type="linear"
          dataKey="threshold"
          name="AKI Threshold"
          dot={false}
          fill="#FF5555"
          strokeWidth={1}
          stroke="red"
          strokeDasharray="3 3"
        />
        <Line
          yAxisId="creatinine"
          dataKey="creatinine"
          name="creatinine 수치"
          type="linear"
          dot={false}
          fill="#fffe00"
          strokeWidth={3}
        />
        <Line
          yAxisId="creatinine"
          type="linear"
          dataKey="baseline_creatinine"
          name={`baseline creatinine`}
          dot={false}
          fill="#FF5555"
          strokeWidth={1}
          stroke="orange"
          strokeDasharray="3 3"
        />
        {!!predictionSteps && predictionSteps.length > 0 && predictionSteps.map(({ key, segment }) => (
          <ReferenceLine
            yAxisId="probability"
            segment={segment}
            name="예측 발생 확률"
            type="linear"
            stroke="#4AD354"
            key={key}
            strokeWidth={3}
            strokeDasharray="3 3"
            ifOverflow="extendDomain"
          />
        ))}
        {todaySegment ?
          <ReferenceLine
            yAxisId="probability"
            segment={todaySegment}
            name="TODAY"
            type="linear"
            fill="#FF5555"
            strokeWidth={1}
            stroke="red"
            strokeDasharray="3 3"
            ifOverflow="extendDomain"
          /> : null}
        {/* <CartesianGrid stroke="#a4a4a4"></CartesianGrid> */}
        <Legend
          layout="vertical"
          align="center"
          verticalAlign="middle"
          wrapperStyle={{
            fontSize: 13,
            bottom: 60,
            left: 70,
            backgroundColor: "white",
            border: "1px solid #A4A4A4",
            borderRadius: 3,
            padding: 12,
          }}
        />
        <Tooltip contentStyle={{ fontSize: 14 }} content={<DateTooltip />} />
        {alertRegions.length > 0 ? alertRegions.map(([start, end]) => (
          <ReferenceArea
            x1={start}
            x2={end}
            y1={0}
            y2={1}
            key={`critical_${start}-${end}`}
            fill="red"
            fillOpacity={0.1}
            ifOverflow="extendDomain"
            yAxisId="probability"
          />
        )) : null}
        {/* {highlightedRegions.length > 0 ? highlightedRegions.map(([start, end]) => (
          <ReferenceArea
            x1={start}
            x2={end}
            y1={0}
            y2={1}
            key={`selected_${start}-${end}`}
            fill="grey"
            fillOpacity={0.1}
            ifOverflow="extendDomain"
            yAxisId="probability"
          />
        )) : null} */}
      </LineChart>
    </ResponsiveContainer>
  );
};

export default PredictionGraph;
