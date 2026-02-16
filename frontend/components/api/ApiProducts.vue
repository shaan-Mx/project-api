<!-- ApiProducts.vue -->
<script setup lang="ts">
import { inject } from 'vue'
import { type Product } from '@/composables/api/useApiProducts'
import ApiProductPagination from '@/components/api/ApiProductPagination.vue'

interface Props {
  limit?: number
  page?: number
}
const props = withDefaults(defineProps<Props>(), {
  limit: 10,
  page: 1,
})

// ✅ Injecter le composable partagé
const {
  //=== State
  loading,
  error,
  //=== Data
  products,
  //currentProduct,
  totalItems,
  //hasMoreItems,
  //lastCriteria,
  //=== Methods
  //loadProducts,
  //loadProductsByCriteria,
  //loadProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  //refresh,
  //=== Pagination
  //itemsPerPage,
  //currentPage,
  //totalPages,
  //currentOffset,
  //nextPage,
  //prevPage,
  //goToPage,
} = inject('cpsbProducts') as ReturnType<
  typeof import('@/composables/api/useApiProducts').useApiProducts
>

/*
  ACTIONS
*/
const handleCreate = async () => {
  const newProduct: Omit<Product, 'id'> = {
    title: `Product ${Date.now()}`,
    description: 'Description',
    images: [],
    category: 'Electronics',
    variants: [],
    price: 99.99,
    tags: [],
  }
  await createProduct(newProduct)
}

const handleUpdate = async (product: Product) => {
  await updateProduct(Number(product.id), {
    price: product.price + 10,
  })
}

const handleDelete = async (id: string) => {
  if (confirm('Supprimer ?')) {
    await deleteProduct(Number(id))
  }
}

// const toArray = <T,>(item: T | T[]): T[] => (Array.isArray(item) ? item : [item])
</script>

<template>
  <div class="wrapper-products">
    <div class="products-header">
      <h2>Produits ({{ totalItems }})</h2>
      <ApiProductPagination mode="small" />
      <button @click="handleCreate" class="btn-add">➕ Ajouter</button>
    </div>

    <div v-if="loading" class="loading">Chargement...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <div v-else>
      <div class="products-list">
        <div v-for="product in products" :key="product.id" class="product-card">
          <h3>{{ product.title }}</h3>
          <p class="description">{{ product.description }}</p>
          <p class="category">Catégorie: {{ product.category }}</p>
          <p class="price">{{ product.price }}€</p>
          <div class="actions">
            <button @click="handleUpdate(product)">✏️ +10€</button>
            <button @click="handleDelete(product.id)" class="btn-delete">🗑️ Supprimer</button>
          </div>
        </div>
      </div>
    </div>
    <ApiProductPagination mode="small" />
  </div>
</template>

<style scoped>
.wrapper-products {
  background-color: white;
  padding: 1rem;
  border-radius: 8px;
  border: 1px solid #ddd;
}

.products-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.btn-add {
  background-color: #28a745;
  color: white;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.products-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.product-card {
  border: 1px solid #ddd;
  padding: 1rem;
  border-radius: 8px;
}

.description {
  color: #666;
  font-size: 0.875rem;
}

.category {
  color: #888;
  font-size: 0.875rem;
}

.price {
  font-size: 1.25rem;
  font-weight: bold;
  color: #42b983;
  margin: 0.5rem 0;
}

.actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
}

.actions button {
  flex: 1;
  padding: 0.5rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.875rem;
}

.btn-delete {
  background-color: #dc3545;
  color: white;
}

.pagination {
  display: flex;
  gap: 1rem;
  align-items: center;
  justify-content: center;
}

.pagination button {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  background-color: #42b983;
  color: white;
  cursor: pointer;
}

.pagination button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.loading,
.error {
  padding: 2rem;
  text-align: center;
}

.error {
  color: red;
  background-color: #fee;
  border-radius: 4px;
}
</style>
