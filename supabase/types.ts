export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export interface Database {
  public: {
    Tables: {
      products: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          price: number;
          discount: number;
          image_urls: string[];
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          price: number;
          discount: number;
          image_urls: string[];
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          price?: number;
          discount?: number;
          image_urls?: string[];
          created_at?: string;
        };
      };
    };
    Views: {};
    Functions: {};
    Enums: {};
  };
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  discount: number;
  image_urls: string[];
  created_at: string;
  quantity?: number;
}