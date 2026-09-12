<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import qs from "qs";

const route = useRoute();
const router = useRouter();

let filterRoot: HTMLElement | null = null;
let sortOption: HTMLOptionElement | null = null;

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

function getCurrentPeriod(): string {
    const state = qs.parse(window.location.search.replace(/^\?/, "")) as any;
    const filter = state.filter ?? {};

    if (String(filter.never_tapped ?? "") === "true" || String(filter.never_tapped ?? "") === "1") return "never";
    if (filter.tapped_before && !filter.tapped_after) return "older12m";
    if (!filter.tapped_after) return "any";

    const after = String(filter.tapped_after);
    const values: Record<string, string> = {
        today: shiftedDate({}),
        "7d": shiftedDate({ days: 6 }),
        "30d": shiftedDate({ days: 29 }),
        "3m": shiftedDate({ months: 3 }),
        "12m": shiftedDate({ months: 12 }),
    };

    return Object.entries(values).find(([, value]) => value === after)?.[0] ?? "any";
}

function updatePeriod(period: string) {
    const state = qs.parse(window.location.search.replace(/^\?/, "")) as any;
    state.filter = state.filter ?? {};

    delete state.filter.tapped_after;
    delete state.filter.tapped_before;
    delete state.filter.never_tapped;

    switch (period) {
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

function syncControls() {
    const currentPeriod = getCurrentPeriod();
    filterRoot?.querySelectorAll<HTMLInputElement>('input[name="tap-last-tapped"]').forEach((input) => {
        input.checked = input.value === currentPeriod;
    });
}

function installSortOption() {
    const selects = document.querySelectorAll<HTMLSelectElement>(".resource-search__content__filter select.form-select");
    const sortSelect = Array.from(selects).find((select) => Array.from(select.options).some((option) => option.value === "created_at"));
    if (!sortSelect || sortSelect.querySelector('option[value="last_tapped_on"]')) return;

    sortOption = document.createElement("option");
    sortOption.value = "last_tapped_on";
    sortOption.textContent = "Last tapped";
    sortSelect.append(sortOption);
}

function installFilterGroup(): boolean {
    if (document.getElementById("tap-last-tapped-refinement")) return true;

    const refinements = Array.from(document.querySelectorAll<HTMLElement>(".resource-search__refinements__refinement"));
    const favoriteRefinement = refinements.find((refinement) => {
        if (refinement.querySelector('input[id^="favorited-by-user-"]')) return true;
        const title = refinement.querySelector("h4")?.textContent?.trim().toLowerCase() ?? "";
        return title.includes("favorited by user");
    });

    if (!favoriteRefinement) return false;

    filterRoot = document.createElement("div");
    filterRoot.id = "tap-last-tapped-refinement";
    filterRoot.className = "resource-search__refinements__refinement block-container block-container--inset";

    const title = document.createElement("div");
    title.className = "resource-search__refinements__refinement__title";
    title.innerHTML = `<h4>Last tapped</h4>`;

    const actions = document.createElement("div");
    actions.className = "resource-search__refinements__refinement__title__actions";
    const clear = document.createElement("button");
    clear.type = "button";
    clear.className = "button";
    clear.title = "Clear";
    clear.textContent = "×";
    clear.addEventListener("click", () => updatePeriod("any"));
    actions.append(clear);
    title.append(actions);
    filterRoot.append(title);

    const body = document.createElement("div");
    body.className = "resource-search__refinements__refinement__body";

    const options = [
        ["today", "Today"],
        ["7d", "Last 7 days"],
        ["30d", "Last 30 days"],
        ["3m", "Last 3 months"],
        ["12m", "Last 12 months"],
        ["older12m", "More than 12 months ago"],
        ["never", "Never"],
    ];

    for (const [value, label] of options) {
        const row = document.createElement("div");
        row.className = "resource-search__refinements__refinement__item";

        const input = document.createElement("input");
        input.type = "radio";
        input.name = "tap-last-tapped";
        input.id = `tap-last-tapped-${value}`;
        input.value = value;
        input.addEventListener("change", () => updatePeriod(value));

        const text = document.createElement("label");
        text.htmlFor = input.id;
        text.textContent = label;

        row.append(input, text);
        body.append(row);
    }

    filterRoot.append(body);
    favoriteRefinement.insertAdjacentElement("afterend", filterRoot);
    syncControls();
    return true;
}

async function installControls() {
    await nextTick();
    installSortOption();

    if (installFilterGroup()) return;

    let attempts = 0;
    const timer = window.setInterval(() => {
        attempts++;
        installSortOption();
        if (installFilterGroup() || attempts >= 20) window.clearInterval(timer);
    }, 100);
}

onMounted(installControls);
watch(() => route.fullPath, () => {
    installControls();
    syncControls();
});

onBeforeUnmount(() => {
    filterRoot?.remove();
    sortOption?.remove();
});
</script>

<template></template>
