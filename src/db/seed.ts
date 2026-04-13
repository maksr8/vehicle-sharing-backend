import bcrypt from "bcrypt";
import { PrismaClient, UserRole } from "../generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Starting database seed...");

  const plainPassword = process.env.SEED_USERS_PASSWORD!;
  const hashedPassword = await bcrypt.hash(
    plainPassword,
    parseInt(process.env.PASSWORD_SALT_ROUNDS!),
  );

  const usersToSeed = [
    { email: "u1@e.com", name: "User 1", role: UserRole.USER },
    { email: "u2@e.com", name: "User 2", role: UserRole.USER },
    { email: "a1@e.com", name: "Admin 1", role: UserRole.ADMIN },
    { email: "a2@e.com", name: "Admin 2", role: UserRole.ADMIN },
  ];

  for (const u of usersToSeed) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: {
        email: u.email,
        name: u.name,
        password: hashedPassword,
        role: u.role,
      },
    });
  }
  console.log(`Seeded ${usersToSeed.length} users.`);

  const evFleet = [
    {
      model: "Tesla Model 3 Dual Motor",
      licensePlate: "AM 0001 AA",
      vin: "5YJ3E1EA1LF000001",
      year: 2026,
      pricePerMinuteCents: 150,
    },
    {
      model: "Hyundai Ioniq 5 Limited",
      licensePlate: "AM 0002 AA",
      vin: "KM8KN4AE2NU000002",
      year: 2026,
      pricePerMinuteCents: 120,
    },
    {
      model: "Polestar 2 Long Range",
      licensePlate: "AM 0003 AA",
      vin: "LPSCE3KAXMZ000003",
      year: 2023,
      pricePerMinuteCents: 135,
    },
    {
      model: "Ford Mustang Mach-E GT",
      licensePlate: "AM 0004 AA",
      vin: "3FMTK4SX1MM000004",
      year: 2022,
      pricePerMinuteCents: 160,
    },
    {
      model: "Kia EV6 GT-Line",
      licensePlate: "AM 0005 AA",
      vin: "KNDCE3LCXN5000005",
      year: 2025,
      pricePerMinuteCents: 125,
    },
    {
      model: "Nissan Leaf SV Plus",
      licensePlate: "AM 0006 AA",
      vin: "1N4BZ1CP8MC000006",
      year: 2020,
      pricePerMinuteCents: 85,
    },
  ];

  for (const vehicle of evFleet) {
    await prisma.vehicle.upsert({
      where: { licensePlate: vehicle.licensePlate },
      update: {},
      create: vehicle,
    });
  }
  console.log(`Seeded ${evFleet.length} electric vehicles.`);
}

main()
  .catch((e) => {
    console.error("Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    console.log("Disconnected from database.");
  });
