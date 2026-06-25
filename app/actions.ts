"use server";

import { dbService } from "@/lib/db-service";
import { emailService } from "@/lib/email-service";
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

    const updated = await dbService.deliverReward(redemptionId);
    
    if (updated && updated.passenger) {
      const p = updated.passenger;
      const cleanEmailName = p.name.toLowerCase().replace(/[^a-z0-9]/g, "");
      const derivedEmail = `${cleanEmailName}@example.com`;
      // Dispatch branded email asynchronously
      emailService.sendDeliveryEmail(p.name, derivedEmail, updated.rewardRequested)
        .catch(err => console.error("Async email dispatch failed:", err));
    }

    revalidatePath("/rewards");
    revalidatePath("/");
    revalidatePath("/portal");

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to approve reward." };
  }
}

export async function createVehicleAction(prevState: any, formData: FormData) {
  try {
    const id = formData.get("id") as string;
    const vehicleNumber = formData.get("vehicleNumber") as string;
    const plateNumber = formData.get("plateNumber") as string;
    const vehicleType = formData.get("vehicleType") as string;
    const fuelType = formData.get("fuelType") as string;
    const ownerId = formData.get("ownerId") as string;
    const assignedDriverId = formData.get("assignedDriverId") as string;
    const status = formData.get("status") as string;

    if (!id || !vehicleNumber || !plateNumber) {
      return { success: false, error: "Vehicle ID, Number, and Plate Number are required." };
    }

    await dbService.createVehicle({
      id: id.toLowerCase().trim(),
      vehicleNumber: vehicleNumber.trim(),
      plateNumber: plateNumber.trim(),
      vehicleType: vehicleType || "Keke Napep",
      fuelType: fuelType || "CNG",
      ownerId: ownerId || undefined,
      assignedDriverId: assignedDriverId || undefined,
      status: status || "ACTIVE",
    });

    revalidatePath("/vehicles");
    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to create vehicle." };
  }
}

export async function updateVehicleAction(prevState: any, formData: FormData) {
  try {
    const id = formData.get("id") as string;
    const vehicleNumber = formData.get("vehicleNumber") as string;
    const plateNumber = formData.get("plateNumber") as string;
    const vehicleType = formData.get("vehicleType") as string;
    const fuelType = formData.get("fuelType") as string;
    const ownerId = formData.get("ownerId") as string;
    const assignedDriverId = formData.get("assignedDriverId") as string;
    const status = formData.get("status") as string;

    if (!id) {
      return { success: false, error: "Vehicle ID is required." };
    }

    await dbService.updateVehicle(id, {
      vehicleNumber: vehicleNumber || undefined,
      plateNumber: plateNumber || undefined,
      vehicleType: vehicleType || undefined,
      fuelType: fuelType || undefined,
      ownerId: ownerId === "none" ? undefined : ownerId || undefined,
      assignedDriverId: assignedDriverId === "none" ? undefined : assignedDriverId || undefined,
      status: status || undefined,
    });

    revalidatePath("/vehicles");
    revalidatePath(`/vehicles/${id}`);
    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to update vehicle." };
  }
}

export async function disableVehicleAction(id: string) {
  try {
    if (!id) {
      return { success: false, error: "Vehicle ID is required." };
    }
    await dbService.disableVehicle(id);
    revalidatePath("/vehicles");
    revalidatePath(`/vehicles/${id}`);
    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to disable vehicle." };
  }
}

export async function createDriverAction(prevState: any, formData: FormData) {
  try {
    const name = formData.get("name") as string;
    const phone = formData.get("phone") as string;
    const address = formData.get("address") as string;
    const guarantorName = formData.get("guarantorName") as string;
    const guarantorPhone = formData.get("guarantorPhone") as string;
    const status = formData.get("status") as string;

    if (!name || !phone) {
      return { success: false, error: "Driver Name and Phone are required." };
    }

    await dbService.createDriver({
      name: name.trim(),
      phone: phone.trim(),
      address: address || "",
      guarantorName: guarantorName || "",
      guarantorPhone: guarantorPhone || "",
      status: status || "active",
    });

    revalidatePath("/drivers");
    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to create driver." };
  }
}

export async function updateDriverAction(prevState: any, formData: FormData) {
  try {
    const id = formData.get("id") as string;
    const name = formData.get("name") as string;
    const phone = formData.get("phone") as string;
    const address = formData.get("address") as string;
    const guarantorName = formData.get("guarantorName") as string;
    const guarantorPhone = formData.get("guarantorPhone") as string;
    const status = formData.get("status") as string;

    if (!id) {
      return { success: false, error: "Driver ID is required." };
    }

    await dbService.updateDriver(id, {
      name: name || undefined,
      phone: phone || undefined,
      address: address || undefined,
      guarantorName: guarantorName || undefined,
      guarantorPhone: guarantorPhone || undefined,
      status: status || undefined,
    });

    revalidatePath("/drivers");
    revalidatePath(`/drivers/${id}`);
    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to update driver." };
  }
}

export async function suspendDriverAction(id: string) {
  try {
    if (!id) {
      return { success: false, error: "Driver ID is required." };
    }
    await dbService.suspendDriver(id);
    revalidatePath("/drivers");
    revalidatePath(`/drivers/${id}`);
    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to suspend driver." };
  }
}
