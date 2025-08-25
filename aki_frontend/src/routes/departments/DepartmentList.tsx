import DefaultLayout from "@/layouts/DefaultLayout";
import PageCard from "@/components/global/pageCard";
import DepartmentListViewer from "@/components/departments/DepartmentListViewer";

const DepartmentList = () => {
  return (
    <DefaultLayout currentPage={"admin"} subPage={"departments"}>
      <PageCard>
        <DepartmentListViewer />
      </PageCard>
    </DefaultLayout>
  );
};

export default DepartmentList;