import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session-helper";

export const dynamic = "force-dynamic";

export default async function LandingRouterPage() {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect("/login");
  }

  if (user.role === "SUPER_ADMIN") {
    redirect("/admin");
  }

  if (user.role === "COMPANY_OWNER") {
    redirect("/owner");
  }

  if (user.role === "OPERATIONS_MANAGER") {
    redirect("/operations");
  }

  if (user.role === "PASSENGER") {
    redirect("/portal");
  }

  // Fallback to login if role is unknown
  redirect("/login");
}
