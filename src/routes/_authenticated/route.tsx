import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { api } from "@/lib/api";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  preload: false,
  beforeLoad: async ({ context, location }) => {
    if (location.pathname === "/auth") return;
    try {
      const res = await context.queryClient.fetchQuery({
        queryKey: ["auth-user"],
        queryFn: api.getMe,
        staleTime: 1000 * 60 * 5,
      });
      if (!res || !res.user) throw new Error("Unauthorized");
      return { user: res.user };
    } catch {
      if (location.pathname !== "/auth") {
        throw redirect({ to: "/auth" });
      }
    }
  },
  component: () => <Outlet />,
});


