<script setup lang="ts">
import Index from "../components/Shelf/ShelfIndex.vue";
import TapStats from "../components/Shelf/TapStats.vue";
</script>

<template>
    <main>
        <Index />
        <div class="home-tap-stats">
            <TapStats />
        </div>
    </main>
</template>

<style scoped>
.home-tap-stats {
    margin-top: var(--gap-size-4);
}
</style>
