<script setup lang="ts">
import { onMounted, ref } from "vue";
import CocktailTapClient, { type CocktailTapStatsScope } from "@/api/CocktailTapClient";
import ListItemContainer from "@/components/ListItemContainer.vue";
import OverlayLoader from "@/components/OverlayLoader.vue";

const loading = ref(true);
const personal = ref<CocktailTapStatsScope | null>(null);
const bar = ref<CocktailTapStatsScope | null>(null);

function formatDate(date: string): string {
    return new Intl.DateTimeFormat(undefined, { year: "numeric", month: "short", day: "numeric" }).format(new Date(`${date}T00:00:00`));
}

async function loadStats() {
    loading.value = true;
    try {
        const response = await CocktailTapClient.stats();
        personal.value = response.data.personal;
        bar.value = response.data.bar;
    } finally {
        loading.value = false;
    }
}

onMounted(loadStats);
</script>

<template>
    <div class="tap-stats">
        <div class="tap-stats__scope">
            <OverlayLoader v-if="loading"></OverlayLoader>
            <h3 class="page-subtitle">Your cocktail history</h3>

            <template v-if="personal">
                <h4 class="tap-stats__subtitle">Most tapped</h4>
                <div class="salt-rim-list" v-if="personal.most_tapped.length > 0">
                    <ListItemContainer
                        tag="RouterLink"
                        v-for="cocktail in personal.most_tapped"
                        :key="`personal-most-${cocktail.id}`"
                        :to="{ name: 'cocktails.show', params: { id: cocktail.slug } }"
                    >
                        <template #content>
                            <h5 class="sr-list-item-title">{{ cocktail.name }}</h5>
                            <p>{{ cocktail.tap_count }} taps · last {{ formatDate(cocktail.last_tapped_on) }}</p>
                        </template>
                    </ListItemContainer>
                </div>
                <p v-else class="tap-stats__empty">No taps yet.</p>

                <h4 class="tap-stats__subtitle tap-stats__subtitle--spaced">Recently tapped</h4>
                <div class="salt-rim-list" v-if="personal.last_tapped.length > 0">
                    <ListItemContainer
                        tag="RouterLink"
                        v-for="cocktail in personal.last_tapped"
                        :key="`personal-last-${cocktail.id}`"
                        :to="{ name: 'cocktails.show', params: { id: cocktail.slug } }"
                    >
                        <template #content>
                            <h5 class="sr-list-item-title">{{ cocktail.name }}</h5>
                            <p>{{ formatDate(cocktail.last_tapped_on) }} · {{ cocktail.tap_count }} total taps</p>
                        </template>
                    </ListItemContainer>
                </div>
                <p v-else class="tap-stats__empty">No taps yet.</p>
            </template>
        </div>

        <div class="tap-stats__scope">
            <OverlayLoader v-if="loading"></OverlayLoader>
            <h3 class="page-subtitle">Bar cocktail history</h3>

            <template v-if="bar">
                <h4 class="tap-stats__subtitle">Most tapped</h4>
                <div class="salt-rim-list" v-if="bar.most_tapped.length > 0">
                    <ListItemContainer
                        tag="RouterLink"
                        v-for="cocktail in bar.most_tapped"
                        :key="`bar-most-${cocktail.id}`"
                        :to="{ name: 'cocktails.show', params: { id: cocktail.slug } }"
                    >
                        <template #content>
                            <h5 class="sr-list-item-title">{{ cocktail.name }}</h5>
                            <p>{{ cocktail.tap_count }} taps · last {{ formatDate(cocktail.last_tapped_on) }}</p>
                        </template>
                    </ListItemContainer>
                </div>
                <p v-else class="tap-stats__empty">No taps yet.</p>

                <h4 class="tap-stats__subtitle tap-stats__subtitle--spaced">Recently tapped</h4>
                <div class="salt-rim-list" v-if="bar.last_tapped.length > 0">
                    <ListItemContainer
                        tag="RouterLink"
                        v-for="cocktail in bar.last_tapped"
                        :key="`bar-last-${cocktail.id}`"
                        :to="{ name: 'cocktails.show', params: { id: cocktail.slug } }"
                    >
                        <template #content>
                            <h5 class="sr-list-item-title">{{ cocktail.name }}</h5>
                            <p>{{ formatDate(cocktail.last_tapped_on) }} · {{ cocktail.tap_count }} total taps</p>
                        </template>
                    </ListItemContainer>
                </div>
                <p v-else class="tap-stats__empty">No taps yet.</p>
            </template>
        </div>
    </div>
</template>

<style scoped>
.tap-stats {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 2rem;
    align-items: start;
}

.tap-stats__scope {
    position: relative;
    min-width: 0;
}

.tap-stats__subtitle {
    margin: 0 0 0.65rem;
    font-size: 0.95rem;
}

.tap-stats__subtitle--spaced {
    margin-top: 1.5rem;
}

.tap-stats__empty {
    opacity: 0.65;
}

@media (max-width: 800px) {
    .tap-stats {
        grid-template-columns: 1fr;
    }
}
</style>
