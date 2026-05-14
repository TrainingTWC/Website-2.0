export type ProductType = "beans" | "bags" | "merch";
export type RoastLevel = "light" | "medium" | "medium-dark" | "dark";
export type StockStatus = "in-stock" | "out-of-stock" | "low-stock";

export interface Product {
  _id: string;
  _creationTime: number;
  name: string;
  description: string;
  type: ProductType;
  category: string;
  price: number;
  imageUrl: string;
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
