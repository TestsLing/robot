import { useIsAdmin, useUserAttributes } from "../../../common/api";
import { TopNavigation } from "@cloudscape-design/components";
import { connectionStatusAtom, navHeightPxAtom } from "../../../common/atom";
import { useAuthenticator } from "@aws-amplify/ui-react";
import { ConnectionStatusColor } from "../utils/utils";
import { useGetSession } from "../api/queries";
import { useNavigate } from "react-router-dom";
import { useCookies } from "react-cookie";
import { useEffect, useRef } from "react";
import { Chip } from "@mui/material";
import { capitalize } from "lodash";
import { useAtom } from "jotai";

export const Navigation = () => {
  const { signOut } = useAuthenticator((context) => [context.user]);

  const [connectionStatus] = useAtom(connectionStatusAtom);
  const [cookies] = useCookies(["GenAIChessDemoSessionID"]);

  const session = useGetSession(cookies.GenAIChessDemoSessionID);
  const userAttributes = useUserAttributes();
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const isAdmin = useIsAdmin();

  const [, setNavHeight] = useAtom(navHeightPxAtom);

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
    <div ref={ref}>
      <TopNavigation
        identity={{ title: "Amazon Web Services", href: "/" }}
        utilities={[
          {
            type: "button",
            text: `Session: ${cookies.GenAIChessDemoSessionID}`,
          },
          {
            type: "button",
            text: (
              <Chip
                label={connectionStatus}
                color={ConnectionStatusColor(connectionStatus)}
              />
            ) as any,
          },
          {
            type: "button",
            text: (
              <Chip
                label={`Game ${
                  session.data.GameStatus === "ERROR"
                    ? "Paused"
                    : capitalize(session.data.GameStatus)
                }`}
                color={
                  ["PLAYING", "COMPLETED"].includes(session.data.GameStatus)
                    ? "success"
                    : "warning"
                }
              />
            ) as any,
          },
          {
            type: "menu-dropdown",
            text: userAttributes.data?.email,
            iconName: "user-profile",
            items: isAdmin
              ? [
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
                ]
              : [
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
  );
};
