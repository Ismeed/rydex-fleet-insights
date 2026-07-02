"use server";

import { dbService } from "@/lib/db-service";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { getCurrentUser } from "@/lib/session-helper";

export async function loginAction(prevState: any, formData: FormData) {
  try {
    const identifier = formData.get("phone") as string;
    const password = formData.get("password") as string;

    if (!identifier || !password) {
      return { success: false, error: "Please enter phone number and password." };
    }

    const user = await dbService.getUserByPhoneOrEmail(identifier);
    if (!user || user.password !== password) {
      return { success: false, error: "Invalid credentials." };
    }

    if (user.status === "suspended") {
      return { success: false, error: "Your account has been suspended. Please contact support." };
    }

    // Set cookies for session persistence
    const cookieStore = await cookies();
    cookieStore.set("muva-phone", user.phone, { path: "/" });
    cookieStore.set("muva-role", user.role, { path: "/" });
    cookieStore.set("muva-name", user.name, { path: "/" });
    cookieStore.set("muva-id", user.id, { path: "/" });
    if (user.companyId) {
      cookieStore.set("muva-company-id", user.companyId, { path: "/" });
    } else {
      cookieStore.delete("muva-company-id");
    }

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
    const companyName = formData.get("companyName") as string;
    const fleetType = formData.get("fleetType") as string;

    if (!name || !phone || !password || !companyName) {
      return { success: false, error: "Please fill in all registration fields." };
    }

    // Check if user already exists
    const existing = await dbService.getUserByPhone(phone);
    if (existing) {
      return { success: false, error: "A user with this phone number already exists." };
    }

    // Create the Company
    const newCompany = await dbService.createCompany({
      name: companyName,
      phone,
      fleetType: fleetType || "General",
      subscription: "TRIAL",
    });

    // Create the User (Company Owner)
    const newUser = await dbService.createUser({
      name,
      phone,
      password,
      role: "COMPANY_OWNER",
      companyId: newCompany.id,
    });

    // Log them in immediately
    const cookieStore = await cookies();
    cookieStore.set("muva-phone", newUser.phone, { path: "/" });
    cookieStore.set("muva-role", newUser.role, { path: "/" });
    cookieStore.set("muva-name", newUser.name, { path: "/" });
    cookieStore.set("muva-id", newUser.id, { path: "/" });
    cookieStore.set("muva-company-id", newCompany.id, { path: "/" });

    return { success: true, role: newUser.role };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to register." };
  }
}

// SHIFTS
export async function startShiftAction(prevState: any, formData: FormData) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "SUPER_ADMIN" && user.role !== "COMPANY_OWNER" && user.role !== "OPERATIONS_MANAGER")) {
      return { success: false, error: "Unauthorized. Operational permissions required." };
    }

    const companyId = user.companyId || (formData.get("companyId") as string);
    if (!companyId) {
      return { success: false, error: "Company context missing." };
    }

    const vehicleId = formData.get("vehicleId") as string;
    const driverId = formData.get("driverId") as string;
    const startOdo = parseFloat(formData.get("startOdometer") as string);

    if (!vehicleId || !driverId || isNaN(startOdo)) {
      return { success: false, error: "Please fill in all shift parameters." };
    }

    await dbService.startShift(vehicleId, driverId, startOdo, companyId);
    
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
    const user = await getCurrentUser();
    if (!user || (user.role !== "SUPER_ADMIN" && user.role !== "COMPANY_OWNER" && user.role !== "OPERATIONS_MANAGER")) {
      return { success: false, error: "Unauthorized. Operational permissions required." };
    }

    const companyId = user.companyId || (formData.get("companyId") as string);
    if (!companyId) {
      return { success: false, error: "Company context missing." };
    }

    const shiftId = formData.get("shiftId") as string;
    const endOdo = parseFloat(formData.get("endOdometer") as string);
    const revenue = parseFloat(formData.get("revenue") as string); // amountReceived
    
    const amountExpected = parseFloat(formData.get("amountExpected") as string) || 0;
    const amountReceived = revenue;
    const outstandingBalance = Math.max(0, amountExpected - amountReceived);
    const remarks = (formData.get("remarks") as string) || "";

    if (!shiftId || isNaN(endOdo) || isNaN(revenue)) {
      return { success: false, error: "Please enter closing odometer and remittance amount." };
    }

    await dbService.endShift(shiftId, endOdo, revenue, amountExpected, amountReceived, outstandingBalance, remarks, companyId);

    revalidatePath("/shifts");
    revalidatePath("/");
    revalidatePath("/vehicles");
    revalidatePath("/drivers");
    revalidatePath("/revenue");
    revalidatePath("/contracts");

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to end shift." };
  }
}

export async function recordDailyRevenueAction(prevState: any, formData: FormData) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "SUPER_ADMIN" && user.role !== "COMPANY_OWNER" && user.role !== "OPERATIONS_MANAGER")) {
      return { success: false, error: "Unauthorized." };
    }

    const companyId = user.companyId || (formData.get("companyId") as string);
    if (!companyId) {
      return { success: false, error: "Company context missing." };
    }

    const vehicleId = formData.get("vehicleId") as string;
    const driverId = formData.get("driverId") as string;
    const revenue = parseFloat(formData.get("revenue") as string);
    const dateStr = formData.get("date") as string;
    const notes = formData.get("notes") as string;

    if (!vehicleId || !driverId || isNaN(revenue) || !dateStr) {
      return { success: false, error: "Please specify vehicle, driver, date, and remittance amount." };
    }

    await dbService.recordDailyRevenue(vehicleId, driverId, revenue, dateStr, notes, companyId);

    revalidatePath("/shifts");
    revalidatePath("/");
    revalidatePath("/revenue");
    revalidatePath("/contracts");

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to record daily remittance." };
  }
}

// VEHICLES
export async function createVehicleAction(prevState: any, formData: FormData) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "SUPER_ADMIN" && user.role !== "COMPANY_OWNER" && user.role !== "OPERATIONS_MANAGER")) {
      return { success: false, error: "Unauthorized. Operational permissions required." };
    }

    const companyId = user.companyId || (formData.get("companyId") as string);
    if (!companyId) {
      return { success: false, error: "Company context missing." };
    }

    const id = formData.get("id") as string;
    const vehicleNumber = formData.get("vehicleNumber") as string;
    const plateNumber = formData.get("plateNumber") as string;
    const vehicleType = formData.get("vehicleType") as string;
    const fuelType = formData.get("fuelType") as string;
    
    const registrationNumber = formData.get("registrationNumber") as string;
    const engineNumber = formData.get("engineNumber") as string;
    const chassisNumber = formData.get("chassisNumber") as string;
    const purchaseDate = formData.get("purchaseDate") as string;
    const purchasePrice = parseFloat(formData.get("purchasePrice") as string) || null;

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
      companyId,
      registrationNumber: registrationNumber || null,
      engineNumber: engineNumber || null,
      chassisNumber: chassisNumber || null,
      purchaseDate: purchaseDate || null,
      purchasePrice,
      assignedDriverId: assignedDriverId === "none" ? null : assignedDriverId || null,
      status: status || "AVAILABLE",
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
    const user = await getCurrentUser();
    if (!user || (user.role !== "SUPER_ADMIN" && user.role !== "COMPANY_OWNER" && user.role !== "OPERATIONS_MANAGER")) {
      return { success: false, error: "Unauthorized." };
    }

    const id = formData.get("id") as string;
    if (!id) {
      return { success: false, error: "Vehicle ID is required." };
    }

    const existing = await dbService.getVehicleById(id);
    if (!existing) {
      return { success: false, error: "Vehicle not found." };
    }

    // Verify company scope
    if (user.role !== "SUPER_ADMIN" && existing.companyId !== user.companyId) {
      return { success: false, error: "Unauthorized. Cross-tenant access blocked." };
    }

    const assignedDriverId = formData.get("assignedDriverId") as string;
    const status = formData.get("status") as string;

    const vehicleNumber = formData.get("vehicleNumber") as string;
      const plateNumber = formData.get("plateNumber") as string;
      const vehicleType = formData.get("vehicleType") as string;
      const fuelType = formData.get("fuelType") as string;

      const registrationNumber = formData.get("registrationNumber") as string;
      const engineNumber = formData.get("engineNumber") as string;
      const chassisNumber = formData.get("chassisNumber") as string;
      const purchaseDate = formData.get("purchaseDate") as string;
      const purchasePrice = parseFloat(formData.get("purchasePrice") as string);

      await dbService.updateVehicle(id, {
        vehicleNumber: vehicleNumber || undefined,
        plateNumber: plateNumber || undefined,
        vehicleType: vehicleType || undefined,
        fuelType: fuelType || undefined,
        assignedDriverId: assignedDriverId === "none" ? null : assignedDriverId || null,
        status: status || undefined,
        registrationNumber: registrationNumber || undefined,
        engineNumber: engineNumber || undefined,
        chassisNumber: chassisNumber || undefined,
        purchaseDate: purchaseDate || undefined,
        purchasePrice: isNaN(purchasePrice) ? undefined : purchasePrice,
      });

    revalidatePath("/vehicles");
    revalidatePath(`/vehicles/${id}`);
    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to update vehicle." };
  }
}

export async function disableVehicleAction(prevState: any, formData: FormData) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "SUPER_ADMIN" && user.role !== "COMPANY_OWNER" && user.role !== "OPERATIONS_MANAGER")) {
      return { success: false, error: "Unauthorized. Operational permissions required." };
    }

    const id = formData.get("id") as string;
    const existing = await dbService.getVehicleById(id);
    if (!existing) {
      return { success: false, error: "Vehicle not found." };
    }

    if (user.role !== "SUPER_ADMIN" && existing.companyId !== user.companyId) {
      return { success: false, error: "Unauthorized." };
    }

    await dbService.disableVehicle(id);

    revalidatePath("/vehicles");
    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to disable vehicle." };
  }
}

// DRIVERS
export async function createDriverAction(prevState: any, formData: FormData) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "SUPER_ADMIN" && user.role !== "COMPANY_OWNER" && user.role !== "OPERATIONS_MANAGER")) {
      return { success: false, error: "Unauthorized." };
    }

    const companyId = user.companyId || (formData.get("companyId") as string);
    if (!companyId) {
      return { success: false, error: "Company context missing." };
    }

    const name = formData.get("name") as string;
    const phone = formData.get("phone") as string;
    const address = formData.get("address") as string;
    const guarantorName = formData.get("guarantorName") as string;
    const guarantorPhone = formData.get("guarantorPhone") as string;
    
    const passport = formData.get("passport") as string;
    const emergencyContact = formData.get("emergencyContact") as string;
    const nextOfKin = formData.get("nextOfKin") as string;
    const licenseNumber = formData.get("licenseNumber") as string;
    const nationalId = formData.get("nationalId") as string;

    if (!name || !phone || !address) {
      return { success: false, error: "Name, Phone, and Address are required." };
    }

    await dbService.createDriver({
      name,
      phone,
      address,
      guarantorName: guarantorName || "None",
      guarantorPhone: guarantorPhone || "None",
      companyId,
      passport: passport || null,
      emergencyContact: emergencyContact || null,
      nextOfKin: nextOfKin || null,
      licenseNumber: licenseNumber || null,
      nationalId: nationalId || null,
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
    const user = await getCurrentUser();
    if (!user || (user.role !== "SUPER_ADMIN" && user.role !== "COMPANY_OWNER" && user.role !== "OPERATIONS_MANAGER")) {
      return { success: false, error: "Unauthorized." };
    }

    const id = formData.get("id") as string;
    const existing = await dbService.getDriverById(id);
    if (!existing) {
      return { success: false, error: "Driver not found." };
    }

    if (user.role !== "SUPER_ADMIN" && existing.companyId !== user.companyId) {
      return { success: false, error: "Unauthorized." };
    }

    const name = formData.get("name") as string;
    const phone = formData.get("phone") as string;
    const address = formData.get("address") as string;
    const guarantorName = formData.get("guarantorName") as string;
    const guarantorPhone = formData.get("guarantorPhone") as string;
    const status = formData.get("status") as string;

    const passport = formData.get("passport") as string;
    const emergencyContact = formData.get("emergencyContact") as string;
    const nextOfKin = formData.get("nextOfKin") as string;
    const licenseNumber = formData.get("licenseNumber") as string;
    const nationalId = formData.get("nationalId") as string;

    await dbService.updateDriver(id, {
      name: name || undefined,
      phone: phone || undefined,
      address: address || undefined,
      guarantorName: guarantorName || undefined,
      guarantorPhone: guarantorPhone || undefined,
      status: status || undefined,
      passport: passport || undefined,
      emergencyContact: emergencyContact || undefined,
      nextOfKin: nextOfKin || undefined,
      licenseNumber: licenseNumber || undefined,
      nationalId: nationalId || undefined,
    });

    revalidatePath("/drivers");
    revalidatePath(`/drivers/${id}`);
    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to update driver." };
  }
}

export async function suspendDriverAction(prevState: any, formData: FormData) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "SUPER_ADMIN" && user.role !== "COMPANY_OWNER")) {
      return { success: false, error: "Unauthorized." };
    }

    const id = formData.get("id") as string;
    const existing = await dbService.getDriverById(id);
    if (!existing) {
      return { success: false, error: "Driver not found." };
    }

    if (user.role !== "SUPER_ADMIN" && existing.companyId !== user.companyId) {
      return { success: false, error: "Unauthorized." };
    }

    await dbService.suspendDriver(id);

    revalidatePath("/drivers");
    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to suspend driver." };
  }
}

// STAFF/USER CREATION
export async function createUserAction(prevState: any, formData: FormData) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "SUPER_ADMIN" && user.role !== "COMPANY_OWNER")) {
      return { success: false, error: "Unauthorized." };
    }

    const companyId = user.companyId || (formData.get("companyId") as string);
    const name = formData.get("name") as string;
    const phone = formData.get("phone") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const role = formData.get("role") as string; // OPERATIONS_MANAGER, COMPANY_OWNER, etc.

    if (!name || !phone || !password || !role) {
      return { success: false, error: "Name, Phone, Password, and Role are required." };
    }

    // Only SUPER_ADMIN can create users without a company, or create other SUPER_ADMINs
    if (user.role !== "SUPER_ADMIN" && (role === "SUPER_ADMIN" || !companyId)) {
      return { success: false, error: "Unauthorized." };
    }

    await dbService.createUser({
      name,
      phone,
      email: email || null,
      password,
      role,
      companyId: companyId || null,
    });

    revalidatePath("/owners");
    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to create user." };
  }
}

export async function updateUserAction(prevState: any, formData: FormData) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "SUPER_ADMIN" && user.role !== "COMPANY_OWNER")) {
      return { success: false, error: "Unauthorized." };
    }

    const id = formData.get("id") as string;
    const existing = await dbService.getUserById(id);
    if (!existing) {
      return { success: false, error: "User not found." };
    }

    if (user.role !== "SUPER_ADMIN" && existing.companyId !== user.companyId) {
      return { success: false, error: "Unauthorized." };
    }

    const name = formData.get("name") as string;
    const phone = formData.get("phone") as string;
    const email = formData.get("email") as string;
    const role = formData.get("role") as string;

    await dbService.updateUser(id, {
      name: name || undefined,
      phone: phone || undefined,
      email: email || undefined,
      role: role || undefined,
    });

    revalidatePath("/owners");
    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to update user." };
  }
}

export async function suspendUserAction(prevState: any, formData: FormData) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "SUPER_ADMIN" && user.role !== "COMPANY_OWNER")) {
      return { success: false, error: "Unauthorized." };
    }

    const id = formData.get("id") as string;
    const existing = await dbService.getUserById(id);
    if (!existing) {
      return { success: false, error: "User not found." };
    }

    if (user.role !== "SUPER_ADMIN" && existing.companyId !== user.companyId) {
      return { success: false, error: "Unauthorized." };
    }

    await dbService.suspendUser(id);

    revalidatePath("/owners");
    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to suspend user." };
  }
}

export async function unsuspendUserAction(prevState: any, formData: FormData) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "SUPER_ADMIN" && user.role !== "COMPANY_OWNER")) {
      return { success: false, error: "Unauthorized." };
    }

    const id = formData.get("id") as string;
    const existing = await dbService.getUserById(id);
    if (!existing) {
      return { success: false, error: "User not found." };
    }

    if (user.role !== "SUPER_ADMIN" && existing.companyId !== user.companyId) {
      return { success: false, error: "Unauthorized." };
    }

    await dbService.unsuspendUser(id);

    revalidatePath("/owners");
    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to unsuspend user." };
  }
}

// COMPANIES
export async function createCompanyAction(prevState: any, formData: FormData) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "SUPER_ADMIN") {
      return { success: false, error: "Unauthorized. Super Admin rights required." };
    }

    const name = formData.get("name") as string;
    const phone = formData.get("phone") as string;
    const email = formData.get("email") as string;
    const address = formData.get("address") as string;
    const fleetType = formData.get("fleetType") as string;
    const subscription = formData.get("subscription") as string;

    if (!name || !phone) {
      return { success: false, error: "Company name and phone number are required." };
    }

    await dbService.createCompany({
      name,
      phone,
      email: email || null,
      address: address || null,
      fleetType: fleetType || "General",
      subscription: subscription || "TRIAL",
    });

    revalidatePath("/admin");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to create company." };
  }
}

export async function updateCompanyAction(prevState: any, formData: FormData) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "SUPER_ADMIN" && user.role !== "COMPANY_OWNER")) {
      return { success: false, error: "Unauthorized." };
    }

    const id = formData.get("id") as string;
    if (user.role !== "SUPER_ADMIN" && id !== user.companyId) {
      return { success: false, error: "Unauthorized." };
    }

    const name = formData.get("name") as string;
    const phone = formData.get("phone") as string;
    const email = formData.get("email") as string;
    const address = formData.get("address") as string;
    const state = formData.get("state") as string;
    const country = formData.get("country") as string;
    const fleetType = formData.get("fleetType") as string;
    const subscription = formData.get("subscription") as string;
    const status = formData.get("status") as string;

    const data: any = {};
    if (name) data.name = name;
    if (phone) data.phone = phone;
    if (email) data.email = email;
    if (address) data.address = address;
    if (state) data.state = state;
    if (country) data.country = country;
    if (fleetType) data.fleetType = fleetType;
    
    // Only Super Admin can mutate subscription or status
    if (user.role === "SUPER_ADMIN") {
      if (subscription) data.subscription = subscription;
      if (status) data.status = status;
    }

    await dbService.updateCompany(id, data);

    revalidatePath("/");
    revalidatePath("/admin");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to update company." };
  }
}

// HIRE PURCHASE CONTRACTS
export async function createHirePurchaseContractAction(prevState: any, formData: FormData) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "SUPER_ADMIN" && user.role !== "COMPANY_OWNER" && user.role !== "OPERATIONS_MANAGER")) {
      return { success: false, error: "Unauthorized." };
    }

    const companyId = user.companyId || (formData.get("companyId") as string);
    if (!companyId) {
      return { success: false, error: "Company context missing." };
    }

    const vehicleId = formData.get("vehicleId") as string;
    const driverId = formData.get("driverId") as string;
    const targetAmount = parseFloat(formData.get("targetAmount") as string);
    const dailyTarget = parseFloat(formData.get("dailyTarget") as string);
    const startDate = formData.get("startDate") as string;

    if (!vehicleId || !driverId || isNaN(targetAmount) || isNaN(dailyTarget) || !startDate) {
      return { success: false, error: "Please enter all Hire Purchase contract parameters." };
    }

    await dbService.createHirePurchaseContract({
      vehicleId,
      driverId,
      targetAmount,
      dailyTarget,
      startDate,
      companyId,
    });

    revalidatePath("/contracts");
    revalidatePath("/");
    revalidatePath(`/vehicles/${vehicleId}`);
    revalidatePath(`/drivers/${driverId}`);

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to create Hire Purchase contract." };
  }
}

export async function updateHirePurchaseContractAction(prevState: any, formData: FormData) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "SUPER_ADMIN" && user.role !== "COMPANY_OWNER" && user.role !== "OPERATIONS_MANAGER")) {
      return { success: false, error: "Unauthorized." };
    }

    const id = formData.get("id") as string;
    const existing = await dbService.getHirePurchaseContractById(id);
    if (!existing) {
      return { success: false, error: "Contract not found." };
    }

    if (user.role !== "SUPER_ADMIN" && existing.companyId !== user.companyId) {
      return { success: false, error: "Unauthorized." };
    }

    const targetAmount = parseFloat(formData.get("targetAmount") as string);
    const dailyTarget = parseFloat(formData.get("dailyTarget") as string);
    const totalPaid = parseFloat(formData.get("totalPaid") as string);
    const status = formData.get("status") as string;

    const data: any = {};
    if (!isNaN(targetAmount)) data.targetAmount = targetAmount;
    if (!isNaN(dailyTarget)) data.dailyTarget = dailyTarget;
    if (!isNaN(totalPaid)) {
      data.totalPaid = totalPaid;
      if (!isNaN(targetAmount)) {
        data.remainingBalance = Math.max(0, targetAmount - totalPaid);
      } else {
        data.remainingBalance = Math.max(0, existing.targetAmount - totalPaid);
      }
    }
    if (status) data.status = status;

    await dbService.updateHirePurchaseContract(id, data);

    revalidatePath("/contracts");
    revalidatePath("/");
    revalidatePath(`/vehicles/${existing.vehicleId}`);
    revalidatePath(`/drivers/${existing.driverId}`);

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to update Hire Purchase contract." };
  }
}

// MAINTENANCE
export async function createMaintenanceJobAction(prevState: any, formData: FormData) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "SUPER_ADMIN" && user.role !== "COMPANY_OWNER" && user.role !== "OPERATIONS_MANAGER")) {
      return { success: false, error: "Unauthorized." };
    }

    const companyId = user.companyId || (formData.get("companyId") as string);
    if (!companyId) {
      return { success: false, error: "Company context missing." };
    }

    const vehicleId = formData.get("vehicleId") as string;
    const type = formData.get("type") as string; // GENERAL_SERVICE, etc.
    const workshop = formData.get("workshop") as string;
    const cost = parseFloat(formData.get("cost") as string);
    const date = formData.get("date") as string;
    const notes = formData.get("notes") as string;

    if (!vehicleId || !type || !workshop || isNaN(cost) || !date) {
      return { success: false, error: "Please enter all maintenance details." };
    }

    await dbService.createMaintenanceJob({
      type,
      workshop,
      cost,
      date,
      notes: notes || null,
      companyId,
      vehicleId,
    });

    revalidatePath("/vehicles");
    revalidatePath(`/vehicles/${vehicleId}`);
    revalidatePath("/");

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to log maintenance." };
  }
}

export async function createBulkMaintenanceJobAction(prevState: any, formData: FormData) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "SUPER_ADMIN" && user.role !== "COMPANY_OWNER" && user.role !== "OPERATIONS_MANAGER")) {
      return { success: false, error: "Unauthorized." };
    }

    const companyId = user.companyId || (formData.get("companyId") as string);
    if (!companyId) {
      return { success: false, error: "Company context missing." };
    }

    const type = formData.get("type") as string;
    const workshop = formData.get("workshop") as string;
    const cost = parseFloat(formData.get("cost") as string); // cost per vehicle
    const date = formData.get("date") as string;
    const notes = formData.get("notes") as string;
    const vehicleIdsStr = formData.get("vehicleIds") as string; // comma-separated vehicle IDs

    if (!type || !workshop || isNaN(cost) || !date || !vehicleIdsStr) {
      return { success: false, error: "Please fill in type, workshop, cost, date, and select vehicles." };
    }

    const vehicleIds = vehicleIdsStr.split(",").map((id) => id.trim()).filter((id) => id.length > 0);
    if (vehicleIds.length === 0) {
      return { success: false, error: "Please select at least one vehicle." };
    }

    for (const vehicleId of vehicleIds) {
      await dbService.createMaintenanceJob({
        type,
        workshop,
        cost,
        date,
        notes: notes || null,
        companyId,
        vehicleId,
      });
    }

    revalidatePath("/vehicles");
    revalidatePath("/");

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to log bulk maintenance." };
  }
}
