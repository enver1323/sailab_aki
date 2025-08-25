import React from 'react'
import DefaultLayout from "@/layouts/DefaultLayout";
import PageCard from "@/components/global/pageCard";
import PatientListViewer from "@/components/patients/PatientListViewer";
import { getUploadPatientFilesMutation } from "@/hooks/queries/usePatientTableData";

const ViewAll: React.FC = () => {
  return (
    <DefaultLayout currentPage={"patients"} subPage={"all"}>
      <PageCard>
        <PatientListViewer viewType="all" fileUploadMutation={getUploadPatientFilesMutation('/patients')}/>
      </PageCard>
    </DefaultLayout>
  );
};

export default ViewAll;