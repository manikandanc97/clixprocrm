import { PrismaClient } from "@prisma/client";
import * as dotenv from "dotenv";
import { resolve } from "path";
dotenv.config({ path: resolve(process.cwd(), ".env") });
const db = new PrismaClient({ datasources: { db: { url: process.env.DIRECT_URL } }, log: ["error"] });
const sql = "SELECT migration_name, finished_at, rolled_back_at, started_at FROM _prisma_migrations ORDER BY migration_name";
try {
  const rows = await db.$queryRawUnsafe(sql);
  for (const r of rows) {
    const s = r.rolled_back_at ? "ROLLED_BACK" : !r.finished_at ? "PENDING/FAILED" : "APPLIED";
    console.log("["+s+"] "+r.migration_name+(s!=="APPLIED"?" started:"+r.started_at:""));
  }
  const applied = rows.filter(r=>r.finished_at&&!r.rolled_back_at).length;
  const pending = rows.filter(r=>!r.finished_at&&!r.rolled_back_at).length;
  console.log("Summary: Applied="+applied+" Pending/Failed="+pending+" Total="+rows.length);
} catch(err) { console.error("FAILED:", err.message); } finally { await db.$disconnect(); }
