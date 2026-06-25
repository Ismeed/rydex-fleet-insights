"use server";

import { dbService } from "@/lib/db-service";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

export async function loginAction(prevState: any, formData: FormData) {
  try {
    const phone = formData.get("phone") as string;
    const password = formData.get("password") as string;

    if (!phone || !password) {
      return { success: false, error: "Please enter phone and password." };
    }

    const user = await dbService.getUserByPhone(phone);
    if (!user || user.password !== password) {
      return { success: false, error: "Invalid phone number or password." };
    }

    // Set cookies for session persistence
    const cookieStore = await cookies();
    cookieStore.set("rydex-phone", user.phone, { path: "/" });
    cookieStore.set("rydex-role", user.role, { path: "/" });
    cookieStore.set("rydex-name", user.name, { path: "/" });
    cookieStore.set("rydex-id", user.id, { path: "/" });

    return { success: true, role: user.role };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to log in." };
  }
}

export async function signupAction(prevState: any, formData: FormData) {
  try {
    const name = formData.get("name") as string;
    const phone = formData.get("phone") as string;
    const password = formData.get("password") as string;

    if (!name || !phone || !password) {
      return { success: false, error: "Please fill in all registration fields." };
    }

    // Check if user already exists
    const existing = await dbService.getUserByPhone(phone);
    if (existing) {
      return { success: false, error: "A user with this phone number already exists." };
    }

    // Create the passenger
    const newUser = await dbService.createUser({
      name,
      phone,
      password,
      role: "PASSENGER",
    });

    // Set cookies immediately to log them in
    const cookieStore = await cookies();
    cookieStore.set("rydex-phone", newUser.phone, { path: "/" });
    cookieStore.set("rydex-role", newUser.role, { path: "/" });
    cookieStore.set("rydex-name", newUser.name, { path: "/" });
    cookieStore.set("rydex-id", newUser.id, { path: "/" });

    revalidatePath("/passengers");

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to register." };
  }
}

export async function startShiftAction(prevState: any, formData: FormData) {
  try {
    const vehicleId = formData.get("vehicleId") as string;
    const driverId = formData.get("driverId") as string;
    const startOdo = parseFloat(formData.get("startOdometer") as string);

    if (!vehicleId || !driverId || isNaN(startOdo)) {
      return { success: false, error: "Please fill in all shift parameters." };
    }

    await dbService.startShift(vehicleId, driverId, startOdo);
    
    revalidatePath("/shifts");
    revalidatePath("/");
    revalidatePath("/vehicles");
    revalidatePath("/drivers");
    
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to start shift." };
  }
}

export async function endShiftAction(prevState: any, formData: FormData) {
  try {
    const shiftId = formData.get("shiftId") as string;
    const endOdo = parseFloat(formData.get("endOdometer") as string);
    const revenue = parseFloat(formData.get("revenue") as string);

    if (!shiftId || isNaN(endOdo) || isNaN(revenue)) {
      return { success: false, error: "Please enter closing odometer and revenue." };
    }

    await dbService.endShift(shiftId, endOdo, revenue);

    revalidatePath("/shifts");
    revalidatePath("/");
    revalidatePath("/vehicles");
    revalidatePath("/drivers");
    revalidatePath("/revenue");

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to end shift." };
  }
}

export async function generateBatchAction(prevState: any, formData: FormData) {
  try {
    const vehicleId = formData.get("vehicleId") as string;
    const driverId = formData.get("driverId") as string;
    const codeCount = parseInt(formData.get("codeCount") as string);

    if (!vehicleId || !driverId || isNaN(codeCount) || codeCount <= 0) {
      return { success: false, error: "Please enter vehicle, driver, and code count." };
    }

    await dbService.generateBatch(vehicleId, driverId, codeCount);

    revalidatePath("/batches");
    revalidatePath("/");

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to generate batch." };
  }
}

export async function redeemCodeAction(code: string, userId: string) {
  try {
    if (!code) {
      return { success: false, error: "Please enter a code." };
    }
    if (!userId) {
      return { success: false, error: "Authentication required." };
    }

    await dbService.redeemCode(code, userId);

    revalidatePath("/portal");
    revalidatePath("/passengers");
    revalidatePath("/");

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Invalid or already used code." };
  }
}

export async function requestRedemptionAction(rewardRequested: string, pointsUsed: number, userId: string) {
  try {
    if (!rewardRequested || !pointsUsed || !userId) {
      return { success: false, error: "Invalid reward parameters." };
    }

    await dbService.createRedemptionRequest(userId, rewardRequested, pointsUsed);

    revalidatePath("/portal");
    revalidatePath("/rewards");
    revalidatePath("/");

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to submit redemption request." };
  }
}

export async function deliverRewardAction(redemptionId: string) {
  try {
    if (!redemptionId) {
      return { success: false, error: "Redemption ID is required." };
    }

    await dbService.deliverReward(redemptionId);

    revalidatePath("/rewards");
    revalidatePath("/");
    revalidatePath("/portal");

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to approve reward." };
  }
}
