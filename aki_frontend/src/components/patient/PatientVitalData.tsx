import { ITimeSeriesData } from "@/types/patientDetails";
import React, { useEffect } from "react";
import { getVitalGraph } from "@/components/graphs/VitalGraph";
import { ComposedChart, Label, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { getDayAxisKey, getDayKey } from "@/components/utils/graphUtils";
import { DateTooltip } from "@/components/utils/GraphTooltip";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { DataKeySelector } from "@/components/patient/atomic/DataKeySelector";
import styled from "styled-components";
import { getGraphEvaluator } from "@/utils/evaluation";

const GraphRow = styled.div`
  display: flex;
  font-weight: ${(props) => props.theme.font.weight.normal};
  font-size: ${(props) => props.theme.font.size.sm};
`;

const COLOR_MAP = {
  sbp: "grey",
  dbp: "black",
  bt: "blue",
  pr: "red",
};

export const PatientVitalData: React.FC<{ data: ITimeSeriesData["vital_data"] }> = ({ data }) => {
  const height = 260;

  const allDataKeys = ["sbp", "dbp", "pr", "bt"];
  const [dataKeys, setDataKeys] = useLocalStorage("patient.selectedVitalKeys", [...allDataKeys]);

  useEffect(() => {
    setDataKeys(dataKeys.filter((key: string) => allDataKeys.includes(key)));
  }, []);

  const filteredData = Object.fromEntries(
    Object.entries(data).filter(([key]) => dataKeys.includes(key))
  );

  const flatData: { [key: string]: any } = {};
  Object.values(data).forEach((vitalData) => {
    vitalData.forEach((datum) => {
      const tick = getDayAxisKey(datum);
      const prior = tick in flatData ? flatData[tick] : {};
      flatData[tick] = { ...prior, ...datum, tick };
    });
  });

  const clickHandler = getGraphEvaluator()

  return (
    <GraphRow>
      <div>
        <DataKeySelector
          pool={allDataKeys}
          selected={dataKeys}
          setSelected={setDataKeys}
          collections={{}}
        />
      </div>
      <ResponsiveContainer width="100%" height={height}>
        <ComposedChart
          data={Object.values(flatData)}
          onClick={clickHandler}
        >
          <YAxis yAxisId="value" tickCount={5} />
          <XAxis dataKey="tick" tickCount={7}>
            <Label value="입원 후 일수" position="top" style={{ textAnchor: "middle" }} />
          </XAxis>
          {...Object.entries(filteredData).map(([key, value]) =>
            getVitalGraph({
              data: value,
              color: COLOR_MAP[key as keyof typeof COLOR_MAP] ?? "blue",
              key,
            })
          )}
          <Tooltip contentStyle={{ fontSize: 14 }} content={<DateTooltip />} />
        </ComposedChart>
      </ResponsiveContainer>
    </GraphRow>
  );
};
