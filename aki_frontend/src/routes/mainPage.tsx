import React from "react";
import styled from "styled-components";
import DefaultLayout from "@/layouts/DefaultLayout";
import Spacer from "@/components/utils/spacer";
import PageCard from "@/components/global/pageCard";

const WelcomeText = styled.h2`
  color: ${(props) => props.theme.font.color.accent};
  font-size: ${(props) => props.theme.font.size.mxl};

  text-align: center;
  padding: 10px 0;
`;

const WelcomeTextAfter = styled.p`
  color: ${(props) => props.theme.font.color.secondary};
  font-size: ${(props) => props.theme.font.size.m};

  text-align: center;
  padding: 10px 0;
`;

const MainPage = () => {
  
  return (
    <DefaultLayout currentPage={"home"} subPage={""}>
      <PageCard>
        <Spacer height={100} />
        <WelcomeText>AKI 예측 통합 포털에 오신 것을 환영합니다!</WelcomeText>
        <WelcomeTextAfter>위 메뉴에서 작업을 선택하여 시작해 주세요</WelcomeTextAfter>
        <Spacer height={100} />
      </PageCard>
    </DefaultLayout>
  );
};

export default MainPage;
