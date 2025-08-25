import {
  Tooltip,
  XAxis,
  YAxis,
  ResponsiveContainer,
  ScatterChart,
  CartesianGrid,
  Scatter,
  Rectangle,
  TooltipProps,
  DefaultTooltipContent,
} from "recharts";
import {
  COLORS,
  getDayAxisKey,
  getTicksDomain,
} from "@/components/utils/graphUtils";
import { ITimeSeriesData } from "@/types/patientDetails";
import React from "react";

const DateTooltip: React.FC<TooltipProps<any, any>> = (props) => {
  const { payload } = props;

  const updatedPayload =
    !!payload && payload.length > 0 ? [{ name: "Date", value: payload[0].payload.date }] : payload;

  const updatedProps = {
    ...props,
    payload: updatedPayload,
  };

  return <DefaultTooltipContent {...updatedProps} />;
};

const formatScatterData = (columns: Array<string>, data: ITimeSeriesData["prescription_data"]) =>
  Object.fromEntries(
    columns.map((column) => [
      column,
      data
        .filter((datum) => !!datum[column])
        .map((datum) => ({ x: getDayAxisKey(datum), y: column })),
    ])
  );

const makeMapper = (data: (string | number)[]) =>
  Object.fromEntries(data.map((datum, i) => [datum, i]));

const PrescriptionGraph: React.FC<{ data: ITimeSeriesData["prescription_data"] }> = ({ data }) => {
  const height = 360;

  const allDataKeys = data.length > 0 ? Object.keys(data[0]) : [];
  const dataColumns: string[] = [];
  const lrpColumns: string[] = [];

  for (const k of allDataKeys) {
    if (k in { day: true, slot: true, date: true }) continue;
    if (k.substring(k.length - 3) === "lrp") lrpColumns.push(k);
    else dataColumns.push(k);
  }

  const maxDay = Math.max(...data.map((datum) => datum.day));
  const scatterData = formatScatterData(dataColumns, data);

  const xTicks = getTicksDomain(maxDay);
  const xTicksMapper = makeMapper(xTicks);

  const dataColumnsMapper = makeMapper(dataColumns);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <ScatterChart>
        <CartesianGrid />
        <YAxis
          fontSize={10}
          type="number"
          dataKey="y"
          ticks={Object.values(dataColumnsMapper)}
          tickFormatter={(val, _) => dataColumns[val]}
        />
        <XAxis
          fontSize={14}
          type="number"
          dataKey="x"
          ticks={Object.values(xTicksMapper)}
          tickFormatter={(val) => xTicks[val]}
        />
        {dataColumns
          .filter((col) => scatterData[col].length > 0)
          .map((col, id) => (
            <Scatter
              name={col}
              data={scatterData[col].map(({ x, y }) => ({
                date: x,
                x: xTicksMapper[x],
                y: dataColumnsMapper[y],
              }))}
              stroke={COLORS[id]}
              strokeWidth={3}
              key={col}
              fill={COLORS[id]}
              shape={
                <Rectangle width={40} height={10} fill={COLORS[id]} strokeWidth={COLORS[id]} />
              }
            />
          ))}
        <Tooltip contentStyle={{ fontSize: 14 }} content={<DateTooltip />} />
      </ScatterChart>
    </ResponsiveContainer>
  );
};

export default PrescriptionGraph;
