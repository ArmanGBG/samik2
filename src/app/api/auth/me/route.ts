import { ok, route } from "@/lib/api-helpers";
import { getSessionUser } from "@/lib/auth";

export const GET = route(async () => {
  const user = await getSessionUser();
  return ok({ user });
});
