import { AuthProvider } from "@/hooks/useAuth";
import { APIProvider } from "@/hooks/useAPI";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Outlet } from "react-router-dom";

const queryClient = new QueryClient();

const Root = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <APIProvider><Outlet/></APIProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default Root;
