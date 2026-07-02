import { prisma } from "./db";
import fs from "fs";
import path from "path";

// Check if PostgreSQL database URL is configured
export const isPrismaEnabled = () => {
  return typeof process !== "undefined" && !!process.env.DATABASE_URL;
};

// In-Memory/JSON database structure for fallback mode
interface FallbackData {
  companies: any[];
  users: any[];
  drivers: any[];
  vehicles: any[];
  shifts: any[];
  contracts: any[];
  maintenances: any[];
}

import os from "os";

const getDbFilePath = (): string => {
  const originalPath = path.join(process.cwd(), "muva_db_fallback.json");
  const isServerless = process.env.VERCEL === "1" || process.env.NODE_ENV === "production" || originalPath.includes("/var/task");
  
  if (isServerless) {
    const tmpPath = path.join(os.tmpdir(), "muva_db_fallback.json");
    if (!fs.existsSync(tmpPath)) {
      try {
        if (fs.existsSync(originalPath)) {
          fs.copyFileSync(originalPath, tmpPath);
        }
      } catch (err) {
        console.error("Failed to copy bundled seed db to tmp:", err);
      }
    }
    return tmpPath;
  }
  
  return originalPath;
};

let DB_FILE = getDbFilePath();

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
  const nowMs = Date.now();

  // 1. Seed Companies
  const companiesList = [
    {
      id: "c-1",
      name: "CityView Katsina Ltd",
      logo: "/images/cityview-logo.png",
      phone: "08044444444",
      email: "cityview@muvamobility.com",
      address: "No. 12 Kazaure Road, Katsina",
      country: "Nigeria",
      state: "Katsina",
      fleetType: "CNG Tricycles",
      subscription: "PREMIUM",
      status: "ACTIVE",
      createdAt: new Date(nowMs - 30 * 24 * 3600 * 1000).toISOString(),
      updatedAt: new Date(nowMs - 30 * 24 * 3600 * 1000).toISOString(),
    },
    {
      id: "c-2",
      name: "Aminu Transport Services",
      logo: null,
      phone: "08055555555",
      email: "aminu@muvamobility.com",
      address: "Kano-Katsina Road Express, Katsina",
      country: "Nigeria",
      state: "Katsina",
      fleetType: "Mini-Buses",
      subscription: "BASIC",
      status: "ACTIVE",
      createdAt: new Date(nowMs - 20 * 24 * 3600 * 1000).toISOString(),
      updatedAt: new Date(nowMs - 20 * 24 * 3600 * 1000).toISOString(),
    },
    {
      id: "c-3",
      name: "Northern Logistics & Mobility",
      logo: null,
      phone: "08066666666",
      email: "northern@muvamobility.com",
      address: "Logistics Hub, Katsina Bypass",
      country: "Nigeria",
      state: "Katsina",
      fleetType: "EV Motorcycles",
      subscription: "TRIAL",
      status: "PENDING",
      createdAt: new Date(nowMs - 5 * 24 * 3600 * 1000).toISOString(),
      updatedAt: new Date(nowMs - 5 * 24 * 3600 * 1000).toISOString(),
    }
  ];

  // 2. Seed Users
  const usersList = [
    {
      id: "u-admin",
      name: "Aminu Okafor",
      phone: "08012345678",
      email: "admin@muvamobility.com",
      status: "active",
      password: "Rydex123",
      role: "SUPER_ADMIN",
      companyId: null,
      points: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "u-owner1",
      name: "CityView Owner",
      phone: "08044444444",
      email: "cityview@muvamobility.com",
      status: "active",
      password: "Rydex123",
      role: "COMPANY_OWNER",
      companyId: "c-1",
      points: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "u-officer1",
      name: "Katsina Officer",
      phone: "08022222222",
      email: "operations@muvamobility.com",
      status: "active",
      password: "Rydex123",
      role: "OPERATIONS_MANAGER",
      companyId: "c-1",
      points: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "u-owner2",
      name: "Aminu Owner",
      phone: "08055555555",
      email: "aminu@muvamobility.com",
      status: "active",
      password: "Rydex123",
      role: "COMPANY_OWNER",
      companyId: "c-2",
      points: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "u-officer2",
      name: "Aminu Officer",
      phone: "08077777777",
      email: "ops-aminu@muvamobility.com",
      status: "active",
      password: "Rydex123",
      role: "OPERATIONS_MANAGER",
      companyId: "c-2",
      points: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  ];

  // 3. Seed Drivers
  const driversList = Array.from({ length: 10 }, (_, i) => {
    const companyId = i < 7 ? "c-1" : "c-2";
    return {
      id: `drv-${i + 1}`,
      name: SEEDED_NAMES[i],
      phone: `080${i}5550${100 + i}`,
      address: `Ward ${i + 1}, Katsina`,
      guarantorName: `Guarantor ${i + 1}`,
      guarantorPhone: `080${i}5551${100 + i}`,
      status: "active",
      passport: `/images/drivers/drv-${i + 1}.png`,
      emergencyContact: "Emergency Guy • 08099999999",
      nextOfKin: "Next Kin • 08088888888",
      licenseNumber: `LIC-KT-${900000 + i}`,
      nationalId: `NIN-99882233${i}`,
      employmentDate: new Date(nowMs - 60 * 24 * 3600 * 1000).toISOString(),
      companyId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  });

  // 4. Seed Vehicles
  const vehiclesList = Array.from({ length: 10 }, (_, i) => {
    const companyId = i < 7 ? "c-1" : "c-2";
    let status = "AVAILABLE";
    if (i === 0 || i === 5) status = "ON_ROAD";
    if (i === 3 || i === 8) status = "MAINTENANCE";

    return {
      id: `muv-kt-${String(i + 1).padStart(3, "0")}`,
      vehicleNumber: `KT-${String(i + 1).padStart(3, "0")}`,
      registrationNumber: `REG-KT-${8000 + i}`,
      engineNumber: `ENG-ABC-${100000 + i}`,
      chassisNumber: `CHA-XYZ-${200000 + i}`,
      vehicleType: i % 3 === 0 ? "Mini-Bus" : "Keke Napep",
      fuelType: i % 2 === 0 ? "CNG" : "EV",
      plateNumber: `KAT-${100 + i}-XA`,
      status,
      purchaseDate: new Date(nowMs - 90 * 24 * 3600 * 1000).toISOString(),
      purchasePrice: i % 3 === 0 ? 6500000 : 4750000,
      assignedDriverId: `drv-${i + 1}`,
      companyId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  });

  // 5. Seed Hire Purchase Contracts
  const contractsList = Array.from({ length: 10 }, (_, i) => {
    const companyId = i < 7 ? "c-1" : "c-2";
    const targetAmount = i % 3 === 0 ? 6500000 : 4750000;
    const dailyTarget = i % 3 === 0 ? 18000 : 12000;
    
    // Simulate progression
    let totalPaid = dailyTarget * (15 + (i * 3));
    let status = "ACTIVE";
    if (i === 2) {
      totalPaid = targetAmount;
      status = "COMPLETED";
    } else if (i === 4) {
      status = "DEFAULTED";
    }

    return {
      id: `hp-con-${i + 1}`,
      startDate: new Date(nowMs - 30 * 24 * 3600 * 1000).toISOString(),
      targetAmount,
      dailyTarget,
      totalPaid,
      remainingBalance: Math.max(0, targetAmount - totalPaid),
      status,
      companyId,
      vehicleId: `muv-kt-${String(i + 1).padStart(3, "0")}`,
      driverId: `drv-${i + 1}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  });

  // 6. Seed Shifts
  const shiftsList: any[] = [];
  
  for (let i = 0; i < 45; i++) {
    const vehicleIdx = i % 10;
    const vehicleId = `muv-kt-${String(vehicleIdx + 1).padStart(3, "0")}`;
    const driverId = `drv-${vehicleIdx + 1}`;
    const companyId = vehicleIdx < 7 ? "c-1" : "c-2";
    const contract = contractsList[vehicleIdx];
    
    const dayOffset = Math.floor(i / 2) + 1; 
    const startTimeDate = new Date(nowMs - dayOffset * 24 * 3600 * 1000 - (i % 3) * 4 * 3600 * 1000);
    const durationHours = 5 + (i % 4) + Math.random();
    const endTimeDate = new Date(startTimeDate.getTime() + durationHours * 3600 * 1000);
    
    const distance = 80 + (i % 5) * 15 + Math.random() * 8;
    
    // Daily target remittance expected
    const amountExpected = contract ? contract.dailyTarget : 12000;
    let amountReceived = amountExpected;
    if (i % 9 === 0) {
      amountReceived = amountExpected - 2000; // Underpayment/shortfall
    } else if (i % 15 === 0) {
      amountReceived = 0; // Absent / No remittance
    }
    
    const outstandingBalance = amountExpected - amountReceived;
    const revenue = amountReceived;
    
    let status = "ENDED";
    if (outstandingBalance > 0 && revenue > 0) {
      status = "LOW_PERF"; 
    } else if (revenue === 0) {
      status = "FLAGGED";
    }

    shiftsList.push({
      id: `s-hist-${i + 1}`,
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
      amountExpected,
      amountReceived,
      outstandingBalance,
      remarks: outstandingBalance > 0 ? "Under remittance" : "Full payment received",
      companyId,
      vehicleId,
      driverId,
      createdAt: startTimeDate.toISOString(),
      updatedAt: endTimeDate.toISOString(),
    });
  }

  // Active shifts (started but not ended)
  shiftsList.push(
    {
      id: "s-active-1",
      startTime: new Date(nowMs - 3.5 * 3600 * 1000).toISOString(),
      endTime: null,
      startOdometer: 12450.2,
      endOdometer: null,
      revenue: 0,
      status: "ACTIVE",
      amountExpected: 12000,
      amountReceived: 0,
      outstandingBalance: 0,
      remarks: null,
      companyId: "c-1",
      vehicleId: "muv-kt-001",
      driverId: "drv-1",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "s-active-2",
      startTime: new Date(nowMs - 2 * 3600 * 1000).toISOString(),
      endTime: null,
      startOdometer: 9821.7,
      endOdometer: null,
      revenue: 0,
      status: "ACTIVE",
      amountExpected: 12000,
      amountReceived: 0,
      outstandingBalance: 0,
      remarks: null,
      companyId: "c-1",
      vehicleId: "muv-kt-006",
      driverId: "drv-6",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  );

  // 7. Seed Maintenance History
  const maintenancesList = [
    {
      id: "m-1",
      type: "OIL_CHANGE",
      workshop: "Total Katsina Workshop",
      cost: 15000,
      date: new Date(nowMs - 15 * 24 * 3600 * 1000).toISOString(),
      notes: "Routine oil and filter replacement",
      companyId: "c-1",
      vehicleId: "muv-kt-001",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "m-2",
      type: "BRAKE_REPAIR",
      workshop: "Express Auto Centre",
      cost: 25000,
      date: new Date(nowMs - 10 * 24 * 3600 * 1000).toISOString(),
      notes: "Front brake pad replacement",
      companyId: "c-1",
      vehicleId: "muv-kt-004",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "m-3",
      type: "CNG_INSPECTION",
      workshop: "NIPCO CNG Hub Katsina",
      cost: 10000,
      date: new Date(nowMs - 5 * 24 * 3600 * 1000).toISOString(),
      notes: "CNG cylinder leak and pressure test",
      companyId: "c-2",
      vehicleId: "muv-kt-009",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  ];

  return {
    companies: companiesList,
    users: usersList,
    drivers: driversList,
    vehicles: vehiclesList,
    shifts: shiftsList,
    contracts: contractsList,
    maintenances: maintenancesList,
  };
};

const loadFallbackData = (): FallbackData => {
  if (fs.existsSync(DB_FILE)) {
    try {
      const content = fs.readFileSync(DB_FILE, "utf-8");
      return JSON.parse(content);
    } catch (e) {
      console.error("Error loading fallback DB file.", e);
    }
  }

  const tmpPath = path.join(os.tmpdir(), "muva_db_fallback.json");
  if (fs.existsSync(tmpPath)) {
    DB_FILE = tmpPath;
    try {
      const content = fs.readFileSync(DB_FILE, "utf-8");
      return JSON.parse(content);
    } catch (e) {}
  }

  const initial = getInitialData();
  saveFallbackData(initial);
  return initial;
};

const saveFallbackData = (data: FallbackData) => {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (err: any) {
    if (err.code === "EROFS" || err.code === "EACCES" || DB_FILE.includes("/var/task")) {
      console.warn(`Redirecting DB write from ${DB_FILE} to /tmp due to:`, err.message);
      const tmpPath = path.join(os.tmpdir(), "muva_db_fallback.json");
      if (DB_FILE !== tmpPath) {
        try {
          if (fs.existsSync(DB_FILE)) {
            fs.copyFileSync(DB_FILE, tmpPath);
          }
        } catch (copyErr) {
          console.error("Failed to copy seed database to tmp:", copyErr);
        }
        DB_FILE = tmpPath;
        fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
      } else {
        throw err;
      }
    } else {
      throw err;
    }
  }
};

// Helper to update a Hire Purchase contract balance
const applyRemittanceToFallbackContract = (store: FallbackData, companyId: string, vehicleId: string, driverId: string, amount: number) => {
  const contract = store.contracts.find(
    (c) => c.companyId === companyId && c.vehicleId === vehicleId && c.driverId === driverId && c.status === "ACTIVE"
  );
  if (contract) {
    contract.totalPaid = (contract.totalPaid || 0) + amount;
    contract.remainingBalance = Math.max(0, contract.targetAmount - contract.totalPaid);
    if (contract.remainingBalance === 0) {
      contract.status = "COMPLETED";
    }
    contract.updatedAt = new Date().toISOString();
  }
};

export const dbService = {
  async ensureSeeded() {
    if (!isPrismaEnabled()) {
      loadFallbackData();
      return;
    }
    try {
      const count = await prisma.company.count();
      if (count > 0) return; // Already seeded

      console.log("[Seeding] PostgreSQL database is empty. Auto-seeding MUVA SaaS data...");
      const data = getInitialData();

      // Seed Companies
      for (const c of data.companies) {
        await prisma.company.create({ data: c });
      }

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
            companyId: u.companyId,
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
            passport: d.passport,
            emergencyContact: d.emergencyContact,
            nextOfKin: d.nextOfKin,
            licenseNumber: d.licenseNumber,
            nationalId: d.nationalId,
            employmentDate: new Date(d.employmentDate),
            companyId: d.companyId,
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
            registrationNumber: v.registrationNumber,
            engineNumber: v.engineNumber,
            chassisNumber: v.chassisNumber,
            vehicleType: v.vehicleType,
            fuelType: v.fuelType,
            plateNumber: v.plateNumber,
            status: v.status as any,
            purchaseDate: v.purchaseDate ? new Date(v.purchaseDate) : null,
            purchasePrice: v.purchasePrice,
            assignedDriverId: v.assignedDriverId,
            companyId: v.companyId,
            createdAt: new Date(v.createdAt),
            updatedAt: new Date(v.updatedAt),
          },
        });
      }

      // Seed Hire Purchase Contracts
      for (const hp of data.contracts) {
        await prisma.hirePurchaseContract.create({
          data: {
            id: hp.id,
            startDate: new Date(hp.startDate),
            targetAmount: hp.targetAmount,
            dailyTarget: hp.dailyTarget,
            totalPaid: hp.totalPaid,
            remainingBalance: hp.remainingBalance,
            status: hp.status as any,
            companyId: hp.companyId,
            vehicleId: hp.vehicleId,
            driverId: hp.driverId,
            createdAt: new Date(hp.createdAt),
            updatedAt: new Date(hp.updatedAt),
          }
        });
      }

      // Seed Shifts
      for (const s of data.shifts) {
        await prisma.shift.create({
          data: {
            id: s.id,
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
            status: s.status as any,
            amountExpected: s.amountExpected,
            amountReceived: s.amountReceived,
            outstandingBalance: s.outstandingBalance,
            remarks: s.remarks,
            companyId: s.companyId,
            vehicleId: s.vehicleId,
            driverId: s.driverId,
            createdAt: new Date(s.createdAt),
            updatedAt: new Date(s.updatedAt),
          },
        });
      }

      // Seed Maintenances
      for (const m of data.maintenances) {
        await prisma.maintenanceJob.create({
          data: {
            id: m.id,
            type: m.type as any,
            workshop: m.workshop,
            cost: m.cost,
            date: new Date(m.date),
            notes: m.notes,
            companyId: m.companyId,
            vehicleId: m.vehicleId,
            createdAt: new Date(m.createdAt),
            updatedAt: new Date(m.updatedAt),
          }
        });
      }

      console.log("[Seeding] PostgreSQL database seeding complete.");
    } catch (e) {
      console.error("Seeding error:", e);
    }
  },

  // COMPANIES
  async getCompanies() {
    if (isPrismaEnabled()) {
      return await prisma.company.findMany({
        orderBy: { name: "asc" },
      });
    }
    const store = loadFallbackData();
    return store.companies;
  },

  async getCompanyById(id: string) {
    if (isPrismaEnabled()) {
      return await prisma.company.findUnique({
        where: { id },
      });
    }
    const store = loadFallbackData();
    return store.companies.find((c) => c.id === id) || null;
  },

  async createCompany(data: {
    name: string;
    logo?: string | null;
    phone: string;
    email?: string | null;
    address?: string | null;
    country?: string;
    state?: string | null;
    fleetType?: string;
    subscription?: string;
  }) {
    if (isPrismaEnabled()) {
      return await prisma.company.create({
        data: {
          name: data.name,
          logo: data.logo,
          phone: data.phone,
          email: data.email,
          address: data.address,
          country: data.country || "Nigeria",
          state: data.state,
          fleetType: data.fleetType || "General",
          subscription: data.subscription || "TRIAL",
          status: "ACTIVE",
        },
      });
    }
    const store = loadFallbackData();
    const newCompany = {
      id: `c-${Date.now()}`,
      name: data.name,
      logo: data.logo || null,
      phone: data.phone,
      email: data.email || null,
      address: data.address || null,
      country: data.country || "Nigeria",
      state: data.state || null,
      fleetType: data.fleetType || "General",
      subscription: data.subscription || "TRIAL",
      status: "ACTIVE",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    store.companies.push(newCompany);
    saveFallbackData(store);
    return newCompany;
  },

  async updateCompany(id: string, data: any) {
    if (isPrismaEnabled()) {
      return await prisma.company.update({
        where: { id },
        data,
      });
    }
    const store = loadFallbackData();
    const idx = store.companies.findIndex((c) => c.id === id);
    if (idx === -1) throw new Error("Company not found");
    store.companies[idx] = {
      ...store.companies[idx],
      ...data,
      updatedAt: new Date().toISOString(),
    };
    saveFallbackData(store);
    return store.companies[idx];
  },

  // USERS
  async getUsers(companyId?: string) {
    if (isPrismaEnabled()) {
      return await prisma.user.findMany({
        where: companyId ? { companyId } : undefined,
        orderBy: { name: "asc" },
      });
    }
    const store = loadFallbackData();
    if (companyId) {
      return store.users.filter((u) => u.companyId === companyId);
    }
    return store.users;
  },

  async getUserById(id: string) {
    if (isPrismaEnabled()) {
      return await prisma.user.findUnique({ where: { id } });
    }
    const store = loadFallbackData();
    return store.users.find((u) => u.id === id) || null;
  },

  async getUserByPhone(phone: string) {
    if (isPrismaEnabled()) {
      return await prisma.user.findUnique({ where: { phone } });
    }
    const store = loadFallbackData();
    return store.users.find((u) => u.phone === phone) || null;
  },

  async getUserByPhoneOrEmail(identifier: string) {
    if (isPrismaEnabled()) {
      return await prisma.user.findFirst({
        where: {
          OR: [{ phone: identifier }, { email: identifier }],
        },
      });
    }
    const store = loadFallbackData();
    return (
      store.users.find((u) => u.phone === identifier || u.email === identifier) || null
    );
  },

  async createUser(data: {
    name: string;
    phone: string;
    email?: string | null;
    password: string;
    role: string;
    companyId?: string | null;
  }) {
    if (isPrismaEnabled()) {
      return await prisma.user.create({
        data: {
          name: data.name,
          phone: data.phone,
          email: data.email,
          password: data.password,
          role: data.role as any,
          companyId: data.companyId,
          status: "active",
        },
      });
    }
    const store = loadFallbackData();
    const newUser = {
      id: `u-${Date.now()}`,
      name: data.name,
      phone: data.phone,
      email: data.email || null,
      password: data.password,
      role: data.role,
      companyId: data.companyId || null,
      status: "active",
      points: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    store.users.push(newUser);
    saveFallbackData(store);
    return newUser;
  },

  async updateUser(id: string, data: any) {
    if (isPrismaEnabled()) {
      return await prisma.user.update({
        where: { id },
        data: {
          ...data,
          role: data.role ? (data.role as any) : undefined,
        },
      });
    }
    const store = loadFallbackData();
    const index = store.users.findIndex((u) => u.id === id);
    if (index === -1) throw new Error("User not found");
    const updated = {
      ...store.users[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };
    store.users[index] = updated;
    saveFallbackData(store);
    return updated;
  },

  async suspendUser(id: string) {
    return await this.updateUser(id, { status: "suspended" });
  },

  async unsuspendUser(id: string) {
    return await this.updateUser(id, { status: "active" });
  },

  async deleteUser(id: string) {
    if (isPrismaEnabled()) {
      return await prisma.user.delete({ where: { id } });
    }
    const store = loadFallbackData();
    store.users = store.users.filter((u) => u.id !== id);
    saveFallbackData(store);
    return true;
  },

  // DRIVERS
  async getDrivers(companyId?: string) {
    await this.ensureSeeded();
    if (isPrismaEnabled()) {
      return await prisma.driver.findMany({
        where: companyId ? { companyId } : undefined,
        include: { assignedVehicle: true, contract: true },
        orderBy: { name: "asc" },
      });
    }
    const store = loadFallbackData();
    let drivers = store.drivers;
    if (companyId) {
      drivers = drivers.filter((d) => d.companyId === companyId);
    }
    return drivers.map((d) => ({
      ...d,
      assignedVehicle: store.vehicles.find((v) => v.assignedDriverId === d.id) || null,
      contract: store.contracts.find((c) => c.driverId === d.id && c.status === "ACTIVE") || null,
    }));
  },

  async getDriverById(id: string) {
    await this.ensureSeeded();
    if (isPrismaEnabled()) {
      return await prisma.driver.findUnique({
        where: { id },
        include: { assignedVehicle: true, shifts: { orderBy: { startTime: "desc" } }, contract: true },
      });
    }
    const store = loadFallbackData();
    const driver = store.drivers.find((d) => d.id === id);
    if (!driver) return null;
    return {
      ...driver,
      assignedVehicle: store.vehicles.find((v) => v.assignedDriverId === driver.id) || null,
      shifts: store.shifts.filter((s) => s.driverId === id).sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()),
      contract: store.contracts.find((c) => c.driverId === id && c.status === "ACTIVE") || null,
    };
  },

  async createDriver(data: {
    name: string;
    phone: string;
    address: string;
    guarantorName: string;
    guarantorPhone: string;
    companyId: string;
    passport?: string | null;
    emergencyContact?: string | null;
    nextOfKin?: string | null;
    licenseNumber?: string | null;
    nationalId?: string | null;
  }) {
    if (isPrismaEnabled()) {
      return await prisma.driver.create({
        data: {
          name: data.name,
          phone: data.phone,
          address: data.address,
          guarantorName: data.guarantorName,
          guarantorPhone: data.guarantorPhone,
          companyId: data.companyId,
          status: "active",
          passport: data.passport,
          emergencyContact: data.emergencyContact,
          nextOfKin: data.nextOfKin,
          licenseNumber: data.licenseNumber,
          nationalId: data.nationalId,
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
      companyId: data.companyId,
      status: "active",
      passport: data.passport || null,
      emergencyContact: data.emergencyContact || null,
      nextOfKin: data.nextOfKin || null,
      licenseNumber: data.licenseNumber || null,
      nationalId: data.nationalId || null,
      employmentDate: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    store.drivers.push(newDriver);
    saveFallbackData(store);
    return newDriver;
  },

  async updateDriver(id: string, data: any) {
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

  async deleteDriver(id: string) {
    if (isPrismaEnabled()) {
      return await prisma.driver.delete({ where: { id } });
    }
    const store = loadFallbackData();
    store.drivers = store.drivers.filter((d) => d.id !== id);
    saveFallbackData(store);
    return true;
  },

  // VEHICLES
  async getVehicles(companyId?: string) {
    await this.ensureSeeded();
    if (isPrismaEnabled()) {
      return await prisma.vehicle.findMany({
        where: companyId ? { companyId } : undefined,
        include: { assignedDriver: true, contract: true, maintenances: true },
        orderBy: { vehicleNumber: "asc" },
      });
    }
    const store = loadFallbackData();
    let vehicles = store.vehicles;
    if (companyId) {
      vehicles = vehicles.filter((v) => v.companyId === companyId);
    }
    return vehicles.map((v) => ({
      ...v,
      assignedDriver: store.drivers.find((d) => d.id === v.assignedDriverId) || null,
      contract: store.contracts.find((c) => c.vehicleId === v.id && c.status === "ACTIVE") || null,
      maintenances: store.maintenances.filter((m) => m.vehicleId === v.id),
    }));
  },

  async getVehicleById(id: string) {
    await this.ensureSeeded();
    if (isPrismaEnabled()) {
      return await prisma.vehicle.findUnique({
        where: { id },
        include: { assignedDriver: true, shifts: { orderBy: { startTime: "desc" } }, contract: true, maintenances: { orderBy: { date: "desc" } } },
      });
    }
    const store = loadFallbackData();
    const vehicle = store.vehicles.find((v) => v.id === id);
    if (!vehicle) return null;
    return {
      ...vehicle,
      assignedDriver: store.drivers.find((d) => d.id === vehicle.assignedDriverId) || null,
      shifts: store.shifts.filter((s) => s.vehicleId === id).sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()),
      contract: store.contracts.find((c) => c.vehicleId === id && c.status === "ACTIVE") || null,
      maintenances: store.maintenances.filter((m) => m.vehicleId === id).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    };
  },

  async createVehicle(data: {
    id: string;
    vehicleNumber: string;
    plateNumber: string;
    vehicleType: string;
    fuelType: string;
    companyId: string;
    registrationNumber?: string | null;
    engineNumber?: string | null;
    chassisNumber?: string | null;
    purchaseDate?: string | null;
    purchasePrice?: number | null;
    assignedDriverId?: string | null;
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
          companyId: data.companyId,
          registrationNumber: data.registrationNumber,
          engineNumber: data.engineNumber,
          chassisNumber: data.chassisNumber,
          purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : null,
          purchasePrice: data.purchasePrice,
          assignedDriverId: data.assignedDriverId,
          status: (data.status || "AVAILABLE") as any,
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
      companyId: data.companyId,
      registrationNumber: data.registrationNumber || null,
      engineNumber: data.engineNumber || null,
      chassisNumber: data.chassisNumber || null,
      purchaseDate: data.purchaseDate || null,
      purchasePrice: data.purchasePrice || null,
      assignedDriverId: data.assignedDriverId || null,
      status: data.status || "AVAILABLE",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    store.vehicles.push(newVehicle);
    saveFallbackData(store);
    return newVehicle;
  },

  async updateVehicle(id: string, data: any) {
    if (isPrismaEnabled()) {
      return await prisma.vehicle.update({
        where: { id },
        data: {
          ...data,
          status: data.status ? (data.status as any) : undefined,
          purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : undefined,
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
    return await this.updateVehicle(id, { status: "INACTIVE" });
  },

  async deleteVehicle(id: string) {
    if (isPrismaEnabled()) {
      return await prisma.vehicle.delete({ where: { id } });
    }
    const store = loadFallbackData();
    store.vehicles = store.vehicles.filter((v) => v.id !== id);
    saveFallbackData(store);
    return true;
  },

  // SHIFTS
  async getShiftsHistory(companyId?: string) {
    await this.ensureSeeded();
    if (isPrismaEnabled()) {
      return await prisma.shift.findMany({
        where: companyId ? { companyId } : undefined,
        include: { vehicle: true, driver: true },
        orderBy: { startTime: "desc" },
      });
    }
    const store = loadFallbackData();
    let shifts = store.shifts;
    if (companyId) {
      shifts = shifts.filter((s) => s.companyId === companyId);
    }
    return shifts.map((s) => ({
      ...s,
      vehicle: store.vehicles.find((v) => v.id === s.vehicleId) || null,
      driver: store.drivers.find((d) => d.id === s.driverId) || null,
    }));
  },

  async getActiveShifts(companyId?: string) {
    await this.ensureSeeded();
    if (isPrismaEnabled()) {
      return await prisma.shift.findMany({
        where: {
          status: "ACTIVE",
          companyId: companyId || undefined,
        },
        include: { vehicle: true, driver: true },
        orderBy: { startTime: "desc" },
      });
    }
    const store = loadFallbackData();
    let shifts = store.shifts.filter((s) => s.status === "ACTIVE");
    if (companyId) {
      shifts = shifts.filter((s) => s.companyId === companyId);
    }
    return shifts.map((s) => ({
      ...s,
      vehicle: store.vehicles.find((v) => v.id === s.vehicleId) || null,
      driver: store.drivers.find((d) => d.id === s.driverId) || null,
    }));
  },

  async getActiveShiftForDriver(driverId: string) {
    if (isPrismaEnabled()) {
      return await prisma.shift.findFirst({
        where: { driverId, status: "ACTIVE" },
      });
    }
    const store = loadFallbackData();
    return store.shifts.find((s) => s.driverId === driverId && s.status === "ACTIVE") || null;
  },

  async getActiveShiftForVehicle(vehicleId: string) {
    if (isPrismaEnabled()) {
      return await prisma.shift.findFirst({
        where: { vehicleId, status: "ACTIVE" },
      });
    }
    const store = loadFallbackData();
    return store.shifts.find((s) => s.vehicleId === vehicleId && s.status === "ACTIVE") || null;
  },

  async startShift(vehicleId: string, driverId: string, startOdo: number, companyId: string) {
    if (isPrismaEnabled()) {
      // Update vehicle status to ON_ROAD
      await prisma.vehicle.update({
        where: { id: vehicleId },
        data: { status: "ON_ROAD" },
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
          companyId,
        },
      });
    }
    const store = loadFallbackData();
    const vehicle = store.vehicles.find((v) => v.id === vehicleId);
    if (vehicle) vehicle.status = "ON_ROAD";
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
      amountExpected: 12000, // standard default
      amountReceived: 0,
      outstandingBalance: 0,
      remarks: null,
      companyId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    store.shifts.push(newShift);
    saveFallbackData(store);
    return newShift;
  },

  async endShift(
    shiftId: string,
    endOdo: number,
    revenue: number,
    amountExpected: number,
    amountReceived: number,
    outstandingBalance: number,
    remarks: string,
    companyId: string
  ) {
    const endTime = new Date();
    if (isPrismaEnabled()) {
      const shift = await prisma.shift.findUnique({ where: { id: shiftId } });
      if (!shift) throw new Error("Shift not found");

      const hours = Math.max(0.1, (endTime.getTime() - shift.startTime.getTime()) / (1000 * 60 * 60));
      const distance = Math.max(0.1, endOdo - shift.startOdometer);
      const revPerHour = revenue / hours;
      const revPerKm = revenue / distance;
      
      let status: any = "ENDED";
      if (outstandingBalance > 0 && revenue > 0) {
        status = "LOW_PERF";
      } else if (revenue === 0) {
        status = "FLAGGED";
      }

      await prisma.vehicle.update({
        where: { id: shift.vehicleId },
        data: { status: "AVAILABLE" },
      });

      const updatedShift = await prisma.shift.update({
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
          amountExpected,
          amountReceived,
          outstandingBalance,
          remarks,
        },
      });

      // Apply the remittance amount received directly to the Hire Purchase contract
      if (amountReceived > 0) {
        const contract = await prisma.hirePurchaseContract.findFirst({
          where: { companyId, vehicleId: shift.vehicleId, driverId: shift.driverId, status: "ACTIVE" }
        });
        if (contract) {
          const totalPaid = contract.totalPaid + amountReceived;
          const remainingBalance = Math.max(0, contract.targetAmount - totalPaid);
          const contractStatus = remainingBalance === 0 ? "COMPLETED" : "ACTIVE";
          
          await prisma.hirePurchaseContract.update({
            where: { id: contract.id },
            data: {
              totalPaid,
              remainingBalance,
              status: contractStatus as any
            }
          });
        }
      }

      return updatedShift;
    }

    const store = loadFallbackData();
    const shiftIndex = store.shifts.findIndex((s) => s.id === shiftId);
    if (shiftIndex === -1) throw new Error("Shift not found");
    const shift = store.shifts[shiftIndex];

    const start = new Date(shift.startTime);
    const hours = Math.max(0.1, (endTime.getTime() - start.getTime()) / (1000 * 60 * 60));
    const distance = Math.max(0.1, endOdo - shift.startOdometer);

    let status = "ENDED";
    if (outstandingBalance > 0 && revenue > 0) {
      status = "LOW_PERF";
    } else if (revenue === 0) {
      status = "FLAGGED";
    }

    const vehicle = store.vehicles.find((v) => v.id === shift.vehicleId);
    if (vehicle) vehicle.status = "AVAILABLE";

    shift.endTime = endTime.toISOString();
    shift.endOdometer = endOdo;
    shift.revenue = revenue;
    shift.hoursWorked = Math.floor(hours);
    shift.minutesWorked = Math.floor((hours % 1) * 60);
    shift.distanceCovered = distance;
    shift.revenuePerHour = Math.round(revenue / hours);
    shift.revenuePerKm = Math.round(revenue / distance);
    shift.status = status;
    shift.amountExpected = amountExpected;
    shift.amountReceived = amountReceived;
    shift.outstandingBalance = outstandingBalance;
    shift.remarks = remarks;
    shift.updatedAt = new Date().toISOString();

    store.shifts[shiftIndex] = shift;

    // Apply the remittance amount received directly to the Hire Purchase contract
    if (amountReceived > 0) {
      applyRemittanceToFallbackContract(store, companyId, shift.vehicleId, shift.driverId, amountReceived);
    }

    saveFallbackData(store);
    return shift;
  },

  async recordDailyRevenue(
    vehicleId: string,
    driverId: string,
    revenue: number,
    dateStr: string,
    notes?: string,
    companyId?: string
  ) {
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

      let resultShift;
      if (shift) {
        resultShift = await prisma.shift.update({
          where: { id: shift.id },
          data: {
            revenue,
            amountReceived: revenue,
            outstandingBalance: Math.max(0, shift.amountExpected - revenue),
          }
        });
      } else {
        resultShift = await prisma.shift.create({
          data: {
            vehicleId,
            driverId,
            startTime: startOfDay,
            endTime: endOfDay,
            startOdometer: 0,
            endOdometer: 0,
            revenue,
            amountExpected: 12000, // fallback expected
            amountReceived: revenue,
            outstandingBalance: Math.max(0, 12000 - revenue),
            status: "ENDED",
            companyId: companyId || "",
            remarks: notes || "Manual remittance override",
          }
        });
      }

      // Deduct from HP contract
      if (companyId && revenue > 0) {
        const contract = await prisma.hirePurchaseContract.findFirst({
          where: { companyId, vehicleId, driverId, status: "ACTIVE" }
        });
        if (contract) {
          const totalPaid = contract.totalPaid + revenue;
          const remainingBalance = Math.max(0, contract.targetAmount - totalPaid);
          const contractStatus = remainingBalance === 0 ? "COMPLETED" : "ACTIVE";
          await prisma.hirePurchaseContract.update({
            where: { id: contract.id },
            data: {
              totalPaid,
              remainingBalance,
              status: contractStatus as any
            }
          });
        }
      }

      return resultShift;
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
      shift.amountReceived = revenue;
      shift.outstandingBalance = Math.max(0, shift.amountExpected - revenue);
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
        amountExpected: 12000,
        amountReceived: revenue,
        outstandingBalance: Math.max(0, 12000 - revenue),
        remarks: notes || "Manual remittance override",
        companyId: companyId || "c-1",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      store.shifts.push(newShift);
    }

    if (companyId && revenue > 0) {
      applyRemittanceToFallbackContract(store, companyId, vehicleId, driverId, revenue);
    }

    saveFallbackData(store);
    return true;
  },

  // HIRE PURCHASE CONTRACTS
  async getHirePurchaseContracts(companyId?: string) {
    await this.ensureSeeded();
    if (isPrismaEnabled()) {
      return await prisma.hirePurchaseContract.findMany({
        where: companyId ? { companyId } : undefined,
        include: { vehicle: true, driver: true },
        orderBy: { startDate: "desc" }
      });
    }
    const store = loadFallbackData();
    let contracts = store.contracts;
    if (companyId) {
      contracts = contracts.filter((c) => c.companyId === companyId);
    }
    return contracts.map((c) => ({
      ...c,
      vehicle: store.vehicles.find((v) => v.id === c.vehicleId) || null,
      driver: store.drivers.find((d) => d.id === c.driverId) || null,
    }));
  },

  async getHirePurchaseContractById(id: string) {
    if (isPrismaEnabled()) {
      return await prisma.hirePurchaseContract.findUnique({
        where: { id },
        include: { vehicle: true, driver: true }
      });
    }
    const store = loadFallbackData();
    const contract = store.contracts.find((c) => c.id === id);
    if (!contract) return null;
    return {
      ...contract,
      vehicle: store.vehicles.find((v) => v.id === contract.vehicleId) || null,
      driver: store.drivers.find((d) => d.id === contract.driverId) || null,
    };
  },

  async getHirePurchaseContractByVehicleId(vehicleId: string) {
    if (isPrismaEnabled()) {
      return await prisma.hirePurchaseContract.findFirst({
        where: { vehicleId, status: "ACTIVE" },
        include: { driver: true }
      });
    }
    const store = loadFallbackData();
    const contract = store.contracts.find((c) => c.vehicleId === vehicleId && c.status === "ACTIVE");
    if (!contract) return null;
    return {
      ...contract,
      driver: store.drivers.find((d) => d.id === contract.driverId) || null,
    };
  },

  async getHirePurchaseContractByDriverId(driverId: string) {
    if (isPrismaEnabled()) {
      return await prisma.hirePurchaseContract.findFirst({
        where: { driverId, status: "ACTIVE" },
        include: { vehicle: true }
      });
    }
    const store = loadFallbackData();
    const contract = store.contracts.find((c) => c.driverId === driverId && c.status === "ACTIVE");
    if (!contract) return null;
    return {
      ...contract,
      vehicle: store.vehicles.find((v) => v.id === contract.vehicleId) || null,
    };
  },

  async createHirePurchaseContract(data: {
    targetAmount: number;
    dailyTarget: number;
    startDate: string;
    companyId: string;
    vehicleId: string;
    driverId: string;
  }) {
    if (isPrismaEnabled()) {
      return await prisma.hirePurchaseContract.create({
        data: {
          startDate: new Date(data.startDate),
          targetAmount: data.targetAmount,
          dailyTarget: data.dailyTarget,
          totalPaid: 0,
          remainingBalance: data.targetAmount,
          status: "ACTIVE",
          companyId: data.companyId,
          vehicleId: data.vehicleId,
          driverId: data.driverId,
        }
      });
    }
    const store = loadFallbackData();
    const newContract = {
      id: `hp-con-${Date.now()}`,
      startDate: new Date(data.startDate).toISOString(),
      targetAmount: data.targetAmount,
      dailyTarget: data.dailyTarget,
      totalPaid: 0,
      remainingBalance: data.targetAmount,
      status: "ACTIVE",
      companyId: data.companyId,
      vehicleId: data.vehicleId,
      driverId: data.driverId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    store.contracts.push(newContract);
    saveFallbackData(store);
    return newContract;
  },

  async updateHirePurchaseContract(id: string, data: any) {
    if (isPrismaEnabled()) {
      return await prisma.hirePurchaseContract.update({
        where: { id },
        data: {
          ...data,
          status: data.status ? (data.status as any) : undefined,
        }
      });
    }
    const store = loadFallbackData();
    const idx = store.contracts.findIndex((c) => c.id === id);
    if (idx === -1) throw new Error("Contract not found");
    store.contracts[idx] = {
      ...store.contracts[idx],
      ...data,
      updatedAt: new Date().toISOString(),
    };
    saveFallbackData(store);
    return store.contracts[idx];
  },

  // MAINTENANCE JOBS
  async getMaintenanceJobs(companyId?: string) {
    await this.ensureSeeded();
    if (isPrismaEnabled()) {
      return await prisma.maintenanceJob.findMany({
        where: companyId ? { companyId } : undefined,
        include: { vehicle: true },
        orderBy: { date: "desc" }
      });
    }
    const store = loadFallbackData();
    let maintenances = store.maintenances;
    if (companyId) {
      maintenances = maintenances.filter((m) => m.companyId === companyId);
    }
    return maintenances.map((m) => ({
      ...m,
      vehicle: store.vehicles.find((v) => v.id === m.vehicleId) || null,
    }));
  },

  async createMaintenanceJob(data: {
    type: string;
    workshop: string;
    cost: number;
    date: string;
    notes?: string | null;
    companyId: string;
    vehicleId: string;
  }) {
    if (isPrismaEnabled()) {
      // Set vehicle status to MAINTENANCE
      await prisma.vehicle.update({
        where: { id: data.vehicleId },
        data: { status: "MAINTENANCE" },
      });

      return await prisma.maintenanceJob.create({
        data: {
          type: data.type as any,
          workshop: data.workshop,
          cost: data.cost,
          date: new Date(data.date),
          notes: data.notes,
          companyId: data.companyId,
          vehicleId: data.vehicleId,
        }
      });
    }

    const store = loadFallbackData();
    const vehicle = store.vehicles.find((v) => v.id === data.vehicleId);
    if (vehicle) vehicle.status = "MAINTENANCE";

    const newJob = {
      id: `m-${Date.now()}`,
      type: data.type,
      workshop: data.workshop,
      cost: data.cost,
      date: new Date(data.date).toISOString(),
      notes: data.notes || null,
      companyId: data.companyId,
      vehicleId: data.vehicleId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    store.maintenances.push(newJob);
    saveFallbackData(store);
    return newJob;
  },

  async getMaintenanceJobsByVehicleId(vehicleId: string) {
    if (isPrismaEnabled()) {
      return await prisma.maintenanceJob.findMany({
        where: { vehicleId },
        orderBy: { date: "desc" }
      });
    }
    const store = loadFallbackData();
    return store.maintenances
      .filter((m) => m.vehicleId === vehicleId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }
};
