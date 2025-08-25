import DefaultLayout from "@/layouts/DefaultLayout";
import PageCard from "@/components/global/pageCard";
import UserDetailsForm from "@/components/users/UserDetailsForm";
import { useUserShow, useUserEdit } from "@/hooks/queries/useUserData";
import { useParams } from "react-router-dom";
import AsyncBoundary from "@/components/utils/AsyncBoundary";

const UserEdit = () => {
  const { userID } = useParams();

  const { data, isLoading, isError, isFetchedAfterMount } = useUserShow(parseInt(userID!));

  return (
    <DefaultLayout currentPage={"admin"} subPage={"users"}>
      <PageCard>
        <AsyncBoundary
          isLoading={data === undefined || isLoading || !isFetchedAfterMount}
          isError={isError}
        >
          <UserDetailsForm mutationGenerator={useUserEdit} user={data} />
        </AsyncBoundary>
      </PageCard>
    </DefaultLayout>
  );
};

export default UserEdit;
