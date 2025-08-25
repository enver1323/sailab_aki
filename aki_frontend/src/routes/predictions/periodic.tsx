import PageCard from "@/components/global/pageCard";
import Title from "@/components/global/title";
import PatientListViewer from "@/components/patients/PatientListViewer";
import DefaultLayout from "@/layouts/DefaultLayout";
import styled from "styled-components";
import { useState } from "react";
import { Cell, Pie, PieChart } from "recharts";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.min.css";
import calendarIcon from "@/assets/Calendar.svg";
import Spacer from "@/components/utils/spacer";
import AsyncBoundary from "@/components/utils/AsyncBoundary";
import { Prediction } from "@/types/patientTypes";
import {
  getUploadPatientFilesMutation,
  usePredictionEvaluationData,
} from "@/hooks/queries/usePatientTableData";
import { useAuth } from "@/hooks/useAuth";

const CalendarSection = styled.div`
  display: flex;
  flex-direction: row;
  gap: 10px;
  align-items: center;
`;

const SubTitle = styled.div`
  font-size: 24px;
  font-weight: bold;
  color: black;
`;

const SubTitleColor = styled.span`
  color: ${(props) => props.theme.font.color.accent};
`;

const GraphSection = styled.div`
  display: flex;
  flex-direction: row;
  gap: 24.56px;
  margin-bottom: 31px;
`;

const GraphTitle = styled.div`
  font-size: ${(props) => props.theme.font.size.m};
  color: #263238;
  font-weight: ${(props) => props.theme.font.weight.bold};
`;

const GraphSubTitle = styled.div`
  font-size: ${(props) => props.theme.font.size.s};
  color: #607d8b;
`;

type GraphCardProps = {
  title: string;
  subtitle: string;
  percentage: number;
  english: string;
};

const PieChartWrapper = styled.div`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const GraphCard = ({ title, subtitle, percentage, english }: GraphCardProps) => {
  percentage = Number(percentage.toFixed(2))
  return (
    <PageCard>
      <GraphTitle>{title}</GraphTitle>
      <GraphSubTitle>{subtitle}</GraphSubTitle>
      <PieChartWrapper>
        <PieChart width={208} height={208}>
          <Pie
            data={[
              { name: "A", value: percentage },
              { name: "B", value: 100 - percentage },
            ]}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            fill="#02348B"
            startAngle={90}
            endAngle={-270}
          >
            <Cell key={0} fill="#02348E" />
            <Cell key={1} fill="#CFD8DC" />
          </Pie>
          <text x={104} y={104} textAnchor="middle" fill="#263238" fontSize={28} fontWeight="bold">
            {percentage.toString() + "%"}
          </text>
          <text x={104} y={124} textAnchor="middle" fill="#263238" fontSize={14}>
            {english}
          </text>
        </PieChart>
      </PieChartWrapper>
    </PageCard>
  );
};

const DatePickerWrapper = styled.div`
  position: relative;

  /* &:hover {
    cursor: pointer;
    filter: brightness(0.8)
  } */

  & input {
    color: #222222;
  }
`;

const DateIconWrapper = styled.div`
  position: absolute;
  height: 0px;
  top: calc(50% - 19px);
  right: 12px;
`;

const CustomDatePicker: React.FC<{
  selectedDate: Date | null;
  onChange: (date: Date | null) => void;
}> = (props) => {
  return (
    <DatePickerWrapper>
      <StyledDatePicker
        selected={props.selectedDate}
        // @ts-ignore
        onChange={(date) => props.onChange(date)}
        dateFormat="yyyy년 MM월 dd일"
      />
      <DateIconWrapper>
        <img src={calendarIcon} width={18} height={18} />
      </DateIconWrapper>
    </DatePickerWrapper>
  );
};

type GraphBlockProps = {
  prediction: Prediction,
  title: string
}
const GraphBlock: React.FC<GraphBlockProps> = ({ prediction, title }: GraphBlockProps) => {
  return <>
    <SubTitle>
      기간 내 {title} <SubTitleColor>{prediction.total}건</SubTitleColor> 발생
    </SubTitle>
    <Spacer height={10} />
    <GraphSection>
      <GraphCard
        title="정밀도"
        percentage={prediction.precision * 100}
        subtitle="AKI 발생 예측 횟수 중 실제로 발생한 횟수"
        english="PRECISION"
      />
      <GraphCard
        title="재현율"
        percentage={prediction.recall * 100}
        subtitle="AKI 발생 횟수 중 모델이 예측한 횟수"
        english="RECALL"
      />
      <GraphCard
        title="정확도"
        percentage={prediction.accuracy * 100}
        subtitle="전체 분류 횟수 중 모델이 정확하게 예측한 횟수"
        english="ACCURACY"
      />
    </GraphSection>
  </>
}

const StyledDatePicker = styled(DatePicker)`
  border: solid 1px #dfdfdf;
  background: white;
  display: flex;

  padding: 10px;
`;

const StyledDash = styled.p`
  color: #02348b;
`;

const Periodic = () => {
  const { user } = useAuth();
  const date = new Date();

  const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
  const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);

  const [startDate, setStartDate] = useState<Date | null>(firstDay);
  const [endDate, setEndDate] = useState<Date | null>(lastDay);

  const formatDate = (date: Date | null) => (!!date ? `${date!.getFullYear()}-${date!.getMonth() + 1}-${date.getDate()}` : null);
  const { data, isLoading, isError } = usePredictionEvaluationData(
    formatDate(startDate),
    formatDate(endDate)
  );

  return (
    <DefaultLayout currentPage={"predictions"} subPage={"periodic"}>
      <Title>예측 대시보드</Title>
      <Spacer height={10} />
      <CalendarSection>
        <CustomDatePicker selectedDate={startDate} onChange={setStartDate} />
        <StyledDash>-</StyledDash>
        <CustomDatePicker selectedDate={endDate} onChange={setEndDate} />
      </CalendarSection>
      <Spacer height={20} />
      {
        user && user.isAdmin ?
          <AsyncBoundary isLoading={data === undefined || isLoading} isError={isError}>
            {data && (
              <GraphBlock prediction={data.general} title="AKI" />
            )}
          </AsyncBoundary> : null
      }

      <PageCard>
        <PatientListViewer
          viewType={"all"}
          fileUploadMutation={getUploadPatientFilesMutation("/patients/evaluate")}
          startDate={formatDate(startDate)}
          endDate={formatDate(endDate)}
        />
      </PageCard>
    </DefaultLayout>
  );
};

export default Periodic;
