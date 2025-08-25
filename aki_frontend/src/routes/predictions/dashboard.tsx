import PageCard from "@/components/global/pageCard";
import Spacer from "@/components/utils/spacer";
import DefaultLayout from "@/layouts/DefaultLayout";
import styled from "styled-components";
import PatientListViewer from "@/components/patients/PatientListViewer";
import { getUploadPatientFilesMutation } from "@/hooks/queries/usePatientTableData";

const SubTitle = styled.div`
  font-size: ${(props) => props.theme.font.size.m};
  font-weight: bold;
  color: #3e3e3e;
`;

const Dashboard = () => {
  return (
    <DefaultLayout currentPage={"predictions"} subPage={"dashboard"}>
      <PageCard>
        <SubTitle>선택된 환자가 없습니다. 아래에서 조회할 환자를 선택해 주세요</SubTitle>
      </PageCard>
      <Spacer height={20} />
      <PageCard>
        <PatientListViewer viewType={"all"} fileUploadMutation={getUploadPatientFilesMutation('/patients')}/>
      </PageCard>
    </DefaultLayout>
  );
};

export default Dashboard;
