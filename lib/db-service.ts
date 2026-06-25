import { prisma } from "./db";
import fs from "fs";
import path from "path";

// Check if PostgreSQL database URL is configured
export const isPrismaEnabled = () => {
  return typeof process !== "undefined" && !!process.env.DATABASE_URL;
};

// In-Memory/JSON database structure for fallback mode
interface FallbackData {
  users: any[];
  drivers: any[];
  vehicles: any[];
  shifts: any[];
  batches: any[];
  rewardCodes: any[];
  redemptions: any[];
}

const DB_FILE = path.join(process.cwd(), "rydex_db_fallback.json");

const SEEDED_NAMES = [
  "Musa Dahiru",
  "Aisha Umar",
  "Ibrahim Hassan",
  "Fatima Bala",
  "Sani Garba",
  "Amina Yusuf",
  "Bello Lawal",
  "Hauwa Aliyu",
  "Yusuf Mohammed",
  "Zainab Sule",
];

const getInitialData = (): FallbackData => {
  const driversList = SEEDED_NAMES.map((name, i) => ({
    id: `drv-${i + 1}`,
    name,
    phone: `+234 80${i} 555 0${100 + i}`,
    address: `Ward ${i + 1}, Katsina`,
    guarantorName: `Guarantor ${i + 1}`,
    guarantorPhone: `+234 80${i} 555 1${100 + i}`,
    status: i < 8 ? "active" : "off-duty",
    avgPerDay: 9500 + i * 320,
    avgPerHour: 1100 + i * 25,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }));

  const vehiclesList = Array.from({ length: 10 }, (_, i) => ({
    id: `ryd-kt-${String(i + 1).padStart(3, "0")}`,
    vehicleNumber: `KT-${String(i + 1).padStart(3, "0")}`,
    vehicleType: "Keke Napep",
    fuelType: "CNG",
    plateNumber: `KAT-${100 + i}-XA`,
    status: i === 7 ? "MAINTENANCE" : i === 9 ? "OFFLINE" : "ACTIVE",
    assignedDriverId: i < 8 ? `drv-${i + 1}` : null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }));

  const usersList = [
    {
      id: "u-admin",
      name: "Aminu Okafor",
      phone: "08012345678",
      password: "password", // plain for demo simplicity, in Prisma we use hashing
      role: "SUPER_ADMIN",
      points: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "u-officer",
      name: "Katsina Officer",
      phone: "08022222222",
      password: "password",
      role: "OPERATIONS_OFFICER",
      points: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "u-passenger1",
      name: "Ibrahim Bakare",
      phone: "08033333333",
      password: "password",
      role: "PASSENGER",
      points: 120,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  const shiftsList = [
    {
      id: "s-1",
      vehicleId: "ryd-kt-001",
      driverId: "drv-1",
      startTime: new Date(Date.now() - 6.5 * 3600 * 1000).toISOString(),
      endTime: null,
      startOdometer: 12450.2,
      endOdometer: null,
      revenue: 12450,
      status: "ACTIVE",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "s-2",
      vehicleId: "ryd-kt-002",
      driverId: "drv-2",
      startTime: new Date(Date.now() - 6.4 * 3600 * 1000).toISOString(),
      endTime: null,
      startOdometer: 9821.7,
      endOdometer: null,
      revenue: 11200,
      status: "ACTIVE",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "s-7",
      vehicleId: "ryd-kt-007",
      driverId: "drv-7",
      startTime: new Date(Date.now() - 5.8 * 3600 * 1000).toISOString(),
      endTime: null,
      startOdometer: 17891.3,
      endOdometer: null,
      revenue: 3900,
      status: "LOW_PERF",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  const batchesList = [
    {
      id: "b-1",
      batchNumber: "BAT-001",
      codeCount: 5,
      vehicleId: "ryd-kt-001",
      driverId: "drv-1",
      dateGenerated: new Date().toISOString(),
    },
  ];

  const rewardCodesList = [
    { id: "c-1", code: "RYD-7K4P9M", status: "UNUSED", batchId: "b-1", vehicleId: "ryd-kt-001", driverId: "drv-1", dateGenerated: new Date().toISOString() },
    { id: "c-2", code: "RYD-B2X8QF", status: "UNUSED", batchId: "b-1", vehicleId: "ryd-kt-001", driverId: "drv-1", dateGenerated: new Date().toISOString() },
    { id: "c-3", code: "RYD-X9L2TN", status: "UNUSED", batchId: "b-1", vehicleId: "ryd-kt-001", driverId: "drv-1", dateGenerated: new Date().toISOString() },
    { id: "c-4", code: "RYD-4W1P7K", status: "UNUSED", batchId: "b-1", vehicleId: "ryd-kt-001", driverId: "drv-1", dateGenerated: new Date().toISOString() },
    { id: "c-5", code: "RYD-L8T2N5", status: "UNUSED", batchId: "b-1", vehicleId: "ryd-kt-001", driverId: "drv-1", dateGenerated: new Date().toISOString() },
  ];

  const redemptionsList = [
    { id: "r-1", passengerId: "u-passenger1", rewardRequested: "₦100 Airtime", pointsUsed: 100, status: "PENDING_APPROVAL", requestedAt: new Date(Date.now() - 3600 * 1000).toISOString() },
  ];

  return {
    users: usersList,
    drivers: driversList,
    vehicles: vehiclesList,
    shifts: shiftsList,
    batches: batchesList,
    rewardCodes: rewardCodesList,
    redemptions: redemptionsList,
  };
};

const loadFallbackData = (): FallbackData => {
  if (fs.existsSync(DB_FILE)) {
    try {
      const content = fs.readFileSync(DB_FILE, "utf-8");
      return JSON.parse(content);
    } catch (e) {
      console.error("Error reading fallback DB file, re-creating", e);
    }
  }
  const data = getInitialData();
  saveFallbackData(data);
  return data;
};

const saveFallbackData = (data: FallbackData) => {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (e) {
    console.error("Error writing fallback DB file", e);
  }
};

export const dbService = {
  // Users
  async getUsers() {
    if (isPrismaEnabled()) {
      return await prisma.user.findMany({ orderBy: { createdAt: "desc" } });
    }
    return loadFallbackData().users;
  },

  async getUserByPhone(phone: string) {
    if (isPrismaEnabled()) {
      return await prisma.user.findUnique({ where: { phone } });
    }
    return loadFallbackData().users.find((u) => u.phone === phone) || null;
  },

  async createUser(data: { name: string; phone: string; password: string; role?: string }) {
    if (isPrismaEnabled()) {
      return await prisma.user.create({
        data: {
          name: data.name,
          phone: data.phone,
          password: data.password,
          role: (data.role || "PASSENGER") as any,
          points: 0,
        },
      });
    }
    const store = loadFallbackData();
    const newUser = {
      id: `u-${Date.now()}`,
      name: data.name,
      phone: data.phone,
      password: data.password,
      role: data.role || "PASSENGER",
      points: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    store.users.push(newUser);
    saveFallbackData(store);
    return newUser;
  },

  async updateUserPoints(userId: string, newPoints: number) {
    if (isPrismaEnabled()) {
      return await prisma.user.update({
        where: { id: userId },
        data: { points: newPoints },
      });
    }
    const store = loadFallbackData();
    const user = store.users.find((u) => u.id === userId);
    if (user) {
      user.points = newPoints;
      saveFallbackData(store);
    }
    return user;
  },

  // Vehicles
  async getVehicles() {
    if (isPrismaEnabled()) {
      return await prisma.vehicle.findMany({
        include: { assignedDriver: true },
        orderBy: { vehicleNumber: "asc" },
      });
    }
    const store = loadFallbackData();
    return store.vehicles.map((v) => ({
      ...v,
      assignedDriver: store.drivers.find((d) => d.id === v.assignedDriverId) || null,
    }));
  },

  async getVehicleById(id: string) {
    if (isPrismaEnabled()) {
      return await prisma.vehicle.findUnique({
        where: { id },
        include: { assignedDriver: true, shifts: { orderBy: { startTime: "desc" } } },
      });
    }
    const store = loadFallbackData();
    const vehicle = store.vehicles.find((v) => v.id === id);
    if (!vehicle) return null;
    return {
      ...vehicle,
      assignedDriver: store.drivers.find((d) => d.id === vehicle.assignedDriverId) || null,
      shifts: store.shifts.filter((s) => s.vehicleId === id).sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()),
    };
  },

  // Drivers
  async getDrivers() {
    if (isPrismaEnabled()) {
      return await prisma.driver.findMany({
        include: { assignedVehicle: true },
        orderBy: { name: "asc" },
      });
    }
    const store = loadFallbackData();
    return store.drivers.map((d) => ({
      ...d,
      assignedVehicle: store.vehicles.find((v) => v.assignedDriverId === d.id) || null,
    }));
  },

  async getDriverById(id: string) {
    if (isPrismaEnabled()) {
      return await prisma.driver.findUnique({
        where: { id },
        include: { assignedVehicle: true, shifts: { orderBy: { startTime: "desc" } } },
      });
    }
    const store = loadFallbackData();
    const driver = store.drivers.find((d) => d.id === id);
    if (!driver) return null;
    return {
      ...driver,
      assignedVehicle: store.vehicles.find((v) => v.assignedDriverId === id) || null,
      shifts: store.shifts.filter((s) => s.driverId === id).sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()),
    };
  },

  // Shifts
  async getActiveShifts() {
    if (isPrismaEnabled()) {
      return await prisma.shift.findMany({
        where: { status: { in: ["ACTIVE", "LOW_PERF"] } },
        include: { vehicle: true, driver: true },
        orderBy: { startTime: "desc" },
      });
    }
    const store = loadFallbackData();
    const active = store.shifts.filter((s) => s.status === "ACTIVE" || s.status === "LOW_PERF");
    return active.map((s) => ({
      ...s,
      vehicle: store.vehicles.find((v) => v.id === s.vehicleId) || null,
      driver: store.drivers.find((d) => d.id === s.driverId) || null,
    }));
  },

  async getShiftsHistory() {
    if (isPrismaEnabled()) {
      return await prisma.shift.findMany({
        include: { vehicle: true, driver: true },
        orderBy: { startTime: "desc" },
      });
    }
    const store = loadFallbackData();
    return store.shifts.map((s) => ({
      ...s,
      vehicle: store.vehicles.find((v) => v.id === s.vehicleId) || null,
      driver: store.drivers.find((d) => d.id === s.driverId) || null,
    }));
  },

  async startShift(vehicleId: string, driverId: string, startOdo: number) {
    if (isPrismaEnabled()) {
      return await prisma.shift.create({
        data: {
          vehicleId,
          driverId,
          startOdometer: startOdo,
          status: "ACTIVE",
          startTime: new Date(),
        },
      });
    }
    const store = loadFallbackData();
    // Update vehicle and driver status
    const vehicle = store.vehicles.find((v) => v.id === vehicleId);
    if (vehicle) vehicle.status = "ACTIVE";
    const driver = store.drivers.find((d) => d.id === driverId);
    if (driver) driver.status = "active";

    const newShift = {
      id: `s-${Date.now()}`,
      vehicleId,
      driverId,
      startTime: new Date().toISOString(),
      endTime: null,
      startOdometer: startOdo,
      endOdometer: null,
      revenue: 0,
      status: "ACTIVE",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    store.shifts.push(newShift);
    saveFallbackData(store);
    return newShift;
  },

  async endShift(shiftId: string, endOdo: number, revenue: number) {
    const endTime = new Date();
    if (isPrismaEnabled()) {
      const shift = await prisma.shift.findUnique({ where: { id: shiftId } });
      if (!shift) throw new Error("Shift not found");

      const hours = Math.max(0.1, (endTime.getTime() - shift.startTime.getTime()) / (1000 * 60 * 60));
      const distance = Math.max(0.1, endOdo - shift.startOdometer);
      const revPerHour = revenue / hours;
      const revPerKm = revenue / distance;
      
      // Flags low performance anomaly: if revenue is less than 5000 and fleet average is usually higher, or just flag if performance is extremely low compared to hours
      let status: any = "ENDED";
      if (revenue < 5000 && hours > 4) {
        status = "FLAGGED";
      }

      return await prisma.shift.update({
        where: { id: shiftId },
        data: {
          endTime,
          endOdometer: endOdo,
          revenue,
          hoursWorked: Math.floor(hours),
          minutesWorked: Math.floor((hours % 1) * 60),
          distanceCovered: distance,
          revenuePerHour: revPerHour,
          revenuePerKm: revPerKm,
          status,
        },
      });
    }

    const store = loadFallbackData();
    const shiftIndex = store.shifts.findIndex((s) => s.id === shiftId);
    if (shiftIndex === -1) throw new Error("Shift not found");
    const shift = store.shifts[shiftIndex];

    const start = new Date(shift.startTime);
    const hours = Math.max(0.1, (endTime.getTime() - start.getTime()) / (1000 * 60 * 60));
    const distance = Math.max(0.1, endOdo - shift.startOdometer);
    const revPerHour = revenue / hours;
    const revPerKm = revenue / distance;

    let status = "ENDED";
    if (revenue < 5000 && hours > 4) {
      status = "FLAGGED";
    }

    const updated = {
      ...shift,
      endTime: endTime.toISOString(),
      endOdometer: endOdo,
      revenue,
      hoursWorked: Math.floor(hours),
      minutesWorked: Math.floor((hours % 1) * 60),
      distanceCovered: parseFloat(distance.toFixed(1)),
      revenuePerHour: Math.round(revPerHour),
      revenuePerKm: Math.round(revPerKm),
      status,
      updatedAt: endTime.toISOString(),
    };

    store.shifts[shiftIndex] = updated;
    saveFallbackData(store);
    return updated;
  },

  // Code Batches
  async getBatches() {
    if (isPrismaEnabled()) {
      return await prisma.codeBatch.findMany({
        include: { vehicle: true, driver: true, codes: true },
        orderBy: { dateGenerated: "desc" },
      });
    }
    const store = loadFallbackData();
    return store.batches.map((b) => ({
      ...b,
      vehicle: store.vehicles.find((v) => v.id === b.vehicleId) || null,
      driver: store.drivers.find((d) => d.id === b.driverId) || null,
      codes: store.rewardCodes.filter((c) => c.batchId === b.id),
    }));
  },

  async generateBatch(vehicleId: string, driverId: string, count: number) {
    const batchNumber = `BAT-${String(Date.now()).slice(-6)}`;
    const dateGenerated = new Date();

    // Helper to generate a random unique single-use code: RYD-[6 characters alphanumeric]
    const generateCode = () => {
      const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // No easy-to-confuse characters (like O, 0, I, 1)
      let result = "";
      for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return `RYD-${result}`;
    };

    if (isPrismaEnabled()) {
      const batch = await prisma.codeBatch.create({
        data: {
          batchNumber,
          codeCount: count,
          vehicleId,
          driverId,
          dateGenerated,
        },
      });

      const codesData = Array.from({ length: count }, () => ({
        code: generateCode(),
        status: "UNUSED" as any,
        batchId: batch.id,
        vehicleId,
        driverId,
        dateGenerated,
      }));

      await prisma.rewardCode.createMany({
        data: codesData,
      });

      return batch;
    }

    const store = loadFallbackData();
    const batchId = `b-${Date.now()}`;
    const newBatch = {
      id: batchId,
      batchNumber,
      codeCount: count,
      vehicleId,
      driverId,
      dateGenerated: dateGenerated.toISOString(),
    };

    const newCodes = Array.from({ length: count }, (_, i) => ({
      id: `c-${Date.now()}-${i}`,
      code: generateCode(),
      status: "UNUSED",
      batchId,
      vehicleId,
      driverId,
      dateGenerated: dateGenerated.toISOString(),
    }));

    store.batches.push(newBatch);
    store.rewardCodes.push(...newCodes);
    saveFallbackData(store);
    return newBatch;
  },

  // Reward Codes & Redemptions
  async getRewardCodes() {
    if (isPrismaEnabled()) {
      return await prisma.rewardCode.findMany({ orderBy: { dateGenerated: "desc" } });
    }
    return loadFallbackData().rewardCodes;
  },

  async redeemCode(codeString: string, passengerId: string) {
    const formattedCode = codeString.toUpperCase().trim();
    if (isPrismaEnabled()) {
      const code = await prisma.rewardCode.findUnique({ where: { code: formattedCode } });
      if (!code) throw new Error("Invalid reward code");
      if (code.status !== "UNUSED") throw new Error("Code has already been redeemed or expired");

      // Update code
      await prisma.rewardCode.update({
        where: { id: code.id },
        data: {
          status: "REDEEMED",
          redeemedDate: new Date(),
          redeemedById: passengerId,
        },
      });

      // Update user points
      const user = await prisma.user.findUnique({ where: { id: passengerId } });
      if (user) {
        await prisma.user.update({
          where: { id: passengerId },
          data: { points: user.points + 10 },
        });
      }

      return code;
    }

    const store = loadFallbackData();
    const codeIndex = store.rewardCodes.findIndex((c) => c.code === formattedCode);
    if (codeIndex === -1) throw new Error("Invalid reward code");
    
    const code = store.rewardCodes[codeIndex];
    if (code.status !== "UNUSED") throw new Error("Code has already been redeemed or expired");

    code.status = "REDEEMED";
    code.redeemedDate = new Date().toISOString();
    code.redeemedById = passengerId;

    const user = store.users.find((u) => u.id === passengerId);
    if (user) {
      user.points = (user.points || 0) + 10;
    }

    saveFallbackData(store);
    return code;
  },

  async getRedemptions() {
    if (isPrismaEnabled()) {
      return await prisma.redemptionRequest.findMany({
        include: { passenger: true },
        orderBy: { requestedAt: "desc" },
      });
    }
    const store = loadFallbackData();
    return store.redemptions.map((r) => ({
      ...r,
      passenger: store.users.find((u) => u.id === r.passengerId) || null,
    }));
  },

  async createRedemptionRequest(passengerId: string, rewardRequested: string, pointsUsed: number) {
    if (isPrismaEnabled()) {
      const user = await prisma.user.findUnique({ where: { id: passengerId } });
      if (!user || user.points < pointsUsed) throw new Error("Insufficient points");

      // Deduct points
      await prisma.user.update({
        where: { id: passengerId },
        data: { points: user.points - pointsUsed },
      });

      return await prisma.redemptionRequest.create({
        data: {
          passengerId,
          rewardRequested,
          pointsUsed,
          status: "PENDING_APPROVAL",
        },
      });
    }

    const store = loadFallbackData();
    const user = store.users.find((u) => u.id === passengerId);
    if (!user || user.points < pointsUsed) throw new Error("Insufficient points");

    user.points -= pointsUsed;

    const newRequest = {
      id: `r-${Date.now()}`,
      passengerId,
      rewardRequested,
      pointsUsed,
      status: "PENDING_APPROVAL",
      requestedAt: new Date().toISOString(),
      processedAt: null,
    };

    store.redemptions.push(newRequest);
    saveFallbackData(store);
    return newRequest;
  },

  async deliverReward(id: string) {
    if (isPrismaEnabled()) {
      return await prisma.redemptionRequest.update({
        where: { id },
        data: {
          status: "DELIVERED",
          processedAt: new Date(),
        },
      });
    }

    const store = loadFallbackData();
    const request = store.redemptions.find((r) => r.id === id);
    if (request) {
      request.status = "DELIVERED";
      request.processedAt = new Date().toISOString();
      saveFallbackData(store);
    }
    return request;
  },
};
