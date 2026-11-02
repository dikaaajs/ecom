import { Prisma } from "@prisma/client";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const privateHeaders = { "Cache-Control": "private, no-store" };
const actions = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("PREPARE"),
    courier: z.string().trim().min(2).max(60),
    service: z.string().trim().min(1).max(80),
  }).strict(),
  z.object({
    action: z.literal("SHIP"),
    trackingNumber: z.string().trim().min(5).max(100).regex(/^[A-Za-z0-9][A-Za-z0-9\-/._ ]{3,98}[A-Za-z0-9]$/, "Nomor resi tidak valid"),
  }).strict(),
  z.object({ action: z.literal("DELIVER") }).strict(),
]);

class ShipmentActionError extends Error {
  constructor(message: string, public readonly status: number) { super(message); }
}

const jsonError = (error: string, status: number) =>
  NextResponse.json({ error }, { status, headers: privateHeaders });

const eligibleOrderStatuses = ["PAID", "PROCESSING"] as const;

/**
 * Shipment mutations are intentionally admin-only. No endpoint marks an order
 * as PAID, creates an order, changes the cost, or exposes private digital files.
 */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin") return jsonError("Forbidden", 403);

  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) return jsonError("Forbidden origin", 403);
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
    return jsonError("Expected application/json", 415);
  }

  let input: unknown;
  try {
    const raw = await request.text();
    if (raw.length > 2048) return jsonError("Permintaan terlalu besar", 413);
    input = JSON.parse(raw);
  } catch {
    return jsonError("JSON tidak valid", 400);
  }

  const parsed = actions.safeParse(input);
  if (!parsed.success) return jsonError("Periksa kembali aksi, kurir, layanan, atau nomor resi", 400);

  const { id } = await params;
  if (!id || id.length > 128) return jsonError("ID pesanan tidak valid", 400);

  try {
    const result = await prisma.$transaction(async tx => {
      const order = await tx.order.findUnique({
        where: { id },
        select: {
          id: true,
          status: true,
          items: {
            select: {
              productType: true,
              quantity: true,
              product: { select: { weight: true } },
            },
          },
          shipment: true,
        },
      });
      if (!order) throw new ShipmentActionError("Pesanan tidak ditemukan", 404);
      const physicalItems = order.items.filter(item => item.productType === "PHYSICAL");
      if (physicalItems.length === 0) {
        throw new ShipmentActionError("Pesanan digital-only tidak memerlukan pengiriman fisik", 422);
      }

      const action = parsed.data;
      if (action.action === "PREPARE") {
        if (!eligibleOrderStatuses.includes(order.status as typeof eligibleOrderStatuses[number])) {
          throw new ShipmentActionError("Hanya pesanan berstatus PAID/PROCESSING yang dapat dipersiapkan", 409);
        }
        if (order.shipment && order.shipment.status !== "PENDING") {
          throw new ShipmentActionError("Pengiriman sudah dipersiapkan atau diproses", 409);
        }
        let totalWeightGram = order.shipment?.totalWeightGram || 0;
        if (!order.shipment) {
          totalWeightGram = 0;
          for (const item of physicalItems) {
            const weight = item.product?.weight;
            if (!weight || !Number.isSafeInteger(weight) || weight < 1 ||
                !Number.isSafeInteger(item.quantity) || item.quantity < 1) {
              throw new ShipmentActionError("Berat produk tidak lengkap. Siapkan snapshot berat saat membuat order di Fase 6.", 422);
            }
            totalWeightGram += weight * item.quantity;
          }
          if (!Number.isSafeInteger(totalWeightGram) || totalWeightGram > 1_000_000) {
            throw new ShipmentActionError("Total berat tidak valid", 422);
          }
        }
        const shipment = order.shipment
          ? await tx.shipment.update({
              where: { id: order.shipment.id },
              data: { status: "READY", courier: action.courier, service: action.service },
            })
          : await tx.shipment.create({
              data: {
                orderId: order.id,
                status: "READY",
                totalWeightGram,
                courier: action.courier,
                service: action.service,
              },
            });
        if (order.status === "PAID") {
          await tx.order.update({ where: { id: order.id }, data: { status: "PROCESSING" } });
        }
        return { shipment, orderStatus: "PROCESSING" };
      }

      if (action.action === "SHIP") {
        if (order.status !== "PROCESSING" || order.shipment?.status !== "READY" ||
            !order.shipment.courier || !order.shipment.service) {
          throw new ShipmentActionError("Paket harus berstatus READY dan pesanan PROCESSING sebelum dikirim", 409);
        }
        const shipment = await tx.shipment.update({
          where: { id: order.shipment.id },
          data: {
            status: "SHIPPED", trackingNumber: action.trackingNumber,
            shippedAt: new Date(), deliveredAt: null,
          },
        });
        await tx.order.update({ where: { id: order.id }, data: { status: "SHIPPED" } });
        return { shipment, orderStatus: "SHIPPED" };
      }

      if (order.status !== "SHIPPED" || order.shipment?.status !== "SHIPPED" ||
          !order.shipment.trackingNumber) {
        throw new ShipmentActionError("Paket harus berstatus SHIPPED dan memiliki resi sebelum diterima", 409);
      }
      const shipment = await tx.shipment.update({
        where: { id: order.shipment.id },
        data: { status: "DELIVERED", deliveredAt: new Date() },
      });
      // A mixed physical/digital order must not be marked complete solely because
      // the physical package arrived; digital entitlement still needs fulfillment.
      const hasDigitalItem = order.items.some(item => item.productType === "DIGITAL");
      const orderStatus = hasDigitalItem ? "SHIPPED" : "COMPLETED";
      if (!hasDigitalItem) {
        await tx.order.update({ where: { id: order.id }, data: { status: "COMPLETED" } });
      }
      return { shipment, orderStatus };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

    return NextResponse.json({ success: true, data: result }, { headers: privateHeaders });
  } catch (error) {
    if (error instanceof ShipmentActionError) return jsonError(error.message, error.status);
    if (error instanceof Prisma.PrismaClientKnownRequestError && ["P2034", "P2002"].includes(error.code)) {
      return jsonError("Status pengiriman berubah. Muat ulang detail pesanan lalu coba lagi.", 409);
    }
    console.error("Admin shipment mutation failed", error);
    return jsonError("Gagal memperbarui pengiriman", 500);
  }
}
