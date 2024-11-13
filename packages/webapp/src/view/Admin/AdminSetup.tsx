import { Alert, Box, TopNavigation } from "@cloudscape-design/components";
import { useIsAdmin, useUserAttributes } from "../../common/api";
import { useAuthenticator } from "@aws-amplify/ui-react";
import { Outlet, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";

export const AdminSetup = () => {
  const { signOut } = useAuthenticator((context) => [context.user]);

  const [navHeight, setNavHeight] = useState(40);

  const userAttributes = useUserAttributes();
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const isAdmin = useIsAdmin();

  useEffect(() => {
    setNavHeight(ref.current.clientHeight);
  }, [ref.current]);
  useEffect(() => {
    window.addEventListener("resize", () => {
      setNavHeight(ref.current.clientHeight);
    });

    return () => window.removeEventListener("resize", () => {});
  }, []);

  return (
    <>
      <div ref={ref}>
        <TopNavigation
          identity={{
            title: "Amazon Web Services",
            href: "/",
          }}
          utilities={[
            {
              type: "menu-dropdown",
              text: userAttributes.data?.email,
              iconName: "user-profile",
              items: [
                {
                  text: "Participant Views",
                  items: [
                    {
                      id: "controls",
                      text: "Controls",
                      iconName: "star",
                    },
                    {
                      id: "3d",
                      text: "3D",
                      iconName: "view-full",
                    },
                  ],
                },
                {
                  text: "Admin Views",
                  items: [
                    {
                      id: "admin_dash",
                      text: "Dashboard",
                      iconName: "multiscreen",
                    },
                    {
                      id: "leaderboard",
                      text: "Leaderboard",
                      iconName: "gen-ai",
                    },
                  ],
                },
                { id: "signout", text: "Sign out" },
              ],
              onItemClick: ({ detail }) => {
                switch (detail.id) {
                  case "controls":
                    return navigate("/participant/controls");
                  case "3d":
                    return navigate("/participant");
                  case "admin_dash":
                    return navigate("/admin");
                  case "leaderboard":
                    return navigate("/admin/leaderboard");
                  case "signout":
                    return signOut();
                  default:
                    break;
                }
              },
            },
          ]}
        />
      </div>
      {isAdmin.data ? (
        <div
          style={{
            height: `calc(100vh - ${navHeight}px)`,
          }}
        >
          <Outlet />
        </div>
      ) : (
        <div style={{ margin: 15 }}>
          <Alert type="error">You are not authorised to access this page</Alert>
        </div>
      )}
    </>
  );
};
