import DefaultLayout from "@/layouts/DefaultLayout";
import PageCard from "@/components/global/pageCard";
import UserDetailsForm from "@/components/users/UserDetailsForm";
import { useUserCreate } from "@/hooks/queries/useUserData";

const UserCreate = () => {
  return <DefaultLayout currentPage={"admin"} subPage={"users"}>
    <PageCard>
      <UserDetailsForm mutationGenerator={useUserCreate}/>
    </PageCard>
  </DefaultLayout>
}

export default UserCreate