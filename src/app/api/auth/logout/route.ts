import { ok, route } from "@/lib/api-helpers";
import { clearSession } from "@/lib/auth";

export const POST = route(async () => {
  await clearSession();
  return ok({ message: "با موفقیت خارج شدید" });
});
