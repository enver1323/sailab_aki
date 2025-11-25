import {
  Line,
  Area,
} from "recharts";
import { StarDot } from "@/components/graphs/atomic/LRPStarDot";
import { VitalDataEntry } from "@/types/patientDetails";

export const getVitalGraph = ({
  data,
  key,
  color,
}: {
  data: Array<VitalDataEntry>;
  key: string;
  color: string;
}) => {

  const allDataKeys = data.length > 0 ? Object.keys(data[0]) : [];
  const dataColumns = [];
  const lrpColumns = [];
  const areaColumns = [];

  for (const k of allDataKeys) {
    if (k in { day: true, slot: true, date: true }) continue;
    if (k.substring(k.length - 3) === "lrp") lrpColumns.push(k);
    else if (k.substring(k.length - 4) === "area") areaColumns.push(k);
    else dataColumns.push(k);
  }

  return [
    dataColumns.map((col, id) => (
      <Line
        yAxisId="value"
        name={col}
        dataKey={col}
        type="linear"
        stroke={color}
        strokeWidth={3}
        key={col}
        fill={color}
        connectNulls
      />
    )),
    areaColumns.map((col, id) => (
      <Area
        yAxisId="value"
        name={col}
        dataKey={col}
        type="linear"
        stroke={color}
        strokeWidth={1}
        key={col}
        fill={color}
        connectNulls
        legendType="none"
      />
    )),
    lrpColumns.map((col, id) => (
      <Line
        yAxisId="value"
        dataKey={col}
        dot={<StarDot />}
        key={col}
        stroke={color}
        strokeWidth={3}
        legendType="none"
      />
    )),
  ];
};
