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

const ITEM_CODE_DESCRIPTIONS: Record<string, string> = {
  dialysis: "Dialysis is a treatment that filters blood to remove wastes, extra salt, and water when the kidneys cannot do this adequately.",

  contrast: "Contrast material is used in imaging (such as CT, MRI, and X-ray) to make organs, vessels, or tissues more visible for diagnosis.",

  rbc: "RBC indicates red blood cells (typically red blood cell transfusion in treatment context), used to replace blood loss and support oxygen delivery.",

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

type AntibioticTooltip = {
  text: string;
  x: number;
  y: number;
} | null;

const PrescriptionGraph: React.FC<{ data: ITimeSeriesData["prescription_data"] }> = ({ data }) => {
  const ROW_HEIGHT_PX = 46;
  const X_AXIS_HEIGHT_PX = 32;
  const CHART_MARGIN = { top: 8, right: 8, bottom: 8, left: 0 };

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
  const dayTickIndexes = Object.values(xTicksMapper).filter((index) => Number(index) % 3 === 0);

  const dataColumnsMapper = makeMapper(dataColumns);
  const filteredDataColumns = dataColumns.filter((col) => scatterData[col].length > 0)
  const strokeWidth = 3
  const tooltipMaxWidth = 520;

  const wrapperRef = React.useRef<HTMLDivElement | null>(null);
  const [antibioticTooltip, setAntibioticTooltip] = React.useState<AntibioticTooltip>(null);

  const rowAwareHeight =
    Math.max(1, dataColumns.length) * ROW_HEIGHT_PX +
    X_AXIS_HEIGHT_PX +
    CHART_MARGIN.top +
    CHART_MARGIN.bottom;
  const yTicks = Object.values(dataColumnsMapper);

  const updateAntibioticTooltip = (event: any, text: string) => {
    const wrapperRect = wrapperRef.current?.getBoundingClientRect();
    if (!wrapperRect) return;

    const targetX = event.clientX - wrapperRect.left + 12;
    const targetY = event.clientY - wrapperRect.top - 12;

    const x = Math.max(8, Math.min(wrapperRect.width - tooltipMaxWidth - 8, targetX));
    const y = Math.max(8, targetY);

    setAntibioticTooltip({ text, x, y });
  };

  const YAxisTick = ({ x = 0, y = 0, payload }: any) => {
    const index = Number(payload?.value);
    const label = Number.isFinite(index) ? dataColumns[index] : "";
    const tooltipText = ITEM_CODE_DESCRIPTIONS[label];

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
          onMouseEnter={(event) => {
            if (!tooltipText) return;
            updateAntibioticTooltip(event, tooltipText);
          }}
          onMouseMove={(event) => {
            if (!tooltipText) return;
            updateAntibioticTooltip(event, tooltipText);
          }}
          onMouseLeave={() => setAntibioticTooltip(null)}
        >
          {label}
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
    <div ref={wrapperRef} style={{ width: "100%", height: rowAwareHeight, position: "relative" }}>
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart onClick={clickHandler} margin={CHART_MARGIN}>
          <CartesianGrid />
          <YAxis
            fontSize={14}
            type="number"
            dataKey="y"
            interval={0}
            domain={[-0.5, Math.max(0, dataColumns.length - 0.5)]}
            allowDataOverflow
            ticks={yTicks}
            tick={<YAxisTick />}
            width={125}
          />
          <XAxis
            fontSize={14}
            type="number"
            dataKey="x"
            ticks={dayTickIndexes}
            interval={0}
            domain={[0, Math.max(0, xTicks.length - 1)]}
            allowDataOverflow
            height={X_AXIS_HEIGHT_PX}
            tickFormatter={(val) => {
              const index = Number(val);
              return Number.isFinite(index) ? (xTicks[index] ?? "") : "";
            }}
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
      {antibioticTooltip ? (
        <div
          style={{
            position: "absolute",
            left: antibioticTooltip.x,
            top: antibioticTooltip.y,
            zIndex: 20,
            maxWidth: tooltipMaxWidth,
            padding: "10px 12px",
            border: "1px solid #333",
            background: "#fff",
            color: "#111",
            fontSize: 15,
            lineHeight: 1.4,
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.18)",
            whiteSpace: "normal",
            wordBreak: "break-word",
            pointerEvents: "none",
          }}
        >
          {antibioticTooltip.text}
        </div>
      ) : null}
    </div>
  );
};

export default PrescriptionGraph;
