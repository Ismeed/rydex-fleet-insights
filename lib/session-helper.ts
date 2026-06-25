import { cookies } from "next/headers";
import { dbService } from "./db-service";

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const phone = cookieStore.get("rydex-phone")?.value;
  const role = cookieStore.get("rydex-role")?.value;
  const name = cookieStore.get("rydex-name")?.value;
  const id = cookieStore.get("rydex-id")?.value;

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
