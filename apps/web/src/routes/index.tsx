import {
  createRouter,
  createRoute,
  createRootRoute,
  Route,
} from "@tanstack/react-router";
import { Layout } from "../components/layout/Layout";
import { LandingPage } from "../components/landing/LandingPage";
import { AuthPage } from "../pages/AuthPage";
import { VerifyEmailPage } from "../pages/VerifyEmailPage";
import { DevicesPage } from "../pages/DevicesPage";

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
// Dashboard route with auth protection
// const dashboardRoute = createRoute({
//   getParentRoute: () => rootRoute,
//   path: "/dashboard",
//   component: () => (
//     <ProtectedRoute>
//       <Dashboard />
//     </ProtectedRoute>
//   ),
// });

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
  verifyEmailRoute,
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
