import { requireUser } from "@/lib/auth";
import { redirect } from "next/navigation";
export default async function Dashboard() {
  const user = await requireUser();
  redirect(
    user.role === "admin"
      ? "/admin"
      : user.role === "doctor"
        ? "/doctor"
        : "/patient",
  );
}
