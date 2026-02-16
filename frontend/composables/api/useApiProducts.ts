import { ref, computed } from 'vue'

import { apiProducts } from '@/api/products'
import type { Product } from '@/api/products'
// common api types
import { PAGINATION_PER_PAGE_OPTIONS } from '@/api/types'
import type {
  PaginationParams,
  PaginatedResponse,
  SearchCriteria,
  PaginationPerPage,
} from '@/api/types'

// ✅ Ré-exporter les types pour les composants
export type { Product, ProductVariant } from '@/api/products'
export type {
  PaginationParams,
  PaginatedResponse,
  PaginationPerPage,
  SearchCriteria,
  WhereCondition,
  WhereClause,
  OrderByClause,
  ComparisonOperator,
  LogicalOperator,
  SortDirection,
} from '@/api/types'
export { PAGINATION_PER_PAGE_OPTIONS } from '@/api/types' // ✅ Ré-exporter la constante

export interface UseProductsOptions {
  autoLoad?: boolean
  itemsPerPage?: PaginationPerPage
  initialPage?: number
}

export function useApiProducts(options: UseProductsOptions = {}) {
  // Init
  // Valeur par default de itemsPerPage doit correspondre au type
  const {
    autoLoad = false,
    itemsPerPage: initialItemsPerPage = PAGINATION_PER_PAGE_OPTIONS[0],
    initialPage = 1,
  } = options
  // State
  const loading = ref(false)
  const error = ref<string | null>(null)
  // Criteria
  // ✅ Stocker les derniers critères utilisés
  const lastCriteria = ref<SearchCriteria | null>(null)
  // Data
  const products = ref<Product[]>([])
  const currentProduct = ref<Product | null>(null)
  const totalItems = ref(0)
  const hasMoreItems = ref(false)
  // Pagination
  const currentPage = ref(initialPage)
  // ✅ Transformer itemsPerPage en ref pour pouvoir le modifier
  const itemsPerPage = ref<PaginationPerPage>(initialItemsPerPage)
  const currentOffset = computed(() => (currentPage.value - 1) * itemsPerPage.value)
  const totalPages = computed(() => Math.ceil(totalItems.value / itemsPerPage.value))

  // Methods
  const loadProducts = async (params?: PaginationParams) => {
    loading.value = true
    error.value = null
    try {
      const paginationParams = params || {
        limit: itemsPerPage.value,
        offset: currentOffset.value,
      }
      const response: PaginatedResponse<Product> = await apiProducts.getProducts(paginationParams)
      products.value = response.data
      totalItems.value = response.total
      hasMoreItems.value = response.hasMore
      return response
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Error loading Products'
      console.error(e)
      throw e
    } finally {
      loading.value = false
    }
  }

  // where?: WhereClause | orderBy?: OrderByClause[] | limit?: number | offset?: number
  const loadProductsByCriteria = async (
    criteria: Omit<SearchCriteria, 'limit' | 'offset'>,
    options?: {
      usePagination?: boolean
      limit?: number
      offset?: number
    },
  ) => {
    loading.value = true
    error.value = null
    try {
      const { usePagination = true, limit, offset } = options || {}
      // Construire les critères complets
      const fullCriteria: SearchCriteria = {
        ...criteria,
        // Utiliser la pagination du composable par défaut, ou les valeurs passées
        limit: limit !== undefined ? limit : usePagination ? itemsPerPage.value : undefined,
        offset: offset !== undefined ? offset : usePagination ? currentOffset.value : undefined,
      }
      lastCriteria.value = fullCriteria
      const response: PaginatedResponse<Product> = await apiProducts.searchProducts(fullCriteria)
      products.value = response.data
      totalItems.value = response.total
      hasMoreItems.value = response.hasMore
      return response
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Search error'
      throw e
    } finally {
      loading.value = false
    }
  }

  const loadProduct = async (id: number) => {
    loading.value = true
    error.value = null
    try {
      const product = await apiProducts.getProduct(id)
      currentProduct.value = product
      return product
    } catch (e) {
      error.value = e instanceof Error ? e.message : `Error loading Product with id:${id}`
      console.error(e)
      throw e
    } finally {
      loading.value = false
    }
  }

  const createProduct = async (product: Omit<Product, 'id'>) => {
    loading.value = true
    error.value = null
    try {
      const newProduct = await apiProducts.createProduct(product)
      // Ajouter à la liste si on est sur la dernière page et qu'elle n'est pas complète
      if (!hasMoreItems.value && products.value.length < itemsPerPage.value) {
        products.value.push(newProduct)
        totalItems.value++
      } else {
        // Recharger la dernière page
        const lastPage = Math.ceil((totalItems.value + 1) / itemsPerPage.value)
        currentPage.value = lastPage
        await loadProducts()
      }
      return newProduct
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Error creating Product'
      console.error(e)
      throw e
    } finally {
      loading.value = false
    }
  }

  const updateProduct = async (id: number, product: Partial<Product>) => {
    loading.value = true
    error.value = null
    try {
      const updatedProduct = await apiProducts.updateProduct(id, product)
      // Mettre à jour dans la liste si présent
      const index = products.value.findIndex((p) => p.id === id.toString())
      if (index !== -1) {
        products.value[index] = updatedProduct
      }
      // Mettre à jour currentProduct si c'est le même
      if (currentProduct.value?.id === id.toString()) {
        currentProduct.value = updatedProduct
      }
      return updatedProduct
    } catch (e) {
      error.value = e instanceof Error ? e.message : `Error updating Product with id:${id}`
      console.error(e)
      throw e
    } finally {
      loading.value = false
    }
  }

  const deleteProduct = async (id: number) => {
    loading.value = true
    error.value = null
    try {
      await apiProducts.deleteProduct(id)
      // Retirer de la liste
      products.value = products.value.filter((p) => p.id !== id.toString())
      totalItems.value--
      // Si la page actuelle est vide, revenir à la page précédente
      if (products.value.length === 0 && currentPage.value > 1) {
        currentPage.value--
        await loadProducts()
      }
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Erreur lors de la suppression du produit'
      console.error(e)
      throw e
    } finally {
      loading.value = false
    }
  }

  // Pagination
  const nextPage = async () => {
    if (hasMoreItems.value) {
      currentPage.value++
      if (lastCriteria.value) {
        // Recharger avec les critères de recherche
        await loadProductsByCriteria({
          where: lastCriteria.value.where,
          orderBy: lastCriteria.value.orderBy,
        })
      } else {
        // Chargement normal
        await loadProducts()
      }
    }
  }
  const prevPage = async () => {
    if (currentPage.value > 1) {
      currentPage.value--
      if (lastCriteria.value) {
        await loadProductsByCriteria({
          where: lastCriteria.value.where,
          orderBy: lastCriteria.value.orderBy,
        })
      } else {
        await loadProducts()
      }
    }
  }
  const goToPage = async (page: number) => {
    if (page >= 1 && page <= totalPages.value) {
      currentPage.value = page
      // Si on a des critères de recherche, les réutiliser
      if (lastCriteria.value) {
        await loadProductsByCriteria({
          where: lastCriteria.value.where,
          orderBy: lastCriteria.value.orderBy,
        })
      } else {
        await loadProducts()
      }
    }
  }

  const refresh = async () => {
    await loadProducts()
  }

  // Auto-load si demandé
  if (autoLoad) {
    loadProducts()
  }

  return {
    // State
    loading,
    error,
    // Data
    products,
    currentProduct,
    totalItems,
    hasMoreItems,
    lastCriteria,
    // Methods
    loadProducts,
    loadProductsByCriteria,
    loadProduct,
    createProduct,
    updateProduct,
    deleteProduct,
    refresh,
    // Pagination
    itemsPerPage,
    currentPage,
    totalPages,
    currentOffset,
    nextPage,
    prevPage,
    goToPage,
  }
}

/*
Pagination
    // Sans pagination (tous les résultats)
    const all = await useApiProducts.loadProducts()
    // Avec limit seulement (5 premiers)
    const first5 = await useApiProducts.loadProducts({ limit: 5 })
    // Avec limit et offset (5 résultats à partir du 10ème)
    const page3 = await useApiProducts.loadProducts({ limit: 5, offset: 10 })
*/
