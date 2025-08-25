import { useGetTimePeriodicAKIData } from "@/hooks/queries/useGetAKIPeriodicStats";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceArea,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import AsyncBoundary from "../utils/AsyncBoundary";

const AllGraph: React.FC = () => {

  const { data, isLoading, isError } = useGetTimePeriodicAKIData()

  return (
    <AsyncBoundary isLoading={data === undefined || isLoading} isError={isError}>
      {data && (
        <LineChart width={1300} height={562} data={data} style={{ left: "-152px" }}>
          <XAxis dataKey="day" hide />
          <YAxis yAxisId="count" style={{ fontSize: 15 }} tickCount={6} />
          <Line
            yAxisId="count"
            dataKey="count"
            name="전체 AKI 발생 횟수"
            type="linear"
            dot={false}
            stroke="#02348B"
            strokeWidth={2.2}
          />
          <CartesianGrid stroke="#a4a4a4"></CartesianGrid>
          <Legend
            layout="vertical"
            align="left"
            verticalAlign="top"
            wrapperStyle={{
              fontSize: 13,
              top: 20,
              left: 250,
              backgroundColor: "white",
              border: "1px solid #A4A4A4",
              borderRadius: 3,
              padding: 12,
            }}
          />
          <Tooltip contentStyle={{ fontSize: 14 }} />
        </LineChart>
      )}
    </AsyncBoundary>
  );
};

export default AllGraph;
