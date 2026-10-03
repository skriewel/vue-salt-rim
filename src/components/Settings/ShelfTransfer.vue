<template>
    <PageHeader>
        {{ $t("shelf-transfer.title") }}
    </PageHeader>
    <div class="settings-page">
        <div class="settings-page__nav">
            <SettingsNavigation />
        </div>
        <div class="settings-page__content">
            <OverlayLoader v-if="isLoading" />

            <div class="block-container block-container--padded">
                <p style="margin-top: 0">{{ $t("shelf-transfer.description") }}</p>

                <div v-if="inventories.length > 0" class="form-group">
                    <label class="form-label" for="shelf-transfer-source">{{ $t("shelf-transfer.source") }}:</label>
                    <select id="shelf-transfer-source" v-model="selectedInventoryId" class="form-select">
                        <option v-for="inventory in inventories" :key="inventory.id" :value="inventory.id">
                            {{ inventoryLabel(inventory) }}
                        </option>
                    </select>
                </div>

                <p v-if="selectedInventory?.inventory_ingredients_count === 0" class="form-input-hint">
                    {{ $t("shelf-transfer.empty") }}
                </p>

                <button
                    v-if="inventories.length > 0"
                    type="button"
                    class="button button--dark"
                    :disabled="isLoading || !selectedInventory || selectedInventory.inventory_ingredients_count === 0"
                    @click="transferShelf"
                >
                    {{ $t("shelf-transfer.copy") }}
                </button>

                <p v-else-if="!isLoading">{{ $t("shelf-transfer.no-shelves") }}</p>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import AppState from "@/AppState";
import BarAssistantClient from "@/api/BarAssistantClient";
import MemberInventoryClient, { type MemberInventory } from "@/api/MemberInventoryClient";
import OverlayLoader from "@/components/OverlayLoader.vue";
import PageHeader from "@/components/PageHeader.vue";
import SettingsNavigation from "@/components/Settings/SettingsNavigation.vue";
import { useConfirm } from "@/composables/confirm";
import { useSaltRimToast } from "@/composables/toast";
import { useTitle } from "@/composables/title";

const appState = new AppState();
const { t } = useI18n();
const toast = useSaltRimToast();
const confirm = useConfirm();

const isLoading = ref(false);
const inventories = ref<MemberInventory[]>([]);
const selectedInventoryId = ref<number | null>(null);

const selectedInventory = computed(() => inventories.value.find((inventory) => inventory.id === selectedInventoryId.value) ?? null);

useTitle(t("shelf-transfer.title"));

function inventoryLabel(inventory: MemberInventory): string {
    if (inventory.inventory_ingredients_count === undefined) {
        return inventory.name;
    }

    return `${inventory.name} (${t("shelf-transfer.ingredient-count", { count: inventory.inventory_ingredients_count })})`;
}

loadInventories();

async function loadInventories() {
    isLoading.value = true;

    try {
        inventories.value = (await MemberInventoryClient.getInventories(appState.user.id)).data ?? [];

        if (inventories.value.length > 0) {
            const myShelf = inventories.value.find((inventory) => inventory.name.toLowerCase() === "my shelf");
            selectedInventoryId.value = myShelf?.id ?? inventories.value[0].id;
        }
    } catch (e: any) {
        toast.error(e.message ?? t("shelf-transfer.load-error"));
    } finally {
        isLoading.value = false;
    }
}

function transferShelf() {
    if (!selectedInventory.value) {
        return;
    }

    const inventory = selectedInventory.value;
    const count = inventory.inventory_ingredients_count ?? 0;

    confirm.show(
        t("shelf-transfer.confirm", {
            count,
            shelf: inventory.name,
            bar: appState.bar.name,
        }),
        {
            onResolved: (dialog: { close: () => void }) => {
                dialog.close();
                void copyInventoryToBarShelf(inventory);
            },
        },
    );
}

async function copyInventoryToBarShelf(inventory: MemberInventory) {
    isLoading.value = true;

    try {
        const response = await MemberInventoryClient.getIngredients(appState.user.id, inventory.id);
        const ingredientIds = [...new Set((response.data ?? []).map((ingredient) => ingredient.id))];

        if (ingredientIds.length === 0) {
            toast.default(t("shelf-transfer.empty"));
            return;
        }

        await BarAssistantClient.addToBarShelf(appState.bar.id, { ingredients: ingredientIds });

        toast.default(
            t("shelf-transfer.success", {
                count: ingredientIds.length,
                shelf: inventory.name,
            }),
        );
    } catch (e: any) {
        toast.error(e.message ?? t("shelf-transfer.copy-error"));
    } finally {
        isLoading.value = false;
    }
}
</script>
