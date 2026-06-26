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

const DB_FILE = path.join(process.cwd(), "muva_db_fallback.json");

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
  const driversList = Array.from({ length: 10 }, (_, i) => ({
    id: `drv-${i + 1}`,
    name: SEEDED_NAMES[i],
    phone: `+234 80${i} 555 0${100 + i}`,
    address: `Ward ${i + 1}, Katsina`,
    guarantorName: `Guarantor ${i + 1}`,
    guarantorPhone: `+234 80${i} 555 1${100 + i}`,
    status: "active",
    avgPerDay: 9500 + i * 320,
    avgPerHour: 1100 + i * 25,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }));

  const vehiclesList = Array.from({ length: 10 }, (_, i) => {
    let ownerId = "u-owner1"; // Owner 1 owns 5 vehicles
    if (i >= 5 && i < 8) ownerId = "u-owner2"; // Owner 2 owns 3 vehicles
    if (i >= 8) ownerId = "u-owner3"; // Owner 3 owns 2 vehicles

    return {
      id: `muv-kt-${String(i + 1).padStart(3, "0")}`,
      vehicleNumber: `KT-${String(i + 1).padStart(3, "0")}`,
      vehicleType: i % 3 === 0 ? "Mini-Bus" : "Keke Napep",
      fuelType: i % 2 === 0 ? "CNG" : "EV",
      plateNumber: `KAT-${100 + i}-XA`,
      status: "ACTIVE",
      assignedDriverId: `drv-${i + 1}`,
      ownerId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  });

  const usersList = [
    {
      id: "u-admin",
      name: "Aminu Okafor",
      phone: "08012345678",
      email: "admin@muvamobility.com",
      status: "active",
      password: "Rydex123", // Keep password same for backward compatibility with user testing
      role: "SUPER_ADMIN",
      points: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "u-officer",
      name: "Katsina Officer",
      phone: "08022222222",
      email: "operations@muvamobility.com",
      status: "active",
      password: "Rydex123",
      role: "OPERATIONS_OFFICER",
      points: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "u-passenger1",
      name: "Passenger User",
      phone: "08033333333",
      email: "passenger@muvamobility.com",
      status: "active",
      password: "Rydex123",
      role: "PASSENGER",
      points: 150,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "u-owner1",
      name: "CityView Katsina",
      phone: "08044444444",
      email: "cityview@muvamobility.com",
      status: "active",
      password: "Rydex123",
      role: "VEHICLE_OWNER",
      points: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "u-owner2",
      name: "Aminu Transport",
      phone: "08055555555",
      email: "aminu@muvamobility.com",
      status: "active",
      password: "Rydex123",
      role: "VEHICLE_OWNER",
      points: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "u-owner3",
      name: "Northern Mobility Ventures",
      phone: "08066666666",
      email: "northern@muvamobility.com",
      status: "active",
      password: "Rydex123",
      role: "VEHICLE_OWNER",
      points: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  const shiftsList: any[] = [];
  const nowMs = Date.now();
  
  for (let i = 0; i < 45; i++) {
    const vehicleIdx = i % 10;
    const vehicleId = `muv-kt-${String(vehicleIdx + 1).padStart(3, "0")}`;
    const driverId = `drv-${vehicleIdx + 1}`;
    
    const dayOffset = Math.floor(i / 2) + 1; 
    const startTimeDate = new Date(nowMs - dayOffset * 24 * 3600 * 1000 - (i % 3) * 4 * 3600 * 1000);
    const durationHours = 5 + (i % 4) + Math.random();
    const endTimeDate = new Date(startTimeDate.getTime() + durationHours * 3600 * 1000);
    
    const distance = 80 + (i % 5) * 15 + Math.random() * 8;
    const revenue = 9000 + (i % 6) * 1600 + Math.floor(Math.random() * 1000);
    
    let status = "ENDED";
    if (i === 12 || i === 27) {
      status = "FLAGGED"; 
    } else if (i === 5 || i === 34) {
      status = "LOW_PERF";
    }

    shiftsList.push({
      id: `s-hist-${i + 1}`,
      vehicleId,
      driverId,
      startTime: startTimeDate.toISOString(),
      endTime: endTimeDate.toISOString(),
      startOdometer: 10000 + i * 150,
      endOdometer: 10000 + i * 150 + parseFloat(distance.toFixed(1)),
      revenue,
      hoursWorked: Math.floor(durationHours),
      minutesWorked: Math.floor((durationHours % 1) * 60),
      distanceCovered: parseFloat(distance.toFixed(1)),
      revenuePerHour: Math.round(revenue / durationHours),
      revenuePerKm: Math.round(revenue / distance),
      status,
      createdAt: startTimeDate.toISOString(),
      updatedAt: endTimeDate.toISOString(),
    });
  }

  shiftsList.push(
    {
      id: "s-active-1",
      vehicleId: "muv-kt-001",
      driverId: "drv-1",
      startTime: new Date(nowMs - 3.5 * 3600 * 1000).toISOString(),
      endTime: null,
      startOdometer: 12450.2,
      endOdometer: null,
      revenue: 0,
      status: "ACTIVE",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "s-active-2",
      vehicleId: "muv-kt-006",
      driverId: "drv-6",
      startTime: new Date(nowMs - 2 * 3600 * 1000).toISOString(),
      endTime: null,
      startOdometer: 9821.7,
      endOdometer: null,
      revenue: 0,
      status: "ACTIVE",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  );

  const batchesList = [
    {
      id: "b-1",
      batchNumber: "BAT-001",
      codeCount: 30,
      vehicleId: "muv-kt-001",
      driverId: "drv-1",
      dateGenerated: new Date(nowMs - 5 * 24 * 3600 * 1000).toISOString(),
      printCount: 0,
      printHistory: "[]",
    },
    {
      id: "b-2",
      batchNumber: "BAT-002",
      codeCount: 35,
      vehicleId: "muv-kt-006",
      driverId: "drv-6",
      dateGenerated: new Date(nowMs - 2 * 24 * 3600 * 1000).toISOString(),
      printCount: 0,
      printHistory: "[]",
    }
  ];

  const rewardCodesList: any[] = [];
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const makeCode = (idx: number) => {
    let result = "";
    for (let i = 0; i < 6; i++) {
      result += chars.charAt((idx * 7 + i * 13) % chars.length);
    }
    return `MUV-${result}`;
  };

  for (let i = 0; i < 30; i++) {
    const isRedeemed = i < 12;
    rewardCodesList.push({
      id: `c-b1-${i}`,
      code: makeCode(i + 100),
      status: isRedeemed ? "REDEEMED" : "UNUSED",
      batchId: "b-1",
      vehicleId: "muv-kt-001",
      driverId: "drv-1",
      dateGenerated: new Date(nowMs - 5 * 24 * 3600 * 1000).toISOString(),
      redeemedDate: isRedeemed ? new Date(nowMs - (i % 4) * 24 * 3600 * 1000).toISOString() : null,
      redeemedById: isRedeemed ? "u-passenger1" : null,
    });
  }

  for (let i = 0; i < 35; i++) {
    const isRedeemed = i < 13;
    rewardCodesList.push({
      id: `c-b2-${i}`,
      code: makeCode(i + 200),
      status: isRedeemed ? "REDEEMED" : "UNUSED",
      batchId: "b-2",
      vehicleId: "muv-kt-006",
      driverId: "drv-6",
      dateGenerated: new Date(nowMs - 2 * 24 * 3600 * 1000).toISOString(),
      redeemedDate: isRedeemed ? new Date(nowMs - (i % 3) * 24 * 3600 * 1000).toISOString() : null,
      redeemedById: isRedeemed ? "u-passenger1" : null,
    });
  }

  const redemptionsList = [
    { id: "r-1", passengerId: "u-passenger1", rewardRequested: "₦100 Airtime", pointsUsed: 100, status: "DELIVERED", requestedAt: new Date(nowMs - 4 * 3600 * 1000).toISOString(), processedAt: new Date(nowMs - 3.5 * 3600 * 1000).toISOString() },
    { id: "r-2", passengerId: "u-passenger1", rewardRequested: "500MB Data", pointsUsed: 300, status: "PENDING_APPROVAL", requestedAt: new Date(nowMs - 1 * 3600 * 1000).toISOString(), processedAt: null },
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
  // Seeding check to verify PostgreSQL contains initial data
  async ensureSeeded() {
    if (!isPrismaEnabled()) return;
    try {
      const count = await prisma.user.count();
      if (count > 0) return; // Already seeded

      console.log("[Seeding] PostgreSQL database is empty. Auto-seeding MUVA data...");
      const data = getInitialData();

      // Seed Users
      for (const u of data.users) {
        await prisma.user.create({
          data: {
            id: u.id,
            name: u.name,
            phone: u.phone,
            email: u.email,
            status: u.status,
            password: u.password,
            role: u.role,
            points: u.points,
            createdAt: new Date(u.createdAt),
            updatedAt: new Date(u.updatedAt),
          },
        });
      }

      // Seed Drivers
      for (const d of data.drivers) {
        await prisma.driver.create({
          data: {
            id: d.id,
            name: d.name,
            phone: d.phone,
            address: d.address,
            guarantorName: d.guarantorName,
            guarantorPhone: d.guarantorPhone,
            status: d.status,
            createdAt: new Date(d.createdAt),
            updatedAt: new Date(d.updatedAt),
          },
        });
      }

      // Seed Vehicles
      for (const v of data.vehicles) {
        await prisma.vehicle.create({
          data: {
            id: v.id,
            vehicleNumber: v.vehicleNumber,
            vehicleType: v.vehicleType,
            fuelType: v.fuelType,
            plateNumber: v.plateNumber,
            status: v.status,
            assignedDriverId: v.assignedDriverId,
            ownerId: v.ownerId,
            createdAt: new Date(v.createdAt),
            updatedAt: new Date(v.updatedAt),
          },
        });
      }

      // Seed Shifts
      for (const s of data.shifts) {
        await prisma.shift.create({
          data: {
            id: s.id,
            vehicleId: s.vehicleId,
            driverId: s.driverId,
            startTime: new Date(s.startTime),
            endTime: s.endTime ? new Date(s.endTime) : null,
            startOdometer: s.startOdometer,
            endOdometer: s.endOdometer,
            revenue: s.revenue,
            hoursWorked: s.hoursWorked,
            minutesWorked: s.minutesWorked,
            distanceCovered: s.distanceCovered,
            revenuePerHour: s.revenuePerHour,
            revenuePerKm: s.revenuePerKm,
            status: s.status,
            createdAt: new Date(s.createdAt),
            updatedAt: new Date(s.updatedAt),
          },
        });
      }

      // Seed Batches
      for (const b of data.batches) {
        await prisma.codeBatch.create({
          data: {
            id: b.id,
            batchNumber: b.batchNumber,
            codeCount: b.codeCount,
            vehicleId: b.vehicleId,
            driverId: b.driverId,
            dateGenerated: new Date(b.dateGenerated),
            printCount: b.printCount || 0,
            printHistory: b.printHistory || "[]",
          },
        });
      }

      // Seed Reward Codes
      for (const c of data.rewardCodes) {
        await prisma.rewardCode.create({
          data: {
            id: c.id,
            code: c.code,
            status: c.status,
            batchId: c.batchId,
            vehicleId: c.vehicleId,
            driverId: c.driverId,
            dateGenerated: new Date(c.dateGenerated),
            redeemedDate: c.redeemedDate ? new Date(c.redeemedDate) : null,
            redeemedById: c.redeemedById,
          },
        });
      }

      // Seed Redemptions
      for (const r of data.redemptions) {
        await prisma.redemptionRequest.create({
          data: {
            id: r.id,
            passengerId: r.passengerId,
            rewardRequested: r.rewardRequested,
            pointsUsed: r.pointsUsed,
            status: r.status,
            requestedAt: new Date(r.requestedAt),
            processedAt: r.processedAt ? new Date(r.processedAt) : null,
          },
        });
      }

      console.log("[Seeding] PostgreSQL database seeded successfully!");
    } catch (err) {
      console.error("[Seeding] Failed to auto-seed PostgreSQL:", err);
    }
  },

  // Users
  async getUsers() {
    await this.ensureSeeded();
    if (isPrismaEnabled()) {
      return await prisma.user.findMany({ orderBy: { createdAt: "desc" } });
    }
    return loadFallbackData().users;
  },

  async getUserByPhone(phone: string) {
    await this.ensureSeeded();
    if (isPrismaEnabled()) {
      return await prisma.user.findUnique({ where: { phone } });
    }
    return loadFallbackData().users.find((u) => u.phone === phone) || null;
  },

  async getUserByPhoneOrEmail(identifier: string) {
    await this.ensureSeeded();
    const cleanId = identifier.trim().toLowerCase();
    if (isPrismaEnabled()) {
      return await prisma.user.findFirst({
        where: {
          OR: [
            { phone: identifier },
            { email: cleanId }
          ]
        }
      });
    }
    return loadFallbackData().users.find((u) => 
      u.phone === identifier || 
      (u.email && u.email.toLowerCase() === cleanId)
    ) || null;
  },

  async updateUser(id: string, data: { name?: string; phone?: string; email?: string; status?: string; role?: string }) {
    if (isPrismaEnabled()) {
      return await prisma.user.update({
        where: { id },
        data: {
          ...data,
          role: data.role as any
        }
      });
    }
    const store = loadFallbackData();
    const idx = store.users.findIndex((u) => u.id === id);
    if (idx === -1) throw new Error("User not found");
    const updated = {
      ...store.users[idx],
      ...data,
      updatedAt: new Date().toISOString()
    };
    store.users[idx] = updated;
    saveFallbackData(store);
    return updated;
  },

  async suspendUser(id: string) {
    return await this.updateUser(id, { status: "suspended" });
  },

  async unsuspendUser(id: string) {
    return await this.updateUser(id, { status: "active" });
  },

  async createUser(data: { name: string; phone: string; email?: string; status?: string; password: string; role?: string }) {
    if (isPrismaEnabled()) {
      return await prisma.user.create({
        data: {
          name: data.name,
          phone: data.phone,
          email: data.email || null,
          status: data.status || "active",
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
      email: data.email || null,
      status: data.status || "active",
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
  async getVehicles(ownerId?: string) {
    await this.ensureSeeded();
    if (isPrismaEnabled()) {
      const whereClause = ownerId ? { ownerId } : {};
      return await prisma.vehicle.findMany({
        where: whereClause,
        include: { assignedDriver: true, owner: true },
        orderBy: { vehicleNumber: "asc" },
      });
    }
    const store = loadFallbackData();
    let list = store.vehicles;
    if (ownerId) {
      list = list.filter((v) => v.ownerId === ownerId);
    }
    return list.map((v) => ({
      ...v,
      assignedDriver: store.drivers.find((d) => d.id === v.assignedDriverId) || null,
      owner: store.users.find((u) => u.id === v.ownerId) || null,
    }));
  },

  async getVehicleById(id: string) {
    await this.ensureSeeded();
    if (isPrismaEnabled()) {
      return await prisma.vehicle.findUnique({
        where: { id },
        include: { assignedDriver: true, owner: true, shifts: { orderBy: { startTime: "desc" } } },
      });
    }
    const store = loadFallbackData();
    const vehicle = store.vehicles.find((v) => v.id === id);
    if (!vehicle) return null;
    return {
      ...vehicle,
      assignedDriver: store.drivers.find((d) => d.id === vehicle.assignedDriverId) || null,
      owner: store.users.find((u) => u.id === vehicle.ownerId) || null,
      shifts: store.shifts.filter((s) => s.vehicleId === id).sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()),
    };
  },

  async createVehicle(data: {
    id: string;
    vehicleNumber: string;
    plateNumber: string;
    vehicleType: string;
    fuelType: string;
    ownerId?: string;
    assignedDriverId?: string;
    status?: string;
  }) {
    if (isPrismaEnabled()) {
      return await prisma.vehicle.create({
        data: {
          id: data.id,
          vehicleNumber: data.vehicleNumber,
          plateNumber: data.plateNumber,
          vehicleType: data.vehicleType,
          fuelType: data.fuelType,
          ownerId: data.ownerId || null,
          assignedDriverId: data.assignedDriverId || null,
          status: (data.status || "ACTIVE") as any,
        },
      });
    }
    const store = loadFallbackData();
    const newVehicle = {
      id: data.id.toLowerCase(),
      vehicleNumber: data.vehicleNumber,
      plateNumber: data.plateNumber,
      vehicleType: data.vehicleType,
      fuelType: data.fuelType,
      ownerId: data.ownerId || null,
      assignedDriverId: data.assignedDriverId || null,
      status: data.status || "ACTIVE",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    store.vehicles.push(newVehicle);
    saveFallbackData(store);
    return newVehicle;
  },

  async updateVehicle(id: string, data: {
    vehicleNumber?: string;
    plateNumber?: string;
    vehicleType?: string;
    fuelType?: string;
    ownerId?: string;
    assignedDriverId?: string;
    status?: string;
  }) {
    if (isPrismaEnabled()) {
      return await prisma.vehicle.update({
        where: { id },
        data: {
          ...data,
          status: data.status as any,
        },
      });
    }
    const store = loadFallbackData();
    const index = store.vehicles.findIndex((v) => v.id === id);
    if (index === -1) throw new Error("Vehicle not found");
    const updated = {
      ...store.vehicles[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };
    store.vehicles[index] = updated;
    saveFallbackData(store);
    return updated;
  },

  async disableVehicle(id: string) {
    return await this.updateVehicle(id, { status: "OFFLINE" });
  },

  // Drivers
  async getDrivers() {
    await this.ensureSeeded();
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
    await this.ensureSeeded();
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

  async createDriver(data: {
    name: string;
    phone: string;
    address: string;
    guarantorName: string;
    guarantorPhone: string;
    status?: string;
  }) {
    if (isPrismaEnabled()) {
      return await prisma.driver.create({
        data: {
          ...data,
          status: data.status || "active",
        },
      });
    }
    const store = loadFallbackData();
    const newDriver = {
      id: `drv-${Date.now()}`,
      name: data.name,
      phone: data.phone,
      address: data.address,
      guarantorName: data.guarantorName,
      guarantorPhone: data.guarantorPhone,
      status: data.status || "active",
      avgPerDay: 8500,
      avgPerHour: 1000,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    store.drivers.push(newDriver);
    saveFallbackData(store);
    return newDriver;
  },

  async updateDriver(id: string, data: {
    name?: string;
    phone?: string;
    address?: string;
    guarantorName?: string;
    guarantorPhone?: string;
    status?: string;
  }) {
    if (isPrismaEnabled()) {
      return await prisma.driver.update({
        where: { id },
        data,
      });
    }
    const store = loadFallbackData();
    const index = store.drivers.findIndex((d) => d.id === id);
    if (index === -1) throw new Error("Driver not found");
    const updated = {
      ...store.drivers[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };
    store.drivers[index] = updated;
    saveFallbackData(store);
    return updated;
  },

  async suspendDriver(id: string) {
    return await this.updateDriver(id, { status: "suspended" });
  },

  // Shifts
  async getActiveShifts() {
    await this.ensureSeeded();
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

  async getShiftsHistory(ownerId?: string) {
    await this.ensureSeeded();
    if (isPrismaEnabled()) {
      const filter = ownerId ? { vehicle: { ownerId } } : {};
      return await prisma.shift.findMany({
        where: filter,
        include: { vehicle: true, driver: true },
        orderBy: { startTime: "desc" },
      });
    }
    const store = loadFallbackData();
    let list = store.shifts;
    if (ownerId) {
      const ownedIds = store.vehicles.filter((v) => v.ownerId === ownerId).map((v) => v.id);
      list = list.filter((s) => ownedIds.includes(s.vehicleId));
    }
    return list.map((s) => ({
      ...s,
      vehicle: store.vehicles.find((v) => v.id === s.vehicleId) || null,
      driver: store.drivers.find((d) => d.id === s.driverId) || null,
    }));
  },

  async startShift(vehicleId: string, driverId: string, startOdo: number) {
    if (isPrismaEnabled()) {
      // Update vehicle status to ACTIVE
      await prisma.vehicle.update({
        where: { id: vehicleId },
        data: { status: "ACTIVE" },
      });
      // Update driver status to active
      await prisma.driver.update({
        where: { id: driverId },
        data: { status: "active" },
      });

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
      
      let status: any = "ENDED";
      if (revenue < 5000 && hours > 4) {
        status = "FLAGGED";
      }

      await prisma.vehicle.update({
        where: { id: shift.vehicleId },
        data: { status: "ACTIVE" },
      });
      await prisma.driver.update({
        where: { id: shift.driverId },
        data: { status: "active" },
      });

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

    const vehicle = store.vehicles.find((v) => v.id === shift.vehicleId);
    if (vehicle) vehicle.status = "ACTIVE";
    const driver = store.drivers.find((d) => d.id === shift.driverId);
    if (driver) driver.status = "active";

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
    await this.ensureSeeded();
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

    const generateCode = () => {
      const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
      let result = "";
      for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return `MUV-${result}`;
    };

    if (isPrismaEnabled()) {
      const batch = await prisma.codeBatch.create({
        data: {
          batchNumber,
          codeCount: count,
          vehicleId,
          driverId,
          dateGenerated,
          printCount: 0,
          printHistory: "[]",
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
      printCount: 0,
      printHistory: "[]",
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
    await this.ensureSeeded();
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

      await prisma.rewardCode.update({
        where: { id: code.id },
        data: {
          status: "REDEEMED",
          redeemedDate: new Date(),
          redeemedById: passengerId,
        },
      });

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
    await this.ensureSeeded();
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
        include: { passenger: true },
        data: {
          status: "DELIVERED",
          processedAt: new Date(),
        },
      });
    }

    const store = loadFallbackData();
    const requestIndex = store.redemptions.findIndex((r) => r.id === id);
    if (requestIndex !== -1) {
      const request = store.redemptions[requestIndex];
      request.status = "DELIVERED";
      request.processedAt = new Date().toISOString();
      saveFallbackData(store);
      
      return {
        ...request,
        passenger: store.users.find((u) => u.id === request.passengerId) || null,
      };
    }
    return null;
  },

  async recordBatchPrint(batchId: string, userName: string) {
    const now = new Date();
    if (isPrismaEnabled()) {
      const batch = await prisma.codeBatch.findUnique({ where: { id: batchId } });
      if (!batch) throw new Error("Batch not found");
      const currentCount = batch.printCount || 0;
      if (currentCount >= 3) {
        throw new Error("Maximum print limit (3) reached for this batch.");
      }
      let historyList: any[] = [];
      try {
        historyList = JSON.parse(batch.printHistory || "[]");
      } catch (e) {
        historyList = [];
      }
      historyList.push({
        date: now.toLocaleDateString(),
        time: now.toLocaleTimeString(),
        user: userName,
        printNumber: currentCount + 1,
      });
      return await prisma.codeBatch.update({
        where: { id: batchId },
        data: {
          printCount: currentCount + 1,
          printHistory: JSON.stringify(historyList),
        },
      });
    }

    const store = loadFallbackData();
    const idx = store.batches.findIndex((b) => b.id === batchId);
    if (idx === -1) throw new Error("Batch not found");
    const batch = store.batches[idx];
    const currentCount = batch.printCount || 0;
    if (currentCount >= 3) {
      throw new Error("Maximum print limit (3) reached for this batch.");
    }
    let historyList: any[] = [];
    try {
      historyList = JSON.parse(batch.printHistory || "[]");
    } catch (e) {
      historyList = [];
    }
    historyList.push({
      date: now.toLocaleDateString(),
      time: now.toLocaleTimeString(),
      user: userName,
      printNumber: currentCount + 1,
    });
    batch.printCount = currentCount + 1;
    batch.printHistory = JSON.stringify(historyList);
    store.batches[idx] = batch;
    saveFallbackData(store);
    return batch;
  },

  async deleteBatch(batchId: string) {
    if (isPrismaEnabled()) {
      // First delete associated reward codes
      await prisma.rewardCode.deleteMany({ where: { batchId } });
      return await prisma.codeBatch.delete({ where: { id: batchId } });
    }

    const store = loadFallbackData();
    store.batches = store.batches.filter((b) => b.id !== batchId);
    store.rewardCodes = store.rewardCodes.filter((c) => c.batchId !== batchId);
    saveFallbackData(store);
    return true;
  },

  async recordDailyRevenue(vehicleId: string, driverId: string, revenue: number, dateStr: string, notes?: string) {
    const searchDate = new Date(dateStr);
    const startOfDay = new Date(searchDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(searchDate);
    endOfDay.setHours(23, 59, 59, 999);

    if (isPrismaEnabled()) {
      let shift = await prisma.shift.findFirst({
        where: {
          vehicleId,
          driverId,
          startTime: {
            gte: startOfDay,
            lte: endOfDay
          }
        },
        orderBy: { startTime: "desc" }
      });

      if (!shift) {
        shift = await prisma.shift.findFirst({
          where: { vehicleId, driverId },
          orderBy: { startTime: "desc" }
        });
      }

      if (shift) {
        return await prisma.shift.update({
          where: { id: shift.id },
          data: { revenue }
        });
      } else {
        return await prisma.shift.create({
          data: {
            vehicleId,
            driverId,
            startTime: startOfDay,
            endTime: endOfDay,
            startOdometer: 0,
            endOdometer: 0,
            revenue,
            status: "ENDED"
          }
        });
      }
    }

    const store = loadFallbackData();
    let shift = store.shifts.find((s) => {
      const d = new Date(s.startTime);
      return s.vehicleId === vehicleId && s.driverId === driverId && d >= startOfDay && d <= endOfDay;
    });

    if (!shift) {
      shift = [...store.shifts].reverse().find((s) => s.vehicleId === vehicleId && s.driverId === driverId);
    }

    if (shift) {
      shift.revenue = revenue;
      const idx = store.shifts.findIndex((s) => s.id === shift.id);
      store.shifts[idx] = shift;
    } else {
      const newShift = {
        id: `s-${Date.now()}`,
        vehicleId,
        driverId,
        startTime: startOfDay.toISOString(),
        endTime: endOfDay.toISOString(),
        startOdometer: 0,
        endOdometer: 0,
        revenue,
        hoursWorked: 8,
        minutesWorked: 0,
        distanceCovered: 50,
        status: "ENDED",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      store.shifts.push(newShift);
    }
    saveFallbackData(store);
    return true;
  },
};
