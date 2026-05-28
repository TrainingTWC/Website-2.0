export type ProductType = "beans" | "bags" | "merch";
export type RoastLevel = "light" | "medium" | "medium-dark" | "dark";
export type StockStatus = "in-stock" | "out-of-stock" | "low-stock";

// â”€â”€ Two-tier taxonomy â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export type MainCategory = "coffee" | "merch";

export type CoffeeSubCategory = "beans" | "ecb" | "brewing-tools";
export type MerchSubCategory =
  | "drinkware"
  | "bags"
  | "keychains"
  | "chocolates-nuts"
  | "brewing-tools";

export type SubCategory = CoffeeSubCategory | MerchSubCategory;

export const MAIN_CATEGORIES: { value: MainCategory; label: string }[] = [
  { value: "coffee", label: "Coffee" },
  { value: "merch", label: "Merch" },
];

export const SUBCATEGORIES: Record<MainCategory, { value: SubCategory; label: string }[]> = {
  coffee: [
    { value: "beans", label: "Beans" },
    { value: "ecb", label: "Easy Coffee Bags" },
    { value: "brewing-tools", label: "Brewing Tools" },
  ],
  merch: [
    { value: "drinkware", label: "Drinkware" },
    { value: "bags", label: "Bags" },
    { value: "keychains", label: "Keychains & Accessories" },
    { value: "chocolates-nuts", label: "Chocolates & Nuts" },
    { value: "brewing-tools", label: "Brewing Tools" },
  ],
};

/** Derive a (mainCategory, subCategory) pair for a product, honouring explicit
 *  fields when present and falling back to the legacy `type` enum so the rest
 *  of the codebase stays in sync until every record is backfilled. */
export function resolveTaxonomy(p: {
  type: ProductType;
  mainCategory?: MainCategory;
  subCategory?: SubCategory;
}): { mainCategory: MainCategory; subCategory: SubCategory } {
  const mainCategory: MainCategory =
    p.mainCategory ?? (p.type === "merch" ? "merch" : "coffee");
  const subCategory: SubCategory =
    p.subCategory ??
    (p.type === "beans" ? "beans" : p.type === "bags" ? "ecb" : "drinkware");
  return { mainCategory, subCategory };
}

export interface Product {
  _id: string;
  _creationTime: number;
  name: string;
  description: string;
  type: ProductType;
  category: string;
  /** New: high-level taxonomy. Optional during the rollout â€” derive via `resolveTaxonomy`. */
  mainCategory?: MainCategory;
  /** New: sub-category within the main bucket. Optional during the rollout. */
  subCategory?: SubCategory;
  price: number;
  imageUrl: string;
  modelUrl?: string;
  imageBlur?: string;
  tags: string[];
  roastLevel?: RoastLevel;
  origin?: string;
  weight?: string;
  flavorNotes: string[];
  stockStatus: StockStatus;
  stockQty?: number;
  lowStockThreshold?: number;
  rating?: number;
  reviewCount?: number;
  maxOrderQtyOverride?: number;
}

export interface Session {
  _id: string;
  _creationTime: number;
  answers: any;
  recommendations: string[];
  completed: boolean;
  converted: boolean;
}

export interface Rule {
  _id: string;
  _creationTime: number;
  condition: any;
  resultProductIds: string[];
}

export interface RecommendationResult {
  primaryProductIds: string[];
  crossSellProductIds: string[];
  explanation: string;
}

