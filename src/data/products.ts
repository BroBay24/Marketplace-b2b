export type ProductStatus = 'active' | 'inactive'
export interface Product {
  id: string
  sku: string
  name: string
  category: string
  unit: string
  price: number
  stock: number
  status: ProductStatus
}
export const products: Product[] = [
  {
    id: '1',
    sku: 'MNM-001',
    name: 'Air Mineral 600 ml',
    category: 'Minuman',
    unit: 'Karton',
    price: 48000,
    stock: 120,
    status: 'active',
  },
  {
    id: '2',
    sku: 'MNM-002',
    name: 'Teh Melati 350 ml',
    category: 'Minuman',
    unit: 'Karton',
    price: 72000,
    stock: 85,
    status: 'active',
  },
  {
    id: '3',
    sku: 'MKN-001',
    name: 'Beras Premium 5 kg',
    category: 'Sembako',
    unit: 'Karung',
    price: 78000,
    stock: 18,
    status: 'active',
  },
  {
    id: '4',
    sku: 'MKN-002',
    name: 'Mi Instan Goreng',
    category: 'Makanan',
    unit: 'Karton',
    price: 112000,
    stock: 64,
    status: 'active',
  },
  {
    id: '5',
    sku: 'MKN-003',
    name: 'Minyak Goreng 1 liter',
    category: 'Sembako',
    unit: 'Dus',
    price: 192000,
    stock: 12,
    status: 'active',
  },
  {
    id: '6',
    sku: 'MNM-003',
    name: 'Susu UHT Cokelat 250 ml',
    category: 'Minuman',
    unit: 'Karton',
    price: 126000,
    stock: 0,
    status: 'inactive',
  },
]
export const lowStockThreshold = 20
