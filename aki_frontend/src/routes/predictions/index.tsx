import React from 'react'
import PageCard from "@/components/global/pageCard";
import Title from "@/components/global/title";
import AllGraph from "@/components/graphs/AllGraph";
import Spacer from "@/components/utils/spacer";
import DefaultLayout from "@/layouts/DefaultLayout";

const Predictions: React.FC = () => {
  return (
    <DefaultLayout currentPage={"predictions"} subPage={"index"}>
      <PageCard>
        <Title>전체 AKI 발생 동향</Title>
        <Spacer height={20} />
        <AllGraph />
      </PageCard>
    </DefaultLayout>
  );
};

export default Predictions;
