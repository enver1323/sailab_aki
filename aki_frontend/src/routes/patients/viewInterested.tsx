import React from 'react'
import DefaultLayout from "@/layouts/DefaultLayout";
import PageCard from "@/components/global/pageCard";
import PatientListViewer from "@/components/patients/PatientListViewer";
import { getUploadPatientFilesMutation } from "@/hooks/queries/usePatientTableData";

const ViewInterested: React.FC = () => (
  <DefaultLayout currentPage={"patients"} subPage={"interests"}>
    <PageCard>
      <PatientListViewer viewType={"interests"} fileUploadMutation={getUploadPatientFilesMutation('/patients')} />
    </PageCard>
  </DefaultLayout>
);

export default ViewInterested;
