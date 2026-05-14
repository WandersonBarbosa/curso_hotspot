import "dotenv/config";
import { db, pool } from "./index.js";
import { companies, users, plans, mikrotiks, hotspotUsers, invoices } from "./schema/index.js";
import { hashPassword } from "../modules/auth/auth.service.js";
import { eq } from "drizzle-orm";

async function main() {
  let comp = await db.query.companies.findFirst({ where: eq(companies.slug, "demo") });
  if (!comp) {
    const [inserted] = await db
      .insert(companies)
      .values({
        name: "Provedor Demo",
        slug: "demo",
        document: "00000000000100",
        settings: {
          atlazBaseUrl: process.env.ATLAZ_API_BASE_URL,
          atlazToken: process.env.ATLAZ_API_TOKEN,
        },
      })
      .returning();
    comp = inserted;
  }
  if (!comp) throw new Error("Empresa demo não criada");

  const existingAdmin = await db.query.users.findFirst({ where: eq(users.email, "admin@demo.local") });
  if (!existingAdmin) {
    const passwordHash = await hashPassword("admin123");
    await db.insert(users).values({
      email: "admin@demo.local",
      passwordHash,
      name: "Administrador",
      role: "admin",
      companyId: comp.id,
    });
  }

  const existingPlan = await db.query.plans.findFirst({ where: eq(plans.companyId, comp.id) });
  if (!existingPlan) {
    await db.insert(plans).values({
      companyId: comp.id,
      name: "100 Mbps",
      downloadMbps: "100",
      uploadMbps: "50",
      priceCents: 9990,
      mikrotikProfileName: "default",
    });
  }

  const existingMk = await db.query.mikrotiks.findFirst({ where: eq(mikrotiks.companyId, comp.id) });
  if (!existingMk) {
    await db.insert(mikrotiks).values({
      companyId: comp.id,
      name: "POP Central",
      host: process.env.SEED_MIKROTIK_HOST ?? "192.168.88.1",
      port: 8728,
      apiUser: process.env.SEED_MIKROTIK_USER ?? "api",
      apiPassword: process.env.SEED_MIKROTIK_PASSWORD ?? "api",
    });
  }

  const mk = await db.query.mikrotiks.findFirst({ where: eq(mikrotiks.companyId, comp.id) });
  const plan = await db.query.plans.findFirst({ where: eq(plans.companyId, comp.id) });
  const huExisting = await db.query.hotspotUsers.findFirst({
    where: eq(hotspotUsers.username, "cliente-demo"),
  });

  if (mk && plan && !huExisting) {
    await db.insert(hotspotUsers).values({
      companyId: comp.id,
      mikrotikId: mk.id,
      planId: plan.id,
      username: "cliente-demo",
      password: "demo123",
      profile: "default",
    });
  }

  const hu = await db.query.hotspotUsers.findFirst({ where: eq(hotspotUsers.username, "cliente-demo") });
  const invExisting = hu
    ? await db.query.invoices.findFirst({
        where: eq(invoices.hotspotUserId, hu.id),
      })
    : null;

  if (hu && !invExisting) {
    await db.insert(invoices).values({
      companyId: comp.id,
      hotspotUserId: hu.id,
      description: "Mensalidade Hotspot",
      amountCents: 9990,
      dueDate: new Date(Date.now() + 7 * 86400000),
      status: "open",
    });
  }

  // eslint-disable-next-line no-console
  console.log("Seed concluído. Login: admin@demo.local / admin123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
    process.exit(process.exitCode ?? 0);
  });
