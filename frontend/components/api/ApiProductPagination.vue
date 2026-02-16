<!-- ApiProductPagination.vue -->
<script setup lang="ts">
import { inject, computed, ref, watch } from 'vue'

import { PAGINATION_PER_PAGE_OPTIONS } from '@/composables/api/useApiProducts'

const paginationOptions = PAGINATION_PER_PAGE_OPTIONS

interface Props {
  mode?: 'small' | 'large'
}
const props = withDefaults(defineProps<Props>(), {
  mode: 'large',
})

// ✅ Injecter le composable partagé
const cpsbProducts = inject('cpsbProducts') as ReturnType<
  typeof import('@/composables/api/useApiProducts').useApiProducts
>
const {
  currentPage,
  totalItems,
  itemsPerPage,
  totalPages,
  hasMoreItems,
  nextPage,
  prevPage,
  goToPage,
  refresh,
} = cpsbProducts

// Local state
const jumpToPageInput = ref<number | null>(null)

// Computed
const startItem = computed(() => {
  if (totalItems.value === 0) return 0
  return (currentPage.value - 1) * itemsPerPage.value + 1
})
const endItem = computed(() => {
  const end = currentPage.value * itemsPerPage.value
  return end > totalItems.value ? totalItems.value : end
})

const isValidPageNumber = computed(() => {
  return (
    jumpToPageInput.value !== null &&
    jumpToPageInput.value >= 1 &&
    jumpToPageInput.value <= totalPages.value
  )
})

// Calculer les numéros de page visibles (max 7 boutons)
// Les nombres négatifs représentent les ellipsis
const visiblePages = computed(() => {
  const maxVisible = 7
  const pages: number[] = []
  const total = totalPages.value
  const current = currentPage.value

  if (total <= maxVisible) {
    // Afficher toutes les pages
    for (let i = 1; i <= total; i++) {
      pages.push(i)
    }
  } else {
    // Logique pour afficher les pages autour de la page actuelle
    if (current <= 4) {
      // Début : 1 2 3 4 5 ... 16
      for (let i = 1; i <= 5; i++) pages.push(i)
      pages.push(-1) // Ellipsis (sera affiché comme "...")
      pages.push(total)
    } else if (current >= total - 3) {
      // Fin : 1 ... 12 13 14 15 16
      pages.push(1)
      pages.push(-1) // Ellipsis
      for (let i = total - 4; i <= total; i++) pages.push(i)
    } else {
      // Milieu : 1 ... 7 8 9 ... 16
      pages.push(1)
      pages.push(-1) // Ellipsis
      for (let i = current - 1; i <= current + 1; i++) pages.push(i)
      pages.push(-2) // Ellipsis (différent de -1 pour une clé unique)
      pages.push(total)
    }
  }

  return pages
})

// Methods
const goToFirstPage = async () => {
  if (currentPage.value !== 1) {
    await goToPage(1)
  }
}

const goToLastPage = async () => {
  if (currentPage.value !== totalPages.value) {
    await goToPage(totalPages.value)
  }
}

const handleItemsPerPageChange = async () => {
  // Note: Pour changer itemsPerPage, il faudrait l'exposer dans le composable
  // Pour l'instant, on recharge juste la page 1
  currentPage.value = 1
  await refresh()
}

const handleJumpToPage = async () => {
  if (isValidPageNumber.value && jumpToPageInput.value !== null) {
    await goToPage(jumpToPageInput.value)
    jumpToPageInput.value = null
  }
}

// Watcher pour réinitialiser jumpToPageInput quand la page change
watch(currentPage, () => {
  jumpToPageInput.value = null
})
</script>

<template>
  <div class="wrapper-pagination">
    <template v-if="mode === 'small'">
      <div class="mode-small">
        <button @click="prevPage" :disabled="currentPage === 1" class="btn-nav">⬅️</button>
        <span class="page-info">
          <span>{{ currentPage }}</span> | <span>{{ totalPages }}</span>
        </span>
        <button @click="nextPage" :disabled="!hasMoreItems" class="btn-nav">➡️</button>
      </div>
    </template>
    <template v-else>
      <div class="mode-large">
        <div class="pagination-info">
          <p>
            Affichage de <strong>{{ startItem }}</strong> à <strong>{{ endItem }}</strong> sur
            <strong>{{ totalItems }}</strong> produits
          </p>
          <p class="page-info">
            Page <strong>{{ currentPage }}</strong> / <strong>{{ totalPages }}</strong>
          </p>
        </div>

        <div class="pagination-controls">
          <button
            @click="goToFirstPage"
            :disabled="currentPage === 1"
            class="btn-nav"
            title="Première page"
          >
            ⏮️
          </button>
          <button @click="prevPage" :disabled="currentPage === 1" class="btn-nav">⬅️</button>
          <div class="page-numbers">
            <template v-for="page in visiblePages" :key="page">
              <span v-if="page < 0" class="ellipsis">...</span>
              <button
                v-else
                @click="goToPage(page)"
                :class="['btn-page', { active: page === currentPage }]"
              >
                {{ page }}
              </button>
            </template>
          </div>

          <button @click="nextPage" :disabled="!hasMoreItems" class="btn-nav">➡️</button>

          <button
            @click="goToLastPage"
            :disabled="!hasMoreItems"
            class="btn-nav"
            title="Dernière page"
          >
            ⏭️
          </button>
        </div>

        <div class="pagination-settings">
          <label>
            Éléments par page :
            <select v-model.number="itemsPerPage" @change="handleItemsPerPageChange">
              <!-- ✅ Utiliser les options depuis la constante -->
              <option v-for="option in paginationOptions" :key="option" :value="option">
                {{ option }}
              </option>
            </select>
          </label>

          <div class="jump-to-page">
            <label>
              Aller à la page :
              <input
                v-model.number="jumpToPageInput"
                type="number"
                :min="1"
                :max="totalPages"
                @keyup.enter="handleJumpToPage"
              />
            </label>
            <button @click="handleJumpToPage" :disabled="!isValidPageNumber">Aller</button>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.wrapper-pagination {
  font-size: medium;
  font-family: 'JetBrains Mono', 'Courier New', Courier, monospace;

  .mode-small {
    padding: 0.25rem;
    display: flex;
    gap: 0.25em;
    vertical-align: middle;
    .page-info {
      font-weight: 600;
      font-size: 1rem;
      min-width: 80px;
      text-align: center;
      span {
        color: #42b983;
      }
    }
    .btn-nav {
      padding: 0.1rem 0.25rem;
      background-color: white;
      cursor: pointer;
      transition: all 0.2s;
    }
    .btn-nav:hover:not(:disabled) {
      background-color: #42b983;
      color: white;
      border-color: #42b983;
    }
    .btn-nav:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }
  }

  .mode-large {
    padding: 1.5rem;
    background-color: #f8f9fa;
    border-radius: 8px;
    border: 1px solid #dee2e6;
    .pagination-info {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
      flex-wrap: wrap;
      gap: 0.5rem;
    }
    .pagination-info p {
      margin: 0;
      color: #495057;
      font-size: 0.875rem;
    }
    .page-info strong {
      color: #42b983;
      font-size: 1.1em;
    }
    .pagination-controls {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 1rem;
      flex-wrap: wrap;
    }
    .btn-nav {
      padding: 0.5rem 1rem;
      border: 1px solid #dee2e6;
      background-color: white;
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.2s;
    }
    .btn-nav:hover:not(:disabled) {
      background-color: #42b983;
      color: white;
      border-color: #42b983;
    }
    .btn-nav:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }
    .page-numbers {
      display: flex;
      gap: 0.25rem;
    }
    .btn-page {
      min-width: 2.5rem;
      padding: 0.5rem;
      border: 1px solid #dee2e6;
      background-color: white;
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-page:hover {
      background-color: #e9ecef;
    }

    .btn-page.active {
      background-color: #42b983;
      color: white;
      border-color: #42b983;
      font-weight: bold;
    }

    .btn-page:disabled {
      cursor: default;
      background-color: transparent;
      border-color: transparent;
    }

    .pagination-settings {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1rem;
      padding-top: 1rem;
      border-top: 1px solid #dee2e6;
    }

    .pagination-settings label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.875rem;
      color: #495057;
    }

    .pagination-settings select,
    .pagination-settings input {
      padding: 0.375rem 0.75rem;
      border: 1px solid #ced4da;
      border-radius: 4px;
      font-size: 0.875rem;
      background-color: white;
    }
    .pagination-settings1 select {
      cursor: pointer;
      padding-right: 2rem; /* ✅ Espace pour la flèche déroulante */
      appearance: none; /* ✅ Enlever le style natif */
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23333' d='M6 9L1 4h10z'/%3E%3C/svg%3E"); /* ✅ Flèche personnalisée */
      background-repeat: no-repeat;
      background-position: right 0.5rem center;
      background-size: 12px;
    }
    .pagination-settings select {
      min-width: 80px; /* ✅ Largeur minimale pour éviter la compression */
      cursor: pointer;
    }
    .pagination-settings input {
      width: 4rem;
      text-align: center;
    }

    .jump-to-page {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .jump-to-page button {
      padding: 0.375rem 0.75rem;
      border: 1px solid #42b983;
      background-color: #42b983;
      color: white;
      border-radius: 4px;
      cursor: pointer;
      font-size: 0.875rem;
    }

    .jump-to-page button:hover:not(:disabled) {
      background-color: #35a372;
      border-color: #35a372;
    }

    .jump-to-page button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }
}

/* Responsive */
@media (max-width: 768px) {
  .pagination-controls {
    font-size: 0.875rem;
  }

  .btn-nav {
    padding: 0.375rem 0.75rem;
  }

  .btn-page {
    min-width: 2rem;
    padding: 0.375rem;
  }

  .pagination-settings {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
