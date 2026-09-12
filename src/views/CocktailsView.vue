<script setup lang="ts">
import { onMounted, ref } from "vue";
import CocktailIndex from "../components/Cocktail/CocktailIndex.vue";
import CocktailTapListFilters from "../components/Cocktail/CocktailTapListFilters.vue";

const mounted = ref(false);
onMounted(() => {
    mounted.value = true;
});
</script>

<template>
    <main>
        <CocktailIndex />
        <Teleport v-if="mounted" to=".resource-search__refinements__body">
            <CocktailTapListFilters />
        </Teleport>
    </main>
</template>
