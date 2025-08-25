import DefaultLayout from "@/layouts/DefaultLayout";
import PageCard from "@/components/global/pageCard";
import UserListViewer from "@/components/users/UserListViewer";

const UserList = () => {
  return (
    <DefaultLayout currentPage={"admin"} subPage={"users"}>
      <PageCard>
        <UserListViewer />
      </PageCard>
    </DefaultLayout>
  );
};

export default UserList;