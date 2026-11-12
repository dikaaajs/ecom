/** Browser-only session reference; never store payment credentials or buyer order secrets in URLs. */
export const CHECKOUT_STORAGE_KEY = "ecom-checkout-session-v1";
export type CheckoutSession = {
  orderId: string;
  orderNumber: string;
  accessToken: string;
  redirectUrl: string;
  sandbox: boolean;
};
