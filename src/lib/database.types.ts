// Types for the Supabase schema in supabase/migrations. Written by hand to match
// the migrations; regenerate with `supabase gen types typescript` if the schema changes.

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'out_for_delivery'
  | 'completed'
  | 'cancelled'
export type PaymentStatus = 'unpaid' | 'paid' | 'refunded'
export type FulfillmentType = 'pickup' | 'delivery'
export type CustomRequestStatus = 'new' | 'contacted' | 'quoted' | 'confirmed' | 'completed' | 'declined' | 'cancelled'
export type StaffRole = 'admin' | 'staff'

type CategoryRow = {
  id: string
  slug: string
  name: string
  tagline: string | null
  image_url: string | null
  sort_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

type ProductRow = {
  id: string
  category_id: string
  slug: string
  name: string
  description: string | null
  price: number
  unit: string
  image_url: string | null
  is_featured: boolean
  is_active: boolean
  is_available: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

type OrderRow = {
  id: string
  order_number: number
  customer_name: string
  customer_phone: string
  customer_email: string | null
  customer_phone_key: string
  fulfillment_type: FulfillmentType
  delivery_address: string | null
  requested_for: string | null
  notes: string | null
  subtotal: number
  currency: string
  status: OrderStatus
  payment_status: PaymentStatus
  created_at: string
  updated_at: string
}

type OrderItemRow = {
  id: string
  order_id: string
  product_id: string | null
  product_name: string
  unit: string
  unit_price: number
  quantity: number
  line_total: number
  created_at: string
}

type CustomCakeRequestRow = {
  id: string
  request_number: number
  customer_name: string
  customer_phone: string
  customer_email: string | null
  customer_phone_key: string
  event_date: string
  occasion: string | null
  flavour: string | null
  weight_kg: number | null
  servings: number | null
  tiers: number
  is_eggless: boolean
  message_on_cake: string | null
  design_notes: string | null
  budget: number | null
  fulfillment_type: FulfillmentType
  delivery_address: string | null
  status: CustomRequestStatus
  quoted_price: number | null
  staff_notes: string | null
  created_at: string
  updated_at: string
}

type StaffMemberRow = {
  user_id: string
  full_name: string
  role: StaffRole
  is_active: boolean
  created_at: string
  updated_at: string
}

type OrderStatusEventRow = {
  id: number
  order_id: string
  status: OrderStatus
  payment_status: PaymentStatus
  changed_by: string | null
  changed_at: string
}

type CustomerSummaryRow = {
  phone_key: string
  customer_name: string
  customer_phone: string
  customer_email: string | null
  order_count: number
  custom_request_count: number
  total_order_value: number
  first_seen_at: string
  last_seen_at: string
}

// Only the columns staff are granted are writable; the rest are omitted.
type CategoryWrite = {
  slug?: string
  name?: string
  tagline?: string | null
  image_url?: string | null
  sort_order?: number
  is_active?: boolean
}

type ProductWrite = {
  category_id?: string
  slug?: string
  name?: string
  description?: string | null
  price?: number
  unit?: string
  image_url?: string | null
  is_featured?: boolean
  is_active?: boolean
  is_available?: boolean
  sort_order?: number
}

export type Database = {
  public: {
    Tables: {
      categories: {
        Row: CategoryRow
        Insert: CategoryWrite & { slug: string; name: string }
        Update: CategoryWrite
        Relationships: []
      }
      products: {
        Row: ProductRow
        Insert: ProductWrite & { category_id: string; slug: string; name: string; price: number; unit: string }
        Update: ProductWrite
        Relationships: [
          {
            foreignKeyName: 'products_category_id_fkey'
            columns: ['category_id']
            isOneToOne: false
            referencedRelation: 'categories'
            referencedColumns: ['id']
          },
        ]
      }
      orders: {
        Row: OrderRow
        Insert: never
        Update: { status?: OrderStatus; payment_status?: PaymentStatus }
        Relationships: []
      }
      order_items: {
        Row: OrderItemRow
        Insert: never
        Update: never
        Relationships: [
          {
            foreignKeyName: 'order_items_order_id_fkey'
            columns: ['order_id']
            isOneToOne: false
            referencedRelation: 'orders'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'order_items_product_id_fkey'
            columns: ['product_id']
            isOneToOne: false
            referencedRelation: 'products'
            referencedColumns: ['id']
          },
        ]
      }
      custom_cake_requests: {
        Row: CustomCakeRequestRow
        Insert: never
        Update: { status?: CustomRequestStatus; quoted_price?: number | null; staff_notes?: string | null }
        Relationships: []
      }
      staff_members: {
        Row: StaffMemberRow
        Insert: never
        Update: never
        Relationships: []
      }
      order_status_events: {
        Row: OrderStatusEventRow
        Insert: never
        Update: never
        Relationships: [
          {
            foreignKeyName: 'order_status_events_order_id_fkey'
            columns: ['order_id']
            isOneToOne: false
            referencedRelation: 'orders'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: {
      customer_summaries: {
        Row: CustomerSummaryRow
        Relationships: []
      }
    }
    Functions: {
      place_order: {
        Args: {
          p_customer_name: string
          p_customer_phone: string
          p_items: Json
          p_customer_email?: string
          p_fulfillment_type?: FulfillmentType
          p_delivery_address?: string
          p_requested_for?: string
          p_notes?: string
        }
        Returns: Json
      }
      submit_custom_cake_request: {
        Args: {
          p_customer_name: string
          p_customer_phone: string
          p_event_date: string
          p_customer_email?: string
          p_occasion?: string
          p_flavour?: string
          p_weight_kg?: number
          p_servings?: number
          p_tiers?: number
          p_is_eggless?: boolean
          p_message_on_cake?: string
          p_design_notes?: string
          p_budget?: number
          p_fulfillment_type?: FulfillmentType
          p_delivery_address?: string
        }
        Returns: Json
      }
      admin_dashboard_stats: {
        Args: never
        Returns: Json
      }
    }
    Enums: {
      order_status: OrderStatus
      payment_status: PaymentStatus
      fulfillment_type: FulfillmentType
      custom_request_status: CustomRequestStatus
      staff_role: StaffRole
    }
    CompositeTypes: { [_ in never]: never }
  }
}

type PublicTables = Database['public']['Tables']
export type Category = PublicTables['categories']['Row']
export type Product = PublicTables['products']['Row']
export type Order = PublicTables['orders']['Row']
export type OrderItem = PublicTables['order_items']['Row']
export type CustomCakeRequest = PublicTables['custom_cake_requests']['Row']
export type StaffMember = PublicTables['staff_members']['Row']
export type OrderStatusEvent = PublicTables['order_status_events']['Row']
export type CustomerSummary = Database['public']['Views']['customer_summaries']['Row']
export type ProductInsert = PublicTables['products']['Insert']
export type CategoryInsert = PublicTables['categories']['Insert']
