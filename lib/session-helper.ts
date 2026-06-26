import { cookies } from "next/headers";
import { dbService } from "./db-service";

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const phone = cookieStore.get("muva-phone")?.value;
  const role = cookieStore.get("muva-role")?.value;
  const name = cookieStore.get("muva-name")?.value;
  const id = cookieStore.get("muva-id")?.value;

  if (!phone || !role || !name || !id) {
    return null;
  }

  // Get freshest points if they are a passenger
  if (role === "PASSENGER") {
    const user = await dbService.getUserByPhone(phone);
    if (user) {
      return {
        id: user.id,
        name: user.name,
        phone: user.phone,
        role: user.role,
        points: user.points,
      };
    }
  }

  return { id, name, phone, role };
}
