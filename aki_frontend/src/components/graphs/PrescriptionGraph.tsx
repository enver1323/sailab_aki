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
import { getGraphEvaluator } from "@/utils/evaluation";
import { GraphClickSyntheticEvent } from "@/types/evaluation";

const ANTIBIOTIC_CODE_DESCRIPTIONS: Record<string, string> = {
  antibiotic_j01a: 'j01a: Tetracyclines. \
This group comprises tetracycline antibacterials inhibiting the bacterial protein synthesis \
through binding to the 30-S part of ribosomes.',

  antibiotic_j01c: 'j01c: Beta-Lactam Antibacterials, Penicillins. \
This group comprises penicillin beta-lactam antibacterials, inhibiting the bacterial cell \
wall synthesis.',

  antibiotic_j01d: 'j01d: Other Beta-Lactam Antibacterials. \
This group comprises beta-lactam antibacterials, other than penicillins',

  antibiotic_j01e: 'j01e: Sulfonamides and Trimethoprim. \
This group comprises systemic sulfonamide and trimethoprim preparations.',

  antibiotic_j01f: 'j01f: Macrolides, Lincosamides and Streptogramins. \
This group comprises macrolide, lincosamide and streptogramin antibacterials inhibiting \
bacterial protein synthesis through binding to the 50-S part of the ribosomes.',

  antibiotic_j01m: 'j01m: Quinolone Antibacterials. \
This group comprises quinolone antibacterials, inhibiting the bacterial DNA-gyrase.',

  antibiotic_j01x: 'j01x: Other Antibacterials. \
This group comprises antibacterials with various modes of action not classified in the \
preceding groups.',
};

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
  const height = 460;

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
  const filteredDataColumns = dataColumns.filter((col) => scatterData[col].length > 0)
  const strokeWidth = 3

  const YAxisTick = ({ x = 0, y = 0, payload }: any) => {
    const index = Number(payload?.value);
    const label = Number.isFinite(index) ? dataColumns[index] : "";
    const tooltipText = ANTIBIOTIC_CODE_DESCRIPTIONS[label];

    return (
      <g transform={`translate(${x},${y})`}>
        <text
          x={0}
          y={0}
          dy={4}
          textAnchor="end"
          fill="#666"
          fontSize={14}
          style={tooltipText ? { cursor: "help" } : undefined}
        >
          {label}
          {tooltipText ? <title>{tooltipText}</title> : null}
        </text>
      </g>
    );
  };

  const graphEvaluator = getGraphEvaluator()
  const clickHandler = (payload: any, event: GraphClickSyntheticEvent) => {
    const daySlot = Math.floor(payload.xValue)
    const day = Math.ceil((daySlot + 1) / 3)
    const slot = daySlot % 3 + 1
    const column = dataColumns[Math.round(payload.yValue)]

    const dataExists = data.some((item) => item.day == day && item.slot == slot && item[column] !== null)

    if (!dataExists) return

    const columnId = filteredDataColumns.indexOf(column)
    const color = COLORS[columnId]

    const formattedPayload = {
      ...payload,
      activePayload: [{
        name: column,
        dataKey: column,
        color: color,
        fill: color,
        stroke: color,
        strokeWidth: strokeWidth,
        value: 1,
        payload: { [column]: 1, day, slot }
      }]
    }
    graphEvaluator(formattedPayload, event)
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <ScatterChart onClick={clickHandler} >
        <CartesianGrid />
        <YAxis
          fontSize={14}
          type="number"
          dataKey="y"
          ticks={Object.values(dataColumnsMapper)}
          tick={<YAxisTick />}
          width={125}
        />
        <XAxis
          fontSize={14}
          type="number"
          dataKey="x"
          ticks={Object.values(xTicksMapper)}
          tickFormatter={(val) => xTicks[val]}
        />
        {filteredDataColumns
          .map((col, id) => (
            <Scatter
              name={col}
              data={scatterData[col].map(({ x, y }) => ({
                date: x,
                x: xTicksMapper[x],
                y: dataColumnsMapper[y],
              }))}
              stroke={COLORS[id]}
              strokeWidth={strokeWidth}
              key={col}
              fill={COLORS[id]}
              shape={
                <Rectangle width={40} height={10} fill={COLORS[id]} strokeWidth={strokeWidth} />
              }
            />
          ))}
        <Tooltip contentStyle={{ fontSize: 14 }} content={<DateTooltip />} />
      </ScatterChart>
    </ResponsiveContainer>
  );
};

export default PrescriptionGraph;
