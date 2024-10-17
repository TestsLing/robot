import {
  Link,
  SideNavigation,
  SideNavigationProps,
} from "@cloudscape-design/components";
import { useNavigate } from "react-router-dom";

export const LeftNavigation = () => {
  const navigate = useNavigate();

  const navItems: SideNavigationProps.Item[] = [
    {
      text: "Admin",
      type: "section",
      items: [
        {
          type: "link",
          text: "",
          href: "",
          info: (
            <Link
              onFollow={() => {
                navigate("/admin");
              }}
              variant="info"
            >
              Active Sessions
            </Link>
          ),
        },
        {
          type: "link",
          text: "",
          href: "",
          info: (
            <Link
              onFollow={() => {
                navigate("/admin/dashboard");
              }}
              variant="info"
            >
              Dashboard
            </Link>
          ),
        },
      ],
    },
  ];

  return (
    <SideNavigation
      header={{
        logo: { alt: "logo", src: "/logo192.png" },
        text: "GenAI Chess",
        href: "/",
      }}
      items={navItems}
    />
  );
};
