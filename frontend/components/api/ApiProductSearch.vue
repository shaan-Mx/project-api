<!-- ApiProductSearch.vue -->
<script setup lang="ts">
import { ref, inject } from 'vue'
import type { WhereCondition } from '@/composables/api/useApiProducts'

// ✅ Injecter le composable partagé
const cpsbProducts = inject('cpsbProducts') as ReturnType<
  typeof import('@/composables/api/useApiProducts').useApiProducts
>

const showCriteria = ref(false)
const searchTitle = ref('')
const selectedCategory = ref('')
const minPrice = ref<number | null>(null)
const maxPrice = ref<number | null>(null)
const sortBy = ref('title-asc')

const toggleCriteria = () => {
  showCriteria.value = !showCriteria.value
}

const handleSearch = async () => {
  const conditions: WhereCondition[] = []
  // Filtre par titre
  if (searchTitle.value) {
    conditions.push({
      field: 'title',
      operator: 'LIKE',
      value: `%${searchTitle.value}%`,
    })
  }
  // Filtre par catégorie
  if (selectedCategory.value) {
    conditions.push({
      field: 'category',
      operator: '=',
      value: selectedCategory.value,
    })
  }
  // Filtre par prix min
  if (minPrice.value !== null) {
    conditions.push({
      field: 'price',
      operator: '>=',
      value: minPrice.value,
    })
  }
  // Filtre par prix max
  if (maxPrice.value !== null) {
    conditions.push({
      field: 'price',
      operator: '<=',
      value: maxPrice.value,
    })
  }
  // Tri
  const [field, direction] = sortBy.value.split('-') as [string, string]
  // ✅ Réinitialiser à la page 1 AVANT la recherche
  cpsbProducts.currentPage.value = 1
  // Define criteria directement via la méthode du composable
  await cpsbProducts.loadProductsByCriteria({
    where:
      conditions.length > 0
        ? {
            conditions,
            logic: 'AND',
          }
        : undefined,
    orderBy: [
      {
        field,
        direction: direction.toUpperCase() as 'ASC' | 'DESC',
      },
    ],
  })
}

const handleReset = async () => {
  searchTitle.value = ''
  selectedCategory.value = ''
  minPrice.value = null
  maxPrice.value = null
  sortBy.value = 'title-asc'
  cpsbProducts.currentPage.value = 1
  await cpsbProducts.loadProducts()
}

/* EXEMPLES
<div class="search-buttons">
      <button @click="searchExpensiveProducts">Prix > 100€</button>
      <button @click="searchByCategory('Electronics')">Catégorie: Electronics</button>
      <button @click="searchByTitle('Keyboard')">Titre contient 'Keyboard'</button>
      <button @click="searchComplexAND">Prix 50-200€ ET Electronics</button>
      <button @click="searchComplexOR">Electronics OU Books</button>
      <button @click="searchByCategories">Multiple catégories</button>
      <button @click="searchWithMultipleSort">Tri multiple</button>
    </div>

// Exemple 1 : Produits avec prix > 100
const searchExpensiveProducts = async () => {
  const criteria: SearchCriteria = {
    where: {
      conditions: [{ field: 'price', operator: '>', value: 100 }],
    },
    orderBy: [{ field: 'price', direction: 'DESC' }],
    limit: 10,
    offset: 0,
  }
  await loadProductsByCriteria(criteria)
}

// Exemple 2 : Produits dans une catégorie spécifique
const searchByCategory = async (category: string) => {
  const criteria: SearchCriteria = {
    where: {
      conditions: [{ field: 'category', operator: '=', value: category }],
    },
    orderBy: [{ field: 'title', direction: 'ASC' }],
  }
  await loadProductsByCriteria(criteria)
}

// Exemple 3 : Recherche avec LIKE
const searchByTitle = async (searchTerm: string) => {
  const criteria: SearchCriteria = {
    where: {
      conditions: [{ field: 'title', operator: 'LIKE', value: `%${searchTerm}%` }],
    },
    limit: 20,
  }
  await loadProductsByCriteria(criteria)
}

// Exemple 4 : Conditions multiples avec AND
const searchComplexAND = async () => {
  const criteria: SearchCriteria = {
    where: {
      conditions: [
        { field: 'price', operator: '>=', value: 50 },
        { field: 'price', operator: '<=', value: 200 },
        { field: 'category', operator: '=', value: 'Electronics' },
      ],
      logic: 'AND', // Toutes les conditions doivent être vraies
    },
    orderBy: [{ field: 'price', direction: 'ASC' }],
  }
  await loadProductsByCriteria(criteria)
}

// Exemple 5 : Conditions multiples avec OR
const searchComplexOR = async () => {
  const criteria: SearchCriteria = {
    where: {
      conditions: [
        { field: 'category', operator: '=', value: 'Electronics' },
        { field: 'category', operator: '=', value: 'Books' },
      ],
      logic: 'OR', // Au moins une condition doit être vraie
    },
  }
  await loadProductsByCriteria(criteria)
}

// Exemple 6 : IN operator
const searchByCategories = async () => {
  const criteria: SearchCriteria = {
    where: {
      conditions: [{ field: 'category', operator: 'IN', value: ['Electronics', 'Books', 'Toys'] }],
    },
  }
  await loadProductsByCriteria(criteria)
}

// Exemple 7 : Tri multiple
const searchWithMultipleSort = async () => {
  const criteria: SearchCriteria = {
    orderBy: [
      { field: 'category', direction: 'ASC' }, // D'abord par catégorie
      { field: 'price', direction: 'DESC' }, // Puis par prix décroissant
    ],
  }
  await loadProductsByCriteria(criteria)
}

// Exemple 8 : Recherche dans nested fields
const searchByVariantQuantity = async () => {
  const criteria: SearchCriteria = {
    where: {
      conditions: [{ field: 'variants.0.quantity', operator: '>', value: 10 }],
    },
  }
  await loadProductsByCriteria(criteria)
}
*/
</script>

<template>
  <div class="wrapper-search">
    <div class="header">
      <h2>Sélection & Affichage</h2>
      <div class="actions">
        <button @click="handleSearch" class="btn-search">🔍 Rechercher</button>
        <button @click="handleReset" class="btn-reset">🔄 Réinitialiser</button>
        <button @click="toggleCriteria" class="btn-toggle">
          {{ showCriteria ? '🔼' : '🔽' }}
        </button>
      </div>
    </div>
    <!-- ✅ Section critères avec transition -->
    <transition name="slide-fade">
      <div v-show="showCriteria" class="search-content">
        <div class="search-form">
          <div class="form-group">
            <label>Recherche par titre:</label>
            <input v-model="searchTitle" type="text" placeholder="Ex: Laptop" />
          </div>

          <div class="form-group">
            <label>Catégorie:</label>
            <select v-model="selectedCategory">
              <option value="">Toutes</option>
              <option value="Electronics">Electronics</option>
              <option value="Books">Books</option>
              <option value="Toys">Toys</option>
            </select>
          </div>

          <div class="form-group">
            <label>Prix min:</label>
            <input v-model.number="minPrice" type="number" placeholder="0" />
          </div>

          <div class="form-group">
            <label>Prix max:</label>
            <input v-model.number="maxPrice" type="number" placeholder="1000" />
          </div>

          <div class="form-group">
            <label>Trier par:</label>
            <select v-model="sortBy">
              <option value="title-asc">Titre (A-Z)</option>
              <option value="title-desc">Titre (Z-A)</option>
              <option value="price-asc">Prix (croissant)</option>
              <option value="price-desc">Prix (décroissant)</option>
            </select>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.wrapper-search {
  background-color: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #dee2e6;
  overflow: hidden;
  div.header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 1.5rem;
    background-color: #ffffff;
    border-bottom: 1px solid #dee2e6;
  }
  h2 {
    margin: 0;
    color: #2c3e50;
    font-size: 1.25rem;
  }
  .actions {
    display: flex;
    gap: 0.75rem;
    align-items: start;
  }
  .btn-action {
    padding: 0.5rem 1rem;
    border-radius: 4px;
    cursor: pointer;
    font-weight: 600;
    transition: all 0.2s;
  }
  .btn-toggle {
    vertical-align: top;
    border-radius: 4px;
    cursor: pointer;
    font-weight: 600;
    transition: all 0.2s;
    font-size: larger;
  }
  .btn-toggle:hover {
    background-color: #e1e6ea;
    color: white;
  }
  .btn-search {
    padding: 0.5rem 1.25rem;
    border: none;
    background-color: #42b983;
    color: white;
    border-radius: 4px;
    cursor: pointer;
    font-weight: 600;
    transition: background-color 0.2s;
  }
  .btn-search:hover {
    background-color: #35a372;
  }
  .btn-reset {
    padding: 0.5rem 1.25rem;
    border: none;
    background-color: #6c757d;
    color: white;
    border-radius: 4px;
    cursor: pointer;
    font-weight: 600;
    transition: background-color 0.2s;
  }
  .btn-reset:hover {
    background-color: #5a6268;
  }
}

/* ✅ Header avec titre et boutons alignés */

/* ✅ Boutons du header */

/* ✅ Contenu avec transition */
.search-content {
  padding: 1.5rem;
}

.search-form {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-weight: 600;
  font-size: 0.875rem;
  color: #495057;
}

.form-group input,
.form-group select {
  padding: 0.5rem;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 0.875rem;
  background-color: white;
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: #42b983;
  box-shadow: 0 0 0 3px rgba(66, 185, 131, 0.1);
}

.form-group select {
  cursor: pointer;
}

/* ✅ Animation de transition */
.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 0.3s ease;
}

.slide-fade-enter-from {
  transform: translateY(-20px);
  opacity: 0;
}

.slide-fade-leave-to {
  transform: translateY(-20px);
  opacity: 0;
}

/* ✅ Responsive */
@media (max-width: 768px) {
  .search-header {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
  }

  .search-header h2 {
    text-align: center;
  }

  .header-actions {
    flex-direction: column;
  }

  .header-actions button {
    width: 100%;
  }

  .search-form {
    grid-template-columns: 1fr;
  }
}
</style>
