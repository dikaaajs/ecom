export type DeliveryLine = {
  productId: string;
  type: "PHYSICAL" | "DIGITAL";
  quantity: number;
  weightGram: number;
};

export function summarizeDelivery(items: DeliveryLine[]) {
  const physical = items.filter(item => item.type === "PHYSICAL");
  const digital = items.filter(item => item.type === "DIGITAL");
  const totalWeightGram = physical.reduce((total, item) => total + item.weightGram * item.quantity, 0);
  return {
    physicalCount: physical.reduce((total, item) => total + item.quantity, 0),
    digitalCount: digital.reduce((total, item) => total + item.quantity, 0),
    shippingRequired: physical.length > 0,
    addressRequired: physical.length > 0,
    totalWeightGram,
    shippingCost: physical.length > 0 ? null : "0.00",
    shippingStatus: physical.length > 0 ? "RATE_UNAVAILABLE" : "NOT_REQUIRED",
    digitalDeliveryStatus: digital.length > 0 ? "AWAITING_VERIFIED_PAYMENT" : "NOT_APPLICABLE",
  };
}
