import { useNavigate, useLocation } from "@tanstack/react-router";
import { routes } from "../routes/config";

export function useNavigation() {
  const navigate = useNavigate();
  const location = useLocation();

  const isActiveRoute = (path: string) => {
    return (
      location.pathname === path || location.pathname.startsWith(`${path}/`)
    );
  };

  const navigateWithTransition = (path: string) => {
    if ("startViewTransition" in document) {
      // @ts-ignore - View Transitions API
      document.startViewTransition(() => {
        navigate({ to: path });
      });
    } else {
      navigate({ to: path });
    }
  };

  return {
    routes,
    isActiveRoute,
    navigateWithTransition,
    currentPath: location.pathname,
  };
}
