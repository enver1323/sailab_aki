import React, { useState } from "react";
import {
  Legend,
  Line,
  LineChart,
  Tooltip,
  XAxis,
  YAxis,
  Label,
  ResponsiveContainer,
} from "recharts";
import { COLORS, getDayAxisKey } from "@/components/utils/graphUtils";
import { StarDot } from "@/components/graphs/atomic/LRPStarDot";
import { RangeEntry } from "@/types/patientDetails";
import { DateTooltip } from "@/components/utils/GraphTooltip";
import { getGraphEvaluator } from "@/utils/evaluation"

type PredictionGraphProps = {
  data: Array<RangeEntry>;
};

const RangeGraph: React.FC<PredictionGraphProps> = ({ data }) => {
  const height = 400;

  const allDataKeys = data.length > 0 ? Object.keys(data[0]) : [];
  const dataColumns = [];
  const lrpColumns = [];

  for (const k of allDataKeys) {
    if (k in { day: true, slot: true, date: true }) continue;
    if (k.substring(k.length - 3) === "lrp") lrpColumns.push(k);
    else dataColumns.push(k);
  }

  const clickHandler = getGraphEvaluator()

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart
        data={data.map((item) => ({
          ...item,
          tick: getDayAxisKey(item),
        }))}
        onClick={clickHandler}
      >
        <YAxis yAxisId="value" tickCount={5} />
        <XAxis dataKey="tick" tickCount={7}>
          <Label value="입원 후 일수" position="top" style={{ textAnchor: "middle" }} />
        </XAxis>
        {dataColumns.map((col, id) => (
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
        ))}
        {lrpColumns.map((col, id) => (
          <Line
            yAxisId="value"
            dataKey={col}
            dot={<StarDot />}
            key={col}
            stroke={COLORS[id]}
            strokeWidth={3}
            legendType="none"
          />
        ))}
        <Legend
          layout="horizontal"
          align="center"
          verticalAlign="bottom"
          wrapperStyle={{
            fontSize: 13,
          }}
        />
        <Tooltip contentStyle={{ fontSize: 14 }} content={<DateTooltip />} />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default RangeGraph;
