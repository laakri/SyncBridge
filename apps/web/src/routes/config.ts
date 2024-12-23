import { LayoutDashboard } from "lucide-react";

interface RouteConfig {
  path: string;
  label: string;
  icon: any;
  requiresAuth: boolean;
  children?: RouteConfig[];
}

export const routes: RouteConfig[] = [
  {
    path: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    requiresAuth: true,
  },
  {
    path: "/device-test",
    label: "DeviceTest",
    icon: LayoutDashboard,
    requiresAuth: true,
  },

  //nested route example
  //   {
  //     path: "/team",
  //     label: "Team",
  //     icon: Users,
  //     requiresAuth: true,
  //     children: [
  //       {
  //         path: "/team/members",
  //         label: "Members",
  //         icon: Users,
  //         requiresAuth: true,
  //       },
  //       {
  //         path: "/team/invites",
  //         label: "Invites",
  //         icon: Users,
  //         requiresAuth: true,
  //       },
  //     ],
  //   },
];
