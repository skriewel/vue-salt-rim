<template>
    <div class="cocktail-tap-widget">
        <button
            ref="tapButton"
            type="button"
            class="button button--outline button--has-icon cocktail-tap-widget__action"
            :disabled="isSaving"
            :title="isSaving ? 'Tapping…' : 'Tap cocktail'"
            :aria-label="isSaving ? 'Tapping cocktail' : 'Tap cocktail'"
            @click="tapToday"
        >
            <IconCocktail />
        </button>
        <div class="cocktail-tap-widget__summary">
            <span class="cocktail-tap-widget__count">{{ taps.meta.total }}×</span>
            <SaltRimDialog v-model="showHistory" @dialog-opened="fetchTaps">
                <template #trigger="{ toggleDialog }">
                    <a href="#tap-history" @click.prevent="toggleDialog">History</a>
                </template>
                <template #dialog>
                    <div class="dialog-title">Cocktail taps</div>
                    <p class="cocktail-tap-widget__meta">
                        <strong>{{ taps.meta.total }}</strong> total
                        <template v-if="taps.meta.last_tapped_on"> · Last: {{ formatDate(taps.meta.last_tapped_on) }}</template>
                    </p>

                    <form class="cocktail-tap-widget__add" @submit.prevent="addHistoricalTap">
                        <label for="historical-tap-date">Add tap for another date</label>
                        <div class="cocktail-tap-widget__add-row">
                            <input id="historical-tap-date" v-model="newTapDate" class="form-input" type="date" required />
                            <button type="submit" class="button" :disabled="isSaving || !newTapDate">Add</button>
                        </div>
                    </form>

                    <div v-if="isLoading" class="cocktail-tap-widget__empty">Loading…</div>
                    <div v-else-if="taps.data.length === 0" class="cocktail-tap-widget__empty">No taps yet.</div>
                    <ul v-else class="cocktail-tap-widget__history">
                        <li v-for="tap in taps.data" :key="tap.id" class="cocktail-tap-widget__history-row">
                            <template v-if="editingTapId === tap.id">
                                <input v-model="editingDate" class="form-input" type="date" />
                                <div class="cocktail-tap-widget__row-actions">
                                    <button type="button" class="button button--small" @click="saveEdit(tap.id)">Save</button>
                                    <button type="button" class="button button--outline button--small" @click="cancelEdit">Cancel</button>
                                </div>
                            </template>
                            <template v-else>
                                <span>{{ formatDate(tap.date) }}</span>
                                <div class="cocktail-tap-widget__row-actions">
                                    <button type="button" class="button button--outline button--small" @click="startEdit(tap)">Edit</button>
                                    <button type="button" class="button button--outline button--small" @click="removeTap(tap.id)">Delete</button>
                                </div>
                            </template>
                        </li>
                    </ul>
                </template>
            </SaltRimDialog>
        </div>
        <small v-if="taps.meta.last_tapped_on" class="cocktail-tap-widget__last">Last: {{ formatDate(taps.meta.last_tapped_on) }}</small>
    </div>
</template>

<script setup lang="ts">
import { nextTick, onMounted, ref } from "vue";
import SaltRimDialog from "@/components/Dialog/SaltRimDialog.vue";
import CocktailTapClient, { type CocktailTap, type CocktailTapList } from "@/api/CocktailTapClient";
import { useSaltRimToast } from "@/composables/toast";
import IconCocktail from "@/components/Icons/IconCocktail.vue";

const props = defineProps<{ cocktailId: number }>();
const toast = useSaltRimToast();

const taps = ref<CocktailTapList>({ data: [], meta: { total: 0, last_tapped_on: null } });
const isLoading = ref(false);
const isSaving = ref(false);
const showHistory = ref(false);
const newTapDate = ref("");
const editingTapId = ref<number | null>(null);
const editingDate = ref("");
const tapButton = ref<HTMLButtonElement | null>(null);

onMounted(async () => {
    await nextTick();
    const actions = document.querySelector<HTMLElement>(".cocktail-details__actions");
    if (actions && tapButton.value) {
        actions.style.gridTemplateColumns = "repeat(4, 1fr)";
        actions.insertBefore(tapButton.value, actions.lastElementChild);
    }
    await fetchTaps();
});

async function fetchTaps() {
    isLoading.value = true;
    try {
        taps.value = await CocktailTapClient.list(props.cocktailId);
    } catch (e: any) {
        toast.error(e.message ?? "Could not load taps");
    } finally {
        isLoading.value = false;
    }
}

async function tapToday() {
    isSaving.value = true;
    try {
        await CocktailTapClient.create(props.cocktailId);
        await fetchTaps();
        toast.default("Cocktail tapped");
    } catch (e: any) {
        toast.error(e.message ?? "Could not save tap");
    } finally {
        isSaving.value = false;
    }
}

async function addHistoricalTap() {
    if (!newTapDate.value) return;
    isSaving.value = true;
    try {
        await CocktailTapClient.create(props.cocktailId, newTapDate.value);
        newTapDate.value = "";
        await fetchTaps();
    } catch (e: any) {
        toast.error(e.message ?? "Could not save tap");
    } finally {
        isSaving.value = false;
    }
}

function startEdit(tap: CocktailTap) {
    editingTapId.value = tap.id;
    editingDate.value = tap.date;
}

function cancelEdit() {
    editingTapId.value = null;
    editingDate.value = "";
}

async function saveEdit(tapId: number) {
    if (!editingDate.value) return;
    try {
        await CocktailTapClient.update(props.cocktailId, tapId, editingDate.value);
        cancelEdit();
        await fetchTaps();
    } catch (e: any) {
        toast.error(e.message ?? "Could not update tap");
    }
}

async function removeTap(tapId: number) {
    if (!window.confirm("Delete this tap?")) return;
    try {
        await CocktailTapClient.delete(props.cocktailId, tapId);
        await fetchTaps();
    } catch (e: any) {
        toast.error(e.message ?? "Could not delete tap");
    }
}

function formatDate(date: string): string {
    return new Date(`${date}T00:00:00`).toLocaleDateString();
}
</script>

<style scoped>
.cocktail-tap-widget {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
}

.cocktail-tap-widget__action :deep(svg) {
    width: 24px;
    height: 24px;
}

.cocktail-tap-widget__summary {
    display: flex;
    align-items: center;
    gap: 0.55rem;
}

.cocktail-tap-widget__count {
    font-weight: var(--fw-bold);
}

.cocktail-tap-widget__last,
.cocktail-tap-widget__meta,
.cocktail-tap-widget__empty {
    opacity: 0.7;
}

.cocktail-tap-widget__add {
    margin: 1rem 0;
}

.cocktail-tap-widget__add label {
    display: block;
    margin-bottom: 0.35rem;
    font-weight: var(--fw-bold);
}

.cocktail-tap-widget__add-row {
    display: flex;
    gap: 0.5rem;
}

.cocktail-tap-widget__history {
    list-style: none;
    padding: 0;
    margin: 1rem 0 0;
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
}

.cocktail-tap-widget__history-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    padding: 0.5rem 0;
    border-bottom: 1px solid var(--clr-gray-300);
}

.cocktail-tap-widget__row-actions {
    display: flex;
    gap: 0.35rem;
}

.button--small {
    padding: 0.25rem 0.5rem;
    font-size: 0.8rem;
}
</style>
