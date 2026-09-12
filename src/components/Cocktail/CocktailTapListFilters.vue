<script setup lang="ts">
import { ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import qs from "qs";

const route = useRoute();
const router = useRouter();

const period = ref("any");
const tapSort = ref("default");

function formatLocalDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function shiftedDate({ days = 0, months = 0 }: { days?: number; months?: number }): string {
    const date = new Date();
    date.setHours(12, 0, 0, 0);
    if (months) date.setMonth(date.getMonth() - months);
    if (days) date.setDate(date.getDate() - days);
    return formatLocalDate(date);
}

function readState() {
    const state = qs.parse(window.location.search.replace(/^\?/, "")) as any;
    const filter = state.filter ?? {};

    if (String(filter.never_tapped ?? "") === "true" || String(filter.never_tapped ?? "") === "1") {
        period.value = "never";
    } else if (filter.tapped_before && !filter.tapped_after) {
        period.value = "older12m";
    } else if (filter.tapped_after) {
        const after = String(filter.tapped_after);
        const today = shiftedDate({});
        const values: Record<string, string> = {
            today,
            "7d": shiftedDate({ days: 6 }),
            "30d": shiftedDate({ days: 29 }),
            "3m": shiftedDate({ months: 3 }),
            "12m": shiftedDate({ months: 12 }),
        };
        period.value = Object.entries(values).find(([, value]) => value === after)?.[0] ?? "any";
    } else {
        period.value = "any";
    }

    tapSort.value = state.sort === "-last_tapped_on" ? "recent" : state.sort === "last_tapped_on" ? "oldest" : "default";
}

function updatePeriod() {
    const state = qs.parse(window.location.search.replace(/^\?/, "")) as any;
    state.filter = state.filter ?? {};

    delete state.filter.tapped_after;
    delete state.filter.tapped_before;
    delete state.filter.never_tapped;

    switch (period.value) {
        case "today":
            state.filter.tapped_after = shiftedDate({});
            break;
        case "7d":
            state.filter.tapped_after = shiftedDate({ days: 6 });
            break;
        case "30d":
            state.filter.tapped_after = shiftedDate({ days: 29 });
            break;
        case "3m":
            state.filter.tapped_after = shiftedDate({ months: 3 });
            break;
        case "12m":
            state.filter.tapped_after = shiftedDate({ months: 12 });
            break;
        case "older12m":
            state.filter.tapped_before = shiftedDate({ months: 12 });
            break;
        case "never":
            state.filter.never_tapped = "true";
            break;
    }

    state.page = 1;
    router.push({ query: state });
}

function updateSort() {
    const state = qs.parse(window.location.search.replace(/^\?/, "")) as any;
    if (tapSort.value === "recent") {
        state.sort = "-last_tapped_on";
    } else if (tapSort.value === "oldest") {
        state.sort = "last_tapped_on";
    } else if (state.sort === "last_tapped_on" || state.sort === "-last_tapped_on") {
        state.sort = "name";
    }
    state.page = 1;
    router.push({ query: state });
}

watch(() => route.fullPath, readState, { immediate: true });
</script>

<template>
    <div class="cocktail-tap-list-filters">
        <label>
            <span>Last tapped</span>
            <select v-model="period" class="form-select" @change="updatePeriod">
                <option value="any">Any time</option>
                <option value="today">Today</option>
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="3m">Last 3 months</option>
                <option value="12m">Last 12 months</option>
                <option value="older12m">More than 12 months ago</option>
                <option value="never">Never</option>
            </select>
        </label>
        <label>
            <span>Tap sort</span>
            <select v-model="tapSort" class="form-select" @change="updateSort">
                <option value="default">Default</option>
                <option value="recent">Recently tapped</option>
                <option value="oldest">Least recently tapped</option>
            </select>
        </label>
    </div>
</template>

<style scoped>
.cocktail-tap-list-filters {
    display: flex;
    gap: 0.75rem;
    align-items: end;
    margin: 0 0 1rem;
}

.cocktail-tap-list-filters label {
    display: grid;
    gap: 0.25rem;
    min-width: 12rem;
}

.cocktail-tap-list-filters label > span {
    font-size: 0.75rem;
    opacity: 0.7;
}

@media (max-width: 650px) {
    .cocktail-tap-list-filters {
        display: grid;
        grid-template-columns: 1fr;
    }
}
</style>
