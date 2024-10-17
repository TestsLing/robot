import { useEffect } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { Hub } from "aws-amplify/utils";
import { useAtom } from "jotai";
import { connectionStatusAtom } from "./common/atom";
import { ConnectionState } from "aws-amplify/api";
import { useIsAdmin, useUserAttributes } from "./common/api";
import { Box, Spinner } from "@cloudscape-design/components";

export const App = () => {
  const isAdmin = useIsAdmin();
  const navigate = useNavigate();
  const userAttributes = useUserAttributes();

  const { pathname } = useLocation();

  const [, setConnectionStatus] = useAtom(connectionStatusAtom);

  Hub.listen("api", (data: any) => {
    const { payload } = data;
    if (payload.event === "ConnectionStateChange") {
      const connectionState = payload.data.connectionState as ConnectionState;
      setConnectionStatus(connectionState);
    }
  });

  useEffect(() => {
    if (pathname === "/" && !isAdmin.isLoading) {
      isAdmin.data ? navigate("/admin") : navigate("/participant");
    }
  }, [isAdmin.isLoading]);

  useEffect(() => {
    pathname.split("/")[1] === "participant"
      ? (document.body.style.overflow = "hidden")
      : (document.body.style.overflow = "auto");
  }, [pathname]);

  return userAttributes.isLoading || isAdmin.isLoading ? (
    <Box textAlign={"center"} color={"text-status-info"}>
      Loading Platform
      <Spinner />
    </Box>
  ) : (
    <Outlet />
  );

  return userAttributes.isLoading ? <Spinner /> : <Outlet />;
};
