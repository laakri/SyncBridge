import {
  createRouter,
  createRoute,
  createRootRoute,
  Route,
} from "@tanstack/react-router";
import { Layout } from "../components/layout/Layout";
import { LandingPage } from "../components/landing/LandingPage";
import { AuthPage } from "../components/auth/AuthPage";
import { VerifyEmailPage } from "../components/auth/VerifyEmailPage";
import { SyncDashboard } from "../components/sync/SyncDashboard";
import { DevicesPage } from "../components/sync/DevicesPage";
import { ProfileDashboard } from "../components/profile/ProfileDashboard";
import { NotificationSettings } from "../components/profile/settings/NotificationSettings";
import { PreferenceSettings } from "../components/profile/settings/PreferenceSettings";
import { SecuritySettings } from "../components/profile/settings/SecuritySettings";

// Root layout route - This is your base layout that wraps all pages
const rootRoute = createRootRoute({
  component: Layout,
});

// Landing page route
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: () => <LandingPage />,
});

// Auth route
const authRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/auth",
  component: () => <AuthPage />,
});
export const devicesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/devices",
  component: DevicesPage,
});
export const syncRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/sync",
  component: SyncDashboard,
});
export const profileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/profile",
  component: ProfileDashboard,
});
export const securitySettingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/settings/security",
  component: SecuritySettings,
});

export const notificationsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/settings/notifications",
  component: NotificationSettings,
});

export const preferencesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/settings/preferences",
  component: PreferenceSettings,
});

// Export the route
export const verifyEmailRoute = new Route({
  getParentRoute: () => rootRoute,
  path: "verify-email",
  component: VerifyEmailPage,
  validateSearch: (search: Record<string, unknown>) => {
    return {
      token: search.token as string,
    };
  },
});

// Create and export the router configuration
export const routeTree = rootRoute.addChildren([
  indexRoute,
  authRoute,
  devicesRoute,
  syncRoute,
  profileRoute,
  verifyEmailRoute,
  securitySettingsRoute,
  notificationsRoute,
  preferencesRoute,
]);

// Create the router instance
export const router = createRouter({
  routeTree,
  defaultPreload: "intent",
});

// Type declarations for TypeScript
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
