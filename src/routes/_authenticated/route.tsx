import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { api } from "@/lib/api";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  preload: false,
  beforeLoad: async ({ context, location }) => {
    if (location.pathname === "/auth") return { user: null };
    try {
      const res = await context.queryClient.fetchQuery({
        queryKey: ["auth-user"],
        queryFn: api.getMe,
        staleTime: 1000 * 60 * 5,
      });
      if (!res || !res.user) throw new Error("Unauthorized");
      return { user: res.user };
    } catch (err) {
      if (err && typeof err === "object" && "to" in err) {
        throw err;
      }
      if (location.pathname !== "/auth") {
        throw redirect({ to: "/auth" });
      }
      return { user: null };
    }
  },
  component: () => <Outlet />,
});


