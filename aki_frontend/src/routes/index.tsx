import { createBrowserRouter, LoaderFunctionArgs } from "react-router-dom";
import MainPage from "@/routes/mainPage";
import ReactGA from "react-ga4";
import RootBoundary from "@/routes/error/rootBoundary";
import logger from "@/utils/logger";
import ViewAll from "@/routes/patients/viewAll";
import ViewInterested from "@/routes/patients/viewInterested";
import Login from "@/routes/auth/login";
import Periodic from "./predictions/periodic";
import Dashboard from "./predictions/dashboard";
import PatientInfo from "./predictions/patientInfo";
import Edit from "./settings/edit";
import Notifications from "./settings/notifications";
import Predictions from "./predictions";
import Root from "@/routes/_core/root";
import { ProtectedRoute } from "@/routes/_core/authenticated";
import UserList from "./users/UserList";
import UserEdit from "./users/UserEdit";
import UserCreate from "./users/UserCreate";
import DepartmentList from "./departments/DepartmentList";
import DepartmentCreate from "./departments/DepartmentCreate";
import DepartmentEdit from "./departments/DepartmentEdit";

export const pageViewLoader = (path: string) => (args: LoaderFunctionArgs) => {
  logger.dev(path);

  ReactGA.ga("set", "page", path);
  ReactGA.ga("send", "pageview");
  return null;
};

const routes = createBrowserRouter([
  {
    element: <Root />,
    children: [
      {
        element: <ProtectedRoute isAllowed={(user) => !user} redirectPath="/" />,
        children: [
          {
            path: "/login",
            element: <Login />,
            errorElement: <RootBoundary />,
            loader: pageViewLoader("/login"),
          },
        ],
      },
      {
        element: <ProtectedRoute isAllowed={(user) => !!user} redirectPath="/login" />,
        children: [
          {
            path: "/",
            element: <MainPage />,
            errorElement: <RootBoundary />,
            loader: pageViewLoader("/"),
          },
          {
            path: "/patients/all",
            element: <ViewAll />,
            errorElement: <RootBoundary />,
            loader: pageViewLoader("/patients/all"),
          },
          {
            path: "/patients/interests",
            element: <ViewInterested />,
            errorElement: <RootBoundary />,
            loader: pageViewLoader("/patients/interests"),
          },
          {
            path: "/predictions",
            element: <Predictions />,
            errorElement: <RootBoundary />,
            loader: pageViewLoader("/predictions/index"),
          },
          {
            path: "/predictions/periodic",
            element: <Periodic />,
            errorElement: <RootBoundary />,
            loader: pageViewLoader("/predictions/periodic"),
          },
          {
            path: "/predictions/dashboard",
            element: <Dashboard />,
            errorElement: <RootBoundary />,
            loader: pageViewLoader("/predictions/dashboard"),
          },
          {
            path: "/predictions/dashboard/:patientMedicalRecordID",
            element: <PatientInfo />,
            errorElement: <RootBoundary />,
            loader: pageViewLoader("/predictions/dashboard"),
          },
          {
            path: "/settings/edit",
            element: <Edit />,
            errorElement: <RootBoundary />,
            loader: pageViewLoader("/settings/edit"),
          },
          {
            path: "/settings/notifications",
            element: <Notifications />,
            errorElement: <RootBoundary />,
            loader: pageViewLoader("/settings/notifications"),
          },
          {
            path: "/admin",
            element: <ProtectedRoute isAllowed={(user) => Boolean(user?.isAdmin)} redirectPath="/" />,
            children: [
              {
                path: 'users',
                element: <UserList/>,
                loader: pageViewLoader("/admin/users"),
              },
              {
                path: 'users/create',
                element: <UserCreate/>,
                loader: pageViewLoader("/admin/users/create"),
              },
              {
                path: 'users/:userID',
                element: <UserEdit/>,
                loader: pageViewLoader("/admin/users/:userID"),
              },
              {
                path: 'departments',
                element: <DepartmentList/>,
                loader: pageViewLoader("/admin/departments"),
              },
              {
                path: 'departments/create',
                element: <DepartmentCreate/>,
                loader: pageViewLoader("/admin/departments/create"),
              },
              {
                path: 'departments/:departmentID',
                element: <DepartmentEdit/>,
                loader: pageViewLoader("/admin/departments/:departmentID"),
              },
            ],
          },
        ],
      },
    ],
  },
]);

export default routes;
