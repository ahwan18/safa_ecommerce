// User Types
export interface User {
  id: string | number
  email: string
  fullName: string
  role: 'customer' | 'admin'
  status: 'active' | 'inactive' | 'suspended'
  phone?: string
  avatarUrl?: string
  createdAt: Date
  updatedAt: Date
}

export interface CustomerProfile extends User {
  businessName?: string
  address: string
  city: string
  province: string
  postalCode: string
  country: string
  companyType: 'personal' | 'business' | 'corporate'
  totalOrders: number
  totalSpent: number
  loyaltyPoints: number
}

export interface AdminUser extends User {
  permissionLevel: 'viewer' | 'editor' | 'manager' | 'owner'
  canManageUsers: boolean
  canManageProducts: boolean
  canManageOrders: boolean
  canManageContent: boolean
  canManageSettings: boolean
  canViewAnalytics: boolean
  lastLogin?: Date
}

export interface AuthSession {
  user: User | null
  isLoggedIn: boolean
  isAdmin: boolean
  token?: string
}

// Product Types
export interface Product {
  id: string
  name: string
  description: string
  category: 'kaos' | 'tote' | 'hoodie' | 'jersey' | 'jasa'
  price: number
  image: string
  printMethods: ('sablon' | 'dtf' | 'offset')[]
  minOrder: number
  stock?: number
}

// Cart Types
export interface CartItem {
  id: string
  productId: string
  quantity: number
  selectedMethod: 'sablon' | 'dtf' | 'offset'
  customization?: {
    design?: File
    designUrl?: string
    notes?: string
  }
}

// Shipping Types
export interface OrderShippingInfo {
  courier: string
  courierName: string
  service: string
  description: string
  cost: number
  etd: string
  destinationCityId: string
  destinationLabel: string
  weightGrams: number
}

// Order Types
export interface Order {
  id: string
  orderNumber: string
  userId: string
  items: OrderItem[]
  subtotal?: number
  shippingCost?: number
  shippingInfo?: OrderShippingInfo
  total: number
  status: 'pending' | 'processing' | 'ready' | 'shipped' | 'delivered' | 'cancelled'
  paymentStatus: 'pending' | 'paid' | 'failed'
  shippingAddress: Address
  createdAt: Date
  updatedAt: Date
  notes?: string
}

export interface OrderItem {
  productId: string
  productName: string
  quantity: number
  price: number
  selectedMethod: string
  customization?: {
    designUrl?: string
    notes?: string
  }
}

// Address Types
export interface Address {
  name: string
  phone: string
  email: string
  street: string
  city: string
  province: string
  postalCode: string
}

// Notification Types
export type NotificationType = 'order' | 'payment' | 'design' | 'account' | 'system'
export type NotificationRole = 'customer' | 'admin'

export interface AppNotification {
  id: string
  userId: string          // target user id, or 'admin' for admin notifications
  role: NotificationRole
  title: string
  message: string
  type: NotificationType
  referenceId?: string    // order id or other entity id
  referenceUrl?: string   // where to navigate on click
  isRead: boolean
  createdAt: string       // ISO string
}

// Review Types
export interface Review {
  id: string
  userId: string
  userFullName: string
  orderId: string
  productId: string
  productName: string
  rating: number           // 1–5
  reviewText: string
  reviewImageUrl?: string  // base64 or object URL
  isVisible: boolean
  createdAt: string        // ISO string
  updatedAt: string
}

// CMS Content Types
export interface CMSContent {
  id: string
  section_name: 'hero' | 'services' | 'about' | 'contact' | 'pricing'
  content: Record<string, any>
  updated_at?: string
}

// Admin Analytics Types
export interface AnalyticsData {
  totalOrders: number
  totalRevenue: number
  totalCustomers: number
  ordersByStatus: Record<string, number>
  revenueByDate: Array<{ date: string; revenue: number }>
  topProducts: Array<{ name: string; sales: number }>
}
