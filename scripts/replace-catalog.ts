import { Prisma, PrismaClient } from "@prisma/client";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import catalog from "../data/retail-catalog.json";

const db = new PrismaClient({ datasourceUrl: process.env.DIRECT_URL || process.env.DATABASE_URL });
const apply = process.argv.includes("--apply");
const slug = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-$/, "");

async function main() {
  if (new Set(catalog.products.map(p => p.slug)).size !== catalog.products.length) throw Error("Duplicate slugs");
  for (const p of catalog.products) {
    if (!Number.isSafeInteger(p.price) || p.price <= 0 || !p.imageUrl.startsWith("https://resource.logitech.com/")) {
      throw Error("Invalid catalog entry: " + p.slug);
    }
  }
  console.log(JSON.stringify({ mode: apply ? "replace" : "preview", existing: await db.product.count(), incoming: catalog.products.length, stockPerProduct: 10 }));
  if (!apply) return;

  // Validate all images before touching the database.
  await Promise.all(catalog.products.map(async p => {
    const response = await fetch(p.imageUrl, { signal: AbortSignal.timeout(30000) });
    if (!response.ok || !response.headers.get("content-type")?.startsWith("image/")) throw Error("Image unavailable: " + p.slug);
    await response.arrayBuffer();
  }));
  const backupDir = resolve(".catalog-backups");
  await mkdir(backupDir, { recursive: true });
  const backupPath = resolve(backupDir, `catalog-${new Date().toISOString().replace(/[:.]/g, "-")}.json`);

  await db.$transaction(async tx => {
    // Refuse to break downloads for previously purchased digital products.
    const purchasedDigital = await tx.product.count({ where: { digitalAsset: { isNot: null }, orderItems: { some: {} } } });
    if (purchasedDigital) throw Error("Purchased digital products must be archived separately before replacement");
    const previous = await tx.product.findMany({ include: { images: true, tags: true, category: true, digitalAsset: true } });
    const ordersBefore = await tx.order.count();
    const itemsBefore = await tx.orderItem.count();
    await writeFile(backupPath, JSON.stringify({ savedAt: new Date(), products: previous }, null, 2), { flag: "wx" });

    // Images/assets cascade; order-item title, price and totals remain intact.
    const removed = await tx.product.deleteMany();
    await tx.category.deleteMany({ where: { products: { none: {} } } });
    await tx.tag.deleteMany({ where: { products: { none: {} } } });
    for (const p of catalog.products) {
      await tx.product.create({ data: {
        slug: p.slug, title: p.title, description: p.description, price: p.price,
        stock: 10, type: "PHYSICAL", weight: p.weight, imageUrl: p.imageUrl, isPublished: true,
        images: { create: { url: p.imageUrl } },
        category: { connectOrCreate: { where: { slug: slug(p.category) }, create: { slug: slug(p.category), name: p.category } } },
        tags: { connectOrCreate: { where: { slug: "logitech" }, create: { slug: "logitech", name: "Logitech", color: "BLUE" } } },
      } });
    }
    if (await tx.order.count() !== ordersBefore || await tx.orderItem.count() !== itemsBefore) throw Error("Order preservation check failed");
    console.log(JSON.stringify({ removed: removed.count, created: catalog.products.length, ordersPreserved: ordersBefore, orderItemsPreserved: itemsBefore }));
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, timeout: 60000 });
  console.log("Committed. Local backup: " + backupPath);
}

main().catch(error => {
  console.error("Catalog replacement failed:", error instanceof Error ? error.message : "Unknown error");
  process.exitCode = 1;
}).finally(() => db.$disconnect());
