import { Spinner, TopNavigation } from "@cloudscape-design/components";
import { Outlet, useNavigate } from "react-router-dom";
import { useIsAdmin, useUserAttributes } from "../../common/api";
import { useAuthenticator } from "@aws-amplify/ui-react";

export const AdminSetup = () => {
  const userAttributes = useUserAttributes();
  const navigate = useNavigate();
  const isAdmin = useIsAdmin();
  const { signOut } = useAuthenticator((context) => [context.user]);

  return (
    <>
      <TopNavigation
        identity={{
          title: "Amazon Web Services",
          href: "/",
        }}
        utilities={[
          {
            type: "button",
            text: userAttributes.data.email,
          },
          {
            type: "button",
            text: "Sign Out",
            iconName: "arrow-left",
            onClick: signOut,
          },
          {
            type: "button",
            text: "Controls",
            iconName: "multiscreen",
            onClick: () => navigate("/participant/controls"),
          },
          {
            type: "button",
            text: "3D",
            iconName: "group",
            onClick: () => navigate("/participant"),
          },
        ]}
      />
      {isAdmin.isLoading ? (
        <Spinner />
      ) : isAdmin.data ? (
        <Outlet />
      ) : (
        <>You are not authorised to access /admin</>
      )}
    </>
  );
};
