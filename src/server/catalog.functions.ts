import { createServerFn } from '@tanstack/react-start'
import { setResponseHeader } from '@tanstack/react-start/server'
import { catalogProductIdSchema, catalogSearchSchema } from '../domain/catalog'
import { findCatalogProduct, queryCatalog } from './catalog.server'

// Public read endpoints. Never select account, address or verification documents.
export const listCatalog = createServerFn({ method: 'GET' })
  .validator(catalogSearchSchema)
  .handler(async ({ data }) => {
    setResponseHeader('Cache-Control', 'no-store')
    try {
      return await queryCatalog(data)
    } catch {
      console.error(
        JSON.stringify({ event: 'catalog_read_failed', operation: 'list' }),
      )
      throw new Error('Katalog belum dapat dimuat. Silakan coba lagi.')
    }
  })

export const getCatalogProduct = createServerFn({ method: 'GET' })
  .validator(catalogProductIdSchema)
  .handler(async ({ data }) => {
    setResponseHeader('Cache-Control', 'no-store')
    try {
      return await findCatalogProduct(data.id)
    } catch {
      console.error(
        JSON.stringify({ event: 'catalog_read_failed', operation: 'detail' }),
      )
      throw new Error('Produk belum dapat dimuat. Silakan coba lagi.')
    }
  })
