import styled from "styled-components";
import { useEffect } from "react";

import { ITimeSeriesData } from "@/types/patientDetails";
import { SectionSubTitle } from "@/routes/predictions/atomic/Titles";
import RangeGraph from "@/components/graphs/RangeGraph";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { DataKeySelector } from "@/components/patient/atomic/DataKeySelector";

const GridItemWrapper = styled.div`
  font-weight: ${(props) => props.theme.font.weight.normal};
  font-size: ${(props) => props.theme.font.size.sm};
`;

const GraphRow = styled.div`
  display: flex;
`;

const GridItem: React.FC<React.PropsWithChildren> = ({ children }) => (
  <GridItemWrapper>{children}</GridItemWrapper>
);

const COLLECTIONS = {
  "작은 범위": ["albumin", "bilirubin", "creatinine", "potassium"],
  "중간 범위": ["crp", "hematocrit", "bun", "calcium", "co2", "hb", "wbc"],
  "큰 범위": ["chloride", "glucose", "plt", "sodium", "phosphorus"],
};

export const PatientRangeData: React.FC<{ data: ITimeSeriesData["test_data"] }> = ({ data }) => {
  const [dataKeys, setDataKeys] = useLocalStorage("patient.selectedRangeKeys", ["creatinine"]);
  const allDataKeys = data.length > 0 ? Object.keys(data[0]) : [];
  useEffect(() => {
    setDataKeys(dataKeys.filter((key: string) => allDataKeys.includes(key)));
  }, []);

  const filteredData = data.map((datum) => ({
    day: datum.day,
    slot: datum.slot,
    ...Object.fromEntries(dataKeys.map((dataKey: string) => [dataKey, datum[dataKey]])),
  }));

  const filteredDataKeys = allDataKeys.filter((key: string) => {
    return !(key.includes("_lrp") || key in { date: true, day: true, slot: true });
  });

  return (
    <GridItem>
      <SectionSubTitle>범위</SectionSubTitle>
      <GraphRow>
        <div>
          <DataKeySelector
            pool={filteredDataKeys}
            selected={dataKeys}
            setSelected={setDataKeys}
            collections={COLLECTIONS}
          />
        </div>
        <RangeGraph data={filteredData} />
      </GraphRow>
    </GridItem>
  );
};
