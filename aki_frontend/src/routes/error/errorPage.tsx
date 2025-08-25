import React from "react";
import DefaultLayout from "@/layouts/DefaultLayout";
import Spacer from "@/components/utils/spacer";
import styled from "styled-components";
import PageCard from "@/components/global/pageCard";

const ErrorText = styled.h2`
  color: ${(props) => props.theme.font.color.accent};
  font-size: ${(props) => props.theme.font.size.mxl};

  text-align: center;
  padding: 10px 0;
`;

const ErrorDescription = styled.p`
  color: ${(props) => props.theme.font.color.secondary};
  font-size: ${(props) => props.theme.font.size.m};

  text-align: center;
  padding: 10px 0;
`;

const ErrorCode = styled.p`
  color: ${(props) => props.theme.font.color.error};
  font-size: ${(props) => props.theme.font.size.m};
  font-weight: ${(props) => props.theme.font.weight.semibold};

  //opacity: 0.6;
  text-align: center;
  padding: 20px 0;
`;

const ErrorPage: React.FC<{
  errorCode: number;
  errorText: string;
  errorDescription: string;
}> = (props) => {
  return (
    <DefaultLayout currentPage={"home"} subPage={""}>
      <PageCard>
        <Spacer height={100} />
        <ErrorText>{props.errorText}</ErrorText>
        <ErrorDescription>{props.errorDescription}</ErrorDescription>
        <ErrorCode>Error Code: ${props.errorCode}</ErrorCode>
        <Spacer height={100} />
      </PageCard>
    </DefaultLayout>
  );
};

export default ErrorPage;
