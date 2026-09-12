<script setup lang="ts">
import { onMounted, ref } from "vue";
import type { components } from "@/api/api";
import AppState from "@/AppState";
import MemberInventoryClient, { type MemberInventory } from "@/api/MemberInventoryClient";
import { useSaltRimToast } from "@/composables/toast";

type Ingredient = components["schemas"]["Ingredient"];

const props = defineProps<{
    ingredient: Ingredient;
}>();

const appState = new AppState();
const toast = useSaltRimToast();
const inventory = ref<MemberInventory | null>(null);
const inList = ref(false);
const isLoading = ref(true);

async function loadState() {
    isLoading.value = true;
    try {
        const inventories = (await MemberInventoryClient.getInventories(appState.user.id)).data ?? [];
        inventory.value = inventories.find((item) => item.name.toLowerCase() === "my shelf") ?? inventories[0] ?? null;

        if (!inventory.value) {
            inList.value = false;
            return;
        }

        const ingredients = (await MemberInventoryClient.getIngredients(appState.user.id, inventory.value.id)).data ?? [];
        inList.value = ingredients.some((item) => item.id === props.ingredient.id);
    } catch (e: any) {
        toast.error(e.message ?? "Unable to load inventory state.");
    } finally {
        isLoading.value = false;
    }
}

async function toggle() {
    if (!inventory.value || isLoading.value) {
        return;
    }

    isLoading.value = true;
    try {
        if (inList.value) {
            await MemberInventoryClient.removeIngredients(appState.user.id, inventory.value.id, [props.ingredient.id]);
            inList.value = false;
            toast.default(`${props.ingredient.name} removed from ${inventory.value.name}.`);
        } else {
            await MemberInventoryClient.addIngredients(appState.user.id, inventory.value.id, [props.ingredient.id]);
            inList.value = true;
            toast.default(`${props.ingredient.name} added to ${inventory.value.name}.`);
        }
    } catch (e: any) {
        toast.error(e.message ?? "Unable to update inventory.");
    } finally {
        isLoading.value = false;
    }
}

onMounted(loadState);
</script>

<template>
    <slot v-if="inventory" :is-loading="isLoading" :in-list="inList" :toggle="toggle" :inventory="inventory" />
</template>
