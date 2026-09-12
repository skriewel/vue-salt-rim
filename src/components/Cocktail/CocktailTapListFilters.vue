<script setup lang="ts">
import { ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import qs from "qs";
import Refinement from "@/components/Search/SearchRefinement.vue";

const route = useRoute();
const router = useRouter();

const period = ref<any>(null);

const refinements = [
    { id: "today", value: "today", name: "Today" },
    { id: "7d", value: "7d", name: "Last 7 days" },
    { id: "30d", value: "30d", name: "Last 30 days" },
    { id: "3m", value: "3m", name: "Last 3 months" },
    { id: "12m", value: "12m", name: "Last 12 months" },
    { id: "older12m", value: "older12m", name: "More than 12 months ago" },
    { id: "never", value: "never", name: "Never" },
];

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
        return;
    }

    if (filter.tapped_before && !filter.tapped_after) {
        period.value = "older12m";
        return;
    }

    if (filter.tapped_after) {
        const after = String(filter.tapped_after);
        const values: Record<string, string> = {
            today: shiftedDate({}),
            "7d": shiftedDate({ days: 6 }),
            "30d": shiftedDate({ days: 29 }),
            "3m": shiftedDate({ months: 3 }),
            "12m": shiftedDate({ months: 12 }),
        };
        period.value = Object.entries(values).find(([, value]) => value === after)?.[0] ?? null;
        return;
    }

    period.value = null;
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

watch(() => route.fullPath, readState, { immediate: true });
</script>

<template>
    <Teleport defer to=".resource-search__refinements__body">
        <Refinement
            id="last-tapped"
            v-model="period"
            title="Last tapped"
            :refinements="refinements"
            type="radio"
            @change="updatePeriod"
        ></Refinement>
    </Teleport>

    <Teleport defer to=".resource-search__content__filter > select.form-select:first-of-type">
        <option value="last_tapped_on">Last tapped</option>
    </Teleport>
</template>
