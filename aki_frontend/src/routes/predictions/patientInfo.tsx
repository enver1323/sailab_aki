import Spacer from "@/components/utils/spacer";
import DefaultLayout from "@/layouts/DefaultLayout";
import { useParams } from "react-router-dom";
import { useGetPatientAKIPrediction } from "@/hooks/queries/useGetPatientInfo";
import AsyncBoundary from "@/components/utils/AsyncBoundary";
import PatientBasicInfoTable from "@/components/tables/PatientBasicInfoTable";
import { SectionTitle } from "./atomic/Titles";
import PageCard from "@/components/global/pageCard";
import { PatientBinaryInfo } from "@/components/patient/PatientBinaryInfo";
import { PatientRangeData } from "@/components/patient/PatientRangeData";
import { PatientVitalData } from "@/components/patient/PatientVitalData";
import styled from "styled-components";
import PrescriptionGraph from "@/components/graphs/PrescriptionGraph";
import SurgeryTimeGraph from "@/components/graphs/SurgeryTimeGraph";
import { PatientPredictionData } from "@/components/patient/PatientPredictionData";


const PrescriptionSurgicalRow = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
`

const PatientInfo = () => {
  const { patientMedicalRecordID } = useParams();

  const { data, isLoading, isError } = useGetPatientAKIPrediction(parseInt(patientMedicalRecordID!));

  return (
    <DefaultLayout currentPage={"predictions"} subPage={"dashboard"}>
      <PageCard>
        <AsyncBoundary isLoading={data === undefined || isLoading} isError={isError}>
          {(data?.prob_data || data?.prediction) && (
            <>
              <SectionTitle>예측 그래프</SectionTitle>
              {data?.prob_data && <PatientPredictionData data={data.prob_data} />}
              <Spacer height={30} />
            </>
          )}
          {data?.general_data && (
            <>
              <SectionTitle>기분 정부</SectionTitle>
              <PatientBasicInfoTable data={[data.general_data]} />
              <Spacer height={30} />
            </>
          )}
          {data?.binary_data && (
            <>
              <SectionTitle>기저질환</SectionTitle>
              <PatientBinaryInfo data={data.binary_data} />
              <Spacer height={30} />
            </>
          )}
          {data?.test_data && (
            <>
              <SectionTitle>검사 결과</SectionTitle>
              <PatientRangeData data={data.test_data} />
              <Spacer height={30} />
            </>
          )}
          {data?.vital_data && (
            <>
              <SectionTitle>검사 결과</SectionTitle>
              <PatientVitalData data={data.vital_data} />
              <Spacer height={30} />
            </>
          )}
          {(data?.prescription_data || data?.surgical_data) && (
            <>
              <SectionTitle>약품 처방 및 수술 데이터</SectionTitle>
              <PrescriptionSurgicalRow>
                <PrescriptionGraph data={data.prescription_data!} />
                <SurgeryTimeGraph data={data.surgical_data} />
              </PrescriptionSurgicalRow>
            </>
          )}
        </AsyncBoundary>
      </PageCard>
    </DefaultLayout>
  );
};

export default PatientInfo;
