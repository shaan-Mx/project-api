<!-- components/ViewProduct.vue -->
<template>
  <div class="view-product-container">
    <ApiProductSearch />

    <ApiProducts />

    <ApiProductPagination />
  </div>
</template>

<script setup lang="ts">
import { provide } from 'vue'
import ApiProducts from '@/components/api/ApiProducts.vue'
import ApiProductSearch from '@/components/api/ApiProductSearch.vue'
import ApiProductPagination from '@/components/api/ApiProductPagination.vue'
import { useApiProducts } from '@/composables/api/useApiProducts'

// ✅ Créer le composable et le partager via provide
const cpsbProducts = useApiProducts({ itemsPerPage: 12 })
cpsbProducts.loadProducts()
provide('cpsbProducts', cpsbProducts)

// const API_BASE_URL = 'https://shaan-mx.github.io/myStorage/json/tuto-api-products-full.json'
// const API_BASE_URL = 'http://127.0.0.1:3658/m1/1198529-1193585-default/products'   // ApiDog
//const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))
</script>

<style scoped>
.view-product-container {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  padding: 2rem;
}
</style>
