import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
import { PrismaClient } from '@prisma/client';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const prisma = new PrismaClient();

const CORE_TABLES = [
  'Tenant',
  'User',
  'Invoice',
  'Customer',
  'Lead',
  'Company',
  'Deal',
  'TimelineEvent',
  'TenantInvoiceSettings',
  'InvoiceCounter',
  'InvoiceItem',
  'Payment',
  'PlatformSubscription',
  'PlatformInvoice',
  'PlatformInvoiceItem',
  'PlatformPayment',
  'PlatformRefund',
  'PlatformBillingConfig',
  'SupportTicket',
  'EmailAccount',
  'EmailThread',
  'EmailMessage',
  'EmailAttachment',
];

async function main() {
  console.log('=== STARTING CONSOLIDATED READ-ONLY MIGRATION HISTORY AUDIT ===\n');

  // -------------------------------------------------------------
  // A. Prisma Migration Tracking (_prisma_migrations)
  // -------------------------------------------------------------
  console.log('--- A. _prisma_migrations Tracking Query ---');
  let dbMigrations: any[] = [];
  try {
    dbMigrations = await prisma.$queryRawUnsafe(`
      SELECT 
        id,
        checksum,
        finished_at,
        migration_name,
        logs,
        rolled_back_at,
        started_at,
        applied_steps_count
      FROM "_prisma_migrations"
      ORDER BY started_at ASC;
    `);
  } catch (err: any) {
    console.error('Error querying _prisma_migrations:', err.message);
  }

  // -------------------------------------------------------------
  // B. Migration Files on Disk
  // -------------------------------------------------------------
  console.log('\n--- B. Migration Files on Disk ---');
  const migrationsDir = path.resolve(__dirname, '../prisma/migrations');
  const diskMigrationDirs = fs
    .readdirSync(migrationsDir, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name)
    .sort();

  const diskMigrationsData: Array<{
    name: string;
    creates: string[];
    alters: string[];
    drops: string[];
    dependencies: string[];
    rawSql: string;
  }> = [];

  for (const dirName of diskMigrationDirs) {
    const sqlPath = path.join(migrationsDir, dirName, 'migration.sql');
    if (fs.existsSync(sqlPath)) {
      const sqlContent = fs.readFileSync(sqlPath, 'utf8');

      const creates: string[] = [];
      const alters: string[] = [];
      const drops: string[] = [];
      const dependencies: string[] = [];

      const lines = sqlContent.split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        // CREATE TABLE / TYPE / INDEX / EXTENSION
        const createMatch = trimmed.match(
          /CREATE\s+(TABLE|UNIQUE\s+INDEX|INDEX|TYPE|EXTENSION)\s+(?:IF\s+NOT\s+EXISTS\s+)?["']?([a-zA-Z0-9_]+)["']?/i,
        );
        if (createMatch) {
          creates.push(`${createMatch[1].toUpperCase()} ${createMatch[2]}`);
        }

        // ALTER TABLE
        const alterMatch = trimmed.match(
          /ALTER\s+TABLE\s+(?:ONLY\s+)?["']?([a-zA-Z0-9_]+)["']?\s+(.*)/i,
        );
        if (alterMatch) {
          alters.push(`${alterMatch[1]}: ${alterMatch[2].replace(/;$/, '').trim()}`);
        }

        // DROP TABLE / TYPE / INDEX
        const dropMatch = trimmed.match(
          /DROP\s+(TABLE|INDEX|TYPE)\s+(?:IF\s+EXISTS\s+)?["']?([a-zA-Z0-9_]+)["']?/i,
        );
        if (dropMatch) {
          drops.push(`${dropMatch[1].toUpperCase()} ${dropMatch[2]}`);
        }

        // REFERENCES (Foreign key dependencies)
        const refMatch = trimmed.match(/REFERENCES\s+["']?([a-zA-Z0-9_]+)["']?\s*\(([^)]+)\)/i);
        if (refMatch) {
          dependencies.push(`References ${refMatch[1]}(${refMatch[2]})`);
        }
      }

      diskMigrationsData.push({
        name: dirName,
        creates: Array.from(new Set(creates)),
        alters: alters.slice(0, 10), // keep top 10 for summary
        drops: Array.from(new Set(drops)),
        dependencies: Array.from(new Set(dependencies)),
        rawSql: sqlContent,
      });
    }
  }

  // -------------------------------------------------------------
  // C. Live Database Tables in public schema
  // -------------------------------------------------------------
  console.log('\n--- C. Live Database Tables (public) ---');
  const liveTablesRaw: Array<{ table_name: string }> = await prisma.$queryRawUnsafe(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    ORDER BY table_name ASC;
  `);
  const liveTableNames = new Set(liveTablesRaw.map((r) => r.table_name));

  const coreTableStatus: Array<{ table: string; exists: boolean; rowCount?: number }> = [];
  for (const table of CORE_TABLES) {
    const exists = liveTableNames.has(table);
    let rowCount: number | undefined = undefined;
    if (exists) {
      try {
        const countRes: any = await prisma.$queryRawUnsafe(
          `SELECT COUNT(*)::int as cnt FROM "${table}"`,
        );
        rowCount = countRes[0]?.cnt;
      } catch (err: any) {
        rowCount = -1; // table exists but query failed (e.g. permission/RLS)
      }
    }
    coreTableStatus.push({ table, exists, rowCount });
  }

  // -------------------------------------------------------------
  // D. TenantInvoiceSettings Constraints and Indexes
  // -------------------------------------------------------------
  console.log('\n--- D. TenantInvoiceSettings Inspection ---');
  let tisConstraints: any[] = [];
  let tisIndexes: any[] = [];
  try {
    tisConstraints = await prisma.$queryRawUnsafe(`
      SELECT 
        conname AS constraint_name,
        contype AS constraint_type,
        pg_get_constraintdef(c.oid) AS constraint_definition
      FROM pg_constraint c
      JOIN pg_class t ON c.conrelid = t.oid
      JOIN pg_namespace n ON t.relnamespace = n.oid
      WHERE n.nspname = 'public' AND t.relname = 'TenantInvoiceSettings';
    `);

    tisIndexes = await prisma.$queryRawUnsafe(`
      SELECT 
        indexname,
        indexdef
      FROM pg_indexes
      WHERE schemaname = 'public' AND tablename = 'TenantInvoiceSettings';
    `);
  } catch (err: any) {
    console.error('Error inspecting TenantInvoiceSettings:', err.message);
  }

  // -------------------------------------------------------------
  // E. Core Table Origin Analysis
  // -------------------------------------------------------------
  console.log('\n--- E. Core Table Origin Analysis ---');
  const dbAppliedMigrationNames = new Set(
    dbMigrations.filter((m) => m.finished_at !== null).map((m) => m.migration_name),
  );

  const coreTableOrigins: Array<{
    table: string;
    firstCreateMigration: string | null;
    recordedAsApplied: boolean;
    existsLive: boolean;
    finding: string;
  }> = [];

  for (const table of CORE_TABLES) {
    let firstCreate: string | null = null;
    for (const d of diskMigrationsData) {
      const createsTable = d.creates.some((c) => c.toLowerCase() === `table ${table.toLowerCase()}`);
      if (createsTable) {
        firstCreate = d.name;
        break;
      }
    }

    const recordedAsApplied = firstCreate ? dbAppliedMigrationNames.has(firstCreate) : false;
    const existsLive = liveTableNames.has(table);

    let finding = '';
    if (!firstCreate && existsLive) {
      finding = 'UNMIGRATED BASELINE: Exists live but never created by any migration file';
    } else if (firstCreate && !recordedAsApplied && existsLive) {
      finding = 'APPLIED EXTERNALLY: Created in migration file but not recorded in _prisma_migrations';
    } else if (firstCreate && recordedAsApplied && existsLive) {
      finding = 'NORMAL: Created by migration and tracked in _prisma_migrations';
    } else if (firstCreate && !existsLive) {
      finding = 'PENDING: Defined in migration file but not yet applied to live DB';
    } else {
      finding = 'ABSENT: Not in migration files, not in live DB';
    }

    coreTableOrigins.push({
      table,
      firstCreateMigration: firstCreate,
      recordedAsApplied,
      existsLive,
      finding,
    });
  }

  // -------------------------------------------------------------
  // F. Shadow Failure Root Cause Trace
  // -------------------------------------------------------------
  console.log('\n--- F. Shadow Failure Root Cause Trace ---');
  const invoiceCounterMigration = diskMigrationsData.find(
    (m) => m.name === '20260810110000_add_invoice_number_and_counter',
  );
  const invoiceReferences: string[] = [];
  if (invoiceCounterMigration) {
    const lines = invoiceCounterMigration.rawSql.split('\n');
    for (const l of lines) {
      if (/Invoice/i.test(l)) {
        invoiceReferences.push(l.trim());
      }
    }
  }

  // -------------------------------------------------------------
  // G. Schema vs Live DB
  // -------------------------------------------------------------
  console.log('\n--- G. Schema vs Live DB ---');
  const schemaPath = path.resolve(__dirname, '../prisma/schema.prisma');
  const schemaContent = fs.readFileSync(schemaPath, 'utf8');

  // Extract models from schema
  const modelRegex = /model\s+([A-Za-z0-9_]+)\s*\{([^}]*)\}/g;
  const schemaModels: Array<{ name: string; mappedTo?: string }> = [];
  let match;
  while ((match = modelRegex.exec(schemaContent)) !== null) {
    const modelName = match[1];
    const body = match[2];
    const mapMatch = body.match(/@@map\(["']([^"']+)["']\)/);
    schemaModels.push({
      name: modelName,
      mappedTo: mapMatch ? mapMatch[1] : modelName,
    });
  }

  const schemaTableNames = new Set(schemaModels.map((m) => m.mappedTo || m.name));
  const modelsMissingFromLive = schemaModels.filter(
    (m) => !liveTableNames.has(m.mappedTo || m.name),
  );
  const liveTablesMissingFromSchema = Array.from(liveTableNames).filter(
    (tbl) => tbl !== '_prisma_migrations' && !schemaTableNames.has(tbl),
  );

  // Communication models check
  const commModels = ['EmailAccount', 'EmailThread', 'EmailMessage', 'EmailAttachment'];
  const commStatus = commModels.map((m) => ({
    model: m,
    inSchema: schemaModels.some((sm) => sm.name === m),
    inLiveDb: liveTableNames.has(m),
    inMigrations: diskMigrationsData.some((dm) =>
      dm.creates.some((c) => c.toLowerCase() === `table ${m.toLowerCase()}`),
    ),
  }));

  // Build JSON summary payload
  const auditResults = {
    prismaMigrationsTable: dbMigrations,
    diskMigrationsCount: diskMigrationsData.length,
    diskMigrationsSummary: diskMigrationsData.map((d) => ({
      name: d.name,
      createsCount: d.creates.length,
      creates: d.creates,
      altersCount: d.alters.length,
      altersSample: d.alters,
      dropsCount: d.drops.length,
      drops: d.drops,
      dependencies: d.dependencies,
    })),
    liveTablesCount: liveTablesRaw.length,
    allLiveTables: Array.from(liveTableNames),
    coreTableStatus,
    tenantInvoiceSettings: {
      constraints: tisConstraints,
      indexes: tisIndexes,
    },
    coreTableOrigins,
    shadowFailureTrace: {
      migration: '20260810110000_add_invoice_number_and_counter',
      referencesToInvoice: invoiceReferences,
    },
    schemaVsLive: {
      totalSchemaModels: schemaModels.length,
      modelsMissingFromLive,
      liveTablesMissingFromSchema,
      commStatus,
    },
  };

  const outputPath = path.resolve(__dirname, '../../audit-migration-history-result.json');
  fs.writeFileSync(outputPath, JSON.stringify(auditResults, null, 2));
  console.log(`\nAudit finished successfully! Output written to: ${outputPath}`);

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error('Audit script encountered an error:', e);
  await prisma.$disconnect();
  process.exit(1);
});
