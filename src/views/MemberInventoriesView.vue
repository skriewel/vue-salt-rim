<script setup lang="ts">
import { computed, ref } from "vue";
import type { components } from "@/api/api";
import AppState from "@/AppState";
import BarAssistantClient from "@/api/BarAssistantClient";
import MemberInventoryClient, {
    type MemberInventory,
    type MemberInventoryCocktail,
    type MemberInventoryIngredient,
} from "@/api/MemberInventoryClient";
import EmptyState from "@/components/EmptyState.vue";
import OverlayLoader from "@/components/OverlayLoader.vue";
import PageHeader from "@/components/PageHeader.vue";
import { useTitle } from "@/composables/title";
import { useSaltRimToast } from "@/composables/toast";

type Ingredient = components["schemas"]["Ingredient"];

const appState = new AppState();
const toast = useSaltRimToast();
const inventories = ref<MemberInventory[]>([]);
const selectedInventoryId = ref<number | null>(null);
const ingredients = ref<MemberInventoryIngredient[]>([]);
const cocktails = ref<MemberInventoryCocktail[]>([]);
const ingredientSearch = ref("");
const ingredientSearchResults = ref<Ingredient[]>([]);
const isLoading = ref(false);
const isSearching = ref(false);

useTitle("My Shelf");

const selectedInventory = computed(() => inventories.value.find((inventory) => inventory.id === selectedInventoryId.value) ?? null);
const currentIngredientIds = computed(() => new Set(ingredients.value.map((ingredient) => ingredient.id)));
const availableSearchResults = computed(() => ingredientSearchResults.value.filter((ingredient) => !currentIngredientIds.value.has(ingredient.id)));

async function loadInventories() {
    isLoading.value = true;
    try {
        inventories.value = (await MemberInventoryClient.getInventories(appState.user.id)).data ?? [];
        if (inventories.value.length > 0) {
            const myShelf = inventories.value.find((inventory) => inventory.name.toLowerCase() === "my shelf");
            selectedInventoryId.value = myShelf?.id ?? inventories.value[0].id;
            await loadSelectedInventory();
        }
    } catch (e: any) {
        toast.error(e.message ?? "Unable to load personal inventories.");
    } finally {
        isLoading.value = false;
    }
}

async function loadSelectedInventory() {
    if (selectedInventoryId.value === null) {
        ingredients.value = [];
        cocktails.value = [];
        return;
    }

    isLoading.value = true;
    ingredientSearch.value = "";
    ingredientSearchResults.value = [];
    try {
        const [ingredientResponse, cocktailResponse] = await Promise.all([
            MemberInventoryClient.getIngredients(appState.user.id, selectedInventoryId.value),
            MemberInventoryClient.getCocktails(appState.user.id, selectedInventoryId.value),
        ]);
        ingredients.value = ingredientResponse.data ?? [];
        cocktails.value = cocktailResponse.data ?? [];
    } catch (e: any) {
        toast.error(e.message ?? "Unable to load inventory.");
    } finally {
        isLoading.value = false;
    }
}

async function searchIngredients() {
    const query = ingredientSearch.value.trim();
    if (query.length < 2) {
        ingredientSearchResults.value = [];
        return;
    }

    isSearching.value = true;
    try {
        ingredientSearchResults.value =
            (
                await BarAssistantClient.getIngredients({
                    "filter[name]": query,
                    sort: "name",
                    per_page: 20,
                })
            )?.data ?? [];
    } catch (e: any) {
        toast.error(e.message ?? "Unable to search ingredients.");
    } finally {
        isSearching.value = false;
    }
}

async function addIngredient(ingredient: Ingredient) {
    if (selectedInventoryId.value === null) {
        return;
    }

    try {
        await MemberInventoryClient.addIngredients(appState.user.id, selectedInventoryId.value, [ingredient.id]);
        await loadSelectedInventory();
        toast.default(`${ingredient.name} added to ${selectedInventory.value?.name ?? "inventory"}.`);
    } catch (e: any) {
        toast.error(e.message ?? "Unable to add ingredient.");
    }
}

async function removeIngredient(ingredient: MemberInventoryIngredient) {
    if (selectedInventoryId.value === null) {
        return;
    }

    try {
        await MemberInventoryClient.removeIngredients(appState.user.id, selectedInventoryId.value, [ingredient.id]);
        await loadSelectedInventory();
        toast.default(`${ingredient.name} removed from ${selectedInventory.value?.name ?? "inventory"}.`);
    } catch (e: any) {
        toast.error(e.message ?? "Unable to remove ingredient.");
    }
}

loadInventories();
</script>

<template>
    <PageHeader>My Shelf</PageHeader>

    <div class="member-inventory-page">
        <OverlayLoader v-if="isLoading" />

        <EmptyState v-if="!isLoading && inventories.length === 0">
            No personal inventories are available for this bar.
        </EmptyState>

        <template v-else-if="inventories.length > 0">
            <div v-if="inventories.length > 1" class="inventory-selector block-container block-container--padded">
                <label for="member-inventory">Inventory</label>
                <select id="member-inventory" v-model="selectedInventoryId" class="form-select" @change="loadSelectedInventory">
                    <option v-for="inventory in inventories" :key="inventory.id" :value="inventory.id">
                        {{ inventory.name }}
                    </option>
                </select>
            </div>

            <div class="inventory-grid">
                <section>
                    <h3 class="page-subtitle">{{ selectedInventory?.name ?? "Inventory" }} ingredients</h3>

                    <div class="block-container block-container--padded ingredient-search">
                        <div class="ingredient-search__controls">
                            <input
                                v-model="ingredientSearch"
                                class="form-input"
                                type="search"
                                placeholder="Search ingredients to add"
                                @keyup.enter="searchIngredients"
                            />
                            <button type="button" class="button button--dark" :disabled="isSearching" @click="searchIngredients">
                                Search
                            </button>
                        </div>

                        <div v-if="availableSearchResults.length > 0" class="inventory-list ingredient-search__results">
                            <div v-for="ingredient in availableSearchResults" :key="ingredient.id" class="inventory-list__item">
                                <RouterLink :to="{ name: 'ingredients.show', params: { id: ingredient.slug } }">{{ ingredient.name }}</RouterLink>
                                <button type="button" class="button button--outline" @click="addIngredient(ingredient)">Add</button>
                            </div>
                        </div>
                    </div>

                    <div v-if="ingredients.length > 0" class="inventory-list">
                        <div v-for="ingredient in ingredients" :key="ingredient.id" class="block-container inventory-list__item">
                            <RouterLink :to="{ name: 'ingredients.show', params: { id: ingredient.slug } }">{{ ingredient.name }}</RouterLink>
                            <button type="button" class="button button--outline" @click="removeIngredient(ingredient)">Remove</button>
                        </div>
                    </div>
                    <EmptyState v-else-if="!isLoading">No ingredients in this inventory.</EmptyState>
                </section>

                <section>
                    <h3 class="page-subtitle">Cocktails I can make</h3>
                    <div v-if="cocktails.length > 0" class="inventory-list">
                        <RouterLink
                            v-for="cocktail in cocktails"
                            :key="cocktail.id"
                            class="block-container inventory-list__item inventory-list__item--cocktail"
                            :to="{ name: 'cocktails.show', params: { id: cocktail.slug } }"
                        >
                            <span>
                                <strong>{{ cocktail.name }}</strong>
                                <small v-if="cocktail.short_ingredients?.length">{{ cocktail.short_ingredients.join(", ") }}</small>
                            </span>
                        </RouterLink>
                    </div>
                    <EmptyState v-else-if="!isLoading">No cocktails can currently be made from this inventory.</EmptyState>
                </section>
            </div>
        </template>
    </div>
</template>

<style scoped>
.member-inventory-page {
    position: relative;
}

.inventory-selector {
    display: flex;
    align-items: center;
    gap: var(--gap-size-2);
    margin-bottom: var(--gap-size-3);
}

.inventory-selector label {
    font-weight: var(--fw-bold);
}

.inventory-grid {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    gap: var(--gap-size-4);
}

.ingredient-search {
    margin-bottom: var(--gap-size-3);
}

.ingredient-search__controls {
    display: flex;
    gap: var(--gap-size-2);
}

.ingredient-search__controls .form-input {
    flex: 1;
}

.ingredient-search__results {
    margin-top: var(--gap-size-2);
}

.inventory-list {
    display: grid;
    gap: var(--gap-size-2);
}

.inventory-list__item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--gap-size-2);
    padding: 0.75rem 1rem;
}

.inventory-list__item--cocktail {
    text-decoration: none;
}

.inventory-list__item--cocktail span {
    display: grid;
    gap: 0.2rem;
}

.inventory-list__item--cocktail small {
    color: var(--clr-gray-600);
}

@media (max-width: 800px) {
    .inventory-grid {
        grid-template-columns: 1fr;
    }

    .ingredient-search__controls {
        align-items: stretch;
        flex-direction: column;
    }
}
</style>
