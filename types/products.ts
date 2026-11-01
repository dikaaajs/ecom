export interface ProductsType<T = unknown> {
  success: boolean;
  data: T[];
  count: number;
}
