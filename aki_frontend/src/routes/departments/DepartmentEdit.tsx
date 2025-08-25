import DefaultLayout from "@/layouts/DefaultLayout";
import PageCard from "@/components/global/pageCard";
import { useParams } from "react-router-dom";
import AsyncBoundary from "@/components/utils/AsyncBoundary";
import DepartmentDetailsForm from "@/components/departments/DepartmentDetailsForm";
import { useDepartmentEdit, useDepartmentShow } from "@/hooks/queries/useDepartmentData";

const DepartmentEdit = () => {
  const { departmentID } = useParams();

  const { data, isLoading, isError, isFetchedAfterMount } = useDepartmentShow(parseInt(departmentID!));

  return (
    <DefaultLayout currentPage={"admin"} subPage={"departments"}>
      <PageCard>
        <AsyncBoundary
          isLoading={data === undefined || isLoading || !isFetchedAfterMount}
          isError={isError}
        >
          <DepartmentDetailsForm mutationGenerator={useDepartmentEdit} department={data} />
        </AsyncBoundary>
      </PageCard>
    </DefaultLayout>
  );
};

export default DepartmentEdit;
