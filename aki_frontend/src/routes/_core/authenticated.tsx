import { useAuth } from "@/hooks/useAuth";
import { User } from "@/types/user";
import React, { useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";

type ProtectedRouteProps = {
  isAllowed: boolean | ((user: User | null) => boolean);
  redirectPath: string;
};

export const ProtectedRoute: React.FC<React.PropsWithChildren<ProtectedRouteProps>> = ({
  isAllowed,
  redirectPath = "/",
  children,
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const redirectRequired = !(typeof isAllowed === "function" ? isAllowed(user) : isAllowed);

    if (redirectRequired) navigate(redirectPath);
  }, [user, isAllowed]);

  return children ? <>children</> : <Outlet />;
};
