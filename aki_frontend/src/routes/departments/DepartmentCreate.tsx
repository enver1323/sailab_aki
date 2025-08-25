import DefaultLayout from "@/layouts/DefaultLayout";
import PageCard from "@/components/global/pageCard";
import DepartmentDetailsForm from "@/components/departments/DepartmentDetailsForm";
import { useDepartmentCreate } from "@/hooks/queries/useDepartmentData";

const DepartmentCreate = () => {
  return <DefaultLayout currentPage={"admin"} subPage={"departments"}>
    <PageCard>
      <DepartmentDetailsForm mutationGenerator={useDepartmentCreate}/>
    </PageCard>
  </DefaultLayout>
}

export default DepartmentCreate