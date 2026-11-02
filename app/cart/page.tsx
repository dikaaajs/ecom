"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Minus, Plus, ShoppingBag, Trash2, Truck, Download } from "lucide-react";
import { Footer } from "@/components/stack/footer";
import { useCart } from "@/components/cart/cart-provider";

type QuoteLine = {
  productId: string; quantity: number; available: boolean; reason?: string;
  title?: string; imageUrl?: string | null; type?: "PHYSICAL" | "DIGITAL";
  unitPrice?: string; lineTotal?: string;
};
type Quote = { valid: boolean; lines: QuoteLine[]; subtotal: string; shippingRequired: boolean; shipping: null; total: null; delivery: { physicalCount: number; digitalCount: number; totalWeightGram: number; shippingRequired: boolean; shippingStatus: string }; shippingOriginConfigured: boolean; checkoutReady: boolean; checkoutBlockers: string[] };

const rupiah = (value: number | string) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(Number(value));

export default function CartPage() {
  const { items, ready, setQuantity, removeItem, clearCart } = useCart();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [quoteStale, setQuoteStale] = useState(false);
  const load = useCallback(async (signal?: AbortSignal) => {
    if (!items.length) { setQuote(null); setError(""); setQuoteStale(false); return; }
    setQuoteStale(true);
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/cart/quote", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ items }), cache: "no-store", signal });
      if (!res.ok) throw new Error("Failed to fetch prices");
      const data = await res.json();
      if (!signal?.aborted) { setQuote(data); setQuoteStale(false); }
    } catch {
      if (!signal?.aborted) { setQuote(null); setError("Unable to verify product prices. Try again."); }
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [items]);
  useEffect(() => {
    if (!ready) return;
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [ready, load]);

  return (
    <div className="min-h-screen bg-[#f6f9ff] pt-28 font-satoshi">
      <main className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
        <Link href="/product" className="inline-flex items-center gap-2 text-sm font-semibold text-[#4f7cff] hover:underline"><ArrowLeft size={16} /> Continue shopping</Link>
        <div className="mb-8 mt-5 flex items-center justify-between gap-3">
          <div><h1 className="text-3xl font-extrabold text-slate-900">Your cart</h1><p className="mt-2 text-sm text-slate-500">Review the items you love before checkout.</p></div>
          {items.length > 0 && <button type="button" onClick={clearCart} className="text-sm font-semibold text-rose-600 hover:underline">Clear cart</button>}
        </div>
        {!ready ? <p>Loading cart...</p> : items.length === 0 ? (
          <div className="rounded-3xl border border-blue-100 bg-white px-5 py-20 text-center shadow-sm">
            <ShoppingBag className="mx-auto mb-5 text-[#4f7cff]" size={46} />
            <h2 className="text-xl font-bold">Your cart is empty</h2>
            <p className="mt-2 text-sm text-slate-500">Start exploring our collection to find something you like.</p>
            <Link href="/product" className="storefront-btn-primary mt-6 inline-flex rounded-xl px-6 py-3 text-sm font-bold">Browse products</Link>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="space-y-3">
              {loading && <p role="status" className="text-sm text-blue-600">Checking latest prices and stock...</p>}
              {error && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}<button onClick={() => void load()} className="ml-3 font-semibold underline">Retry</button></div>}
              {items.map(item => {
                const line = quote?.lines.find(l => l.productId === item.productId);
                return <div key={item.productId} className="flex gap-4 rounded-2xl border border-blue-100 bg-white p-4 shadow-sm">
                  <div className="h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-blue-50">
                    {line?.imageUrl && <img src={line.imageUrl} alt={line.title || "Product"} className="h-full w-full object-contain" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <Link href={"/product/" + item.productId} className="line-clamp-2 font-bold text-slate-900 hover:text-blue-600">{line?.title || item.productId}</Link>
                    {line && !line.available && <p className="mt-1 text-xs font-semibold text-rose-600">{line.reason}</p>}
                    {line?.available && <><p className="mt-1 text-xs text-slate-500">{line.type === "DIGITAL" ? <><Download size={12} className="mr-1 inline" />Digital · No shipping</> : <><Truck size={12} className="mr-1 inline" />Physical</>}</p><p className="mt-2 font-extrabold text-slate-900">{rupiah(line.lineTotal || 0)}</p></>}
                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex items-center rounded-lg border border-slate-200">
                        <button aria-label="Decrease quantity" type="button" className="p-2 disabled:opacity-40" disabled={item.quantity <= 1} onClick={() => setQuantity(item.productId, item.quantity - 1)}><Minus size={15} /></button>
                        <span className="w-9 text-center text-sm font-semibold">{item.quantity}</span>
                        <button aria-label="Increase quantity" type="button" className="p-2 disabled:opacity-40" disabled={item.quantity >= 99} onClick={() => setQuantity(item.productId, item.quantity + 1)}><Plus size={15} /></button>
                      </div>
                      <button aria-label="Remove item" type="button" className="p-2 text-rose-500 hover:text-rose-700" onClick={() => removeItem(item.productId)}><Trash2 size={17} /></button>
                    </div>
                  </div>
                </div>;
              })}
            </div>
            <aside className="h-fit rounded-2xl border border-blue-100 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-bold">Order summary</h2>
              <div className="mt-5 flex justify-between text-sm"><span className="text-slate-500">Subtotal</span><strong>{quote ? rupiah(quote.subtotal) : "—"}</strong></div>
              <div className="mt-3 flex justify-between gap-4 text-sm"><span className="text-slate-500">Physical items</span><strong>{quote && !quoteStale ? quote.delivery.physicalCount : "—"}</strong></div>
              <div className="mt-3 flex justify-between gap-4 text-sm"><span className="text-slate-500">Digital items</span><strong>{quote && !quoteStale ? quote.delivery.digitalCount : "—"}</strong></div>
              <div className="mt-3 flex justify-between gap-4 text-sm"><span className="text-slate-500">Total shipping weight</span><strong>{quote && !quoteStale ? (quote.delivery.shippingRequired ? new Intl.NumberFormat("id-ID").format(quote.delivery.totalWeightGram) + " gram" : "Not required") : "—"}</strong></div>
              <div className="mt-3 flex justify-between gap-4 text-sm"><span className="text-slate-500">Shipping cost</span><strong>{quote && !quoteStale ? (quote.delivery.shippingRequired ? "Pending courier rate" : rupiah(0)) : "—"}</strong></div>
              <div className="mt-4 border-t pt-4 text-sm text-slate-500">
                {!quote || quoteStale ? "Verifying delivery requirements..." : !quote.valid ? "Some items are unavailable. Please update the cart before checkout." : quote.delivery.shippingRequired ? "Physical items require a delivery address and courier rate at checkout." : "Digital-only items do not require shipping."}
              </div>
              {quote && !quoteStale && quote.delivery.shippingRequired && !quote.shippingOriginConfigured && (
                <div role="alert" className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-900"><strong>Shipping setup is incomplete.</strong> The store has not configured its shipping origin. Physical checkout is unavailable; please contact the store.</div>
              )}
              <button type="button" disabled className="mt-6 w-full cursor-not-allowed rounded-xl bg-slate-200 px-5 py-3 font-bold text-slate-500">
                Checkout coming soon
              </button>
              <p className="mt-3 text-xs leading-relaxed text-slate-500">Payments and order placement are not enabled yet. This summary uses server-verified catalog prices.</p>
            </aside>
          </div>
        )}
      </main>
      <Footer compact />
    </div>
  );
}
