<template>
    <button
        type="button"
        class="button button--outline button--has-icon"
        :disabled="isSaving"
        :title="isSaving ? 'Tapping…' : 'Tap cocktail'"
        :aria-label="isSaving ? 'Tapping cocktail' : 'Tap cocktail'"
        @click="tapToday"
    >
        <IconCocktail />
    </button>
</template>

<script setup lang="ts">
import { ref } from "vue";
import CocktailTapClient from "@/api/CocktailTapClient";
import { useSaltRimToast } from "@/composables/toast";
import { cocktailTapBus } from "@/composables/eventBus";
import IconCocktail from "@/components/Icons/IconCocktail.vue";

const props = defineProps<{ cocktailId: number }>();
const toast = useSaltRimToast();
const isSaving = ref(false);

async function tapToday() {
    isSaving.value = true;
    try {
        await CocktailTapClient.create(props.cocktailId);
        cocktailTapBus.emit(props.cocktailId);
        toast.default("Cocktail tapped");
    } catch (e: any) {
        toast.error(e.message ?? "Could not save tap");
    } finally {
        isSaving.value = false;
    }
}
</script>
