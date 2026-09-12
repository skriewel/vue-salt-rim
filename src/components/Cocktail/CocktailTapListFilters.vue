<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import BarAssistantClient from "@/api/BarAssistantClient";
import qs from "qs";

const route = useRoute();
const router = useRouter();

let filterRoot: HTMLElement | null = null;
let sortOption: HTMLOptionElement | null = null;
let clearButton: HTMLButtonElement | null = null;
let collapseButton: HTMLButtonElement | null = null;
let filterBody: HTMLElement | null = null;
let isCollapsed = true;

const originalGetCocktails = BarAssistantClient.getCocktails.bind(BarAssistantClient);
let clientHookInstalled = false;

function getTapFiltersFromLocation(): Record<string, string> {
    const state = qs.parse(window.location.search.replace(/^\?/, "")) as any;
    const filter = state.filter ?? {};
    const result: Record<string, string> = {};

    if (filter.tapped_after) result.tapped_after = String(filter.tapped_after);
    if (filter.tapped_before) result.tapped_before = String(filter.tapped_before);
    if (filter.never_tapped !== undefined && filter.never_tapped !== null && String(filter.never_tapped) !== "") {
        result.never_tapped = String(filter.never_tapped);
    }

    return result;
}

function installCocktailClientFilterBridge() {
    if (clientHookInstalled) return;

    BarAssistantClient.getCocktails = async function (query: any = {}) {
        const tapFilters = getTapFiltersFromLocation();
        const mergedQuery: any = { ...query };

        if (Object.keys(tapFilters).length > 0) {
            mergedQuery.filter = {
                ...(query?.filter ?? {}),
                ...tapFilters,
            };
        }

        return originalGetCocktails(mergedQuery);
    };

    clientHookInstalled = true;
}

function uninstallCocktailClientFilterBridge() {
    if (!clientHookInstalled) return;
    BarAssistantClient.getCocktails = originalGetCocktails as typeof BarAssistantClient.getCocktails;
    clientHookInstalled = false;
}

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

function chevronSvg(collapsed: boolean): string {
    return collapsed
        ? '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16"><path d="M10.8284 12.0007L15.7782 16.9504L14.364 18.3646L8 12.0007L14.364 5.63672L15.7782 7.05093L10.8284 12.0007Z"></path></svg>'
        : '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16"><path d="M11.9997 13.1714L16.9495 8.22168L18.3637 9.63589L11.9997 15.9999L5.63574 9.63589L7.04996 8.22168L11.9997 13.1714Z"></path></svg>';
}

function clearSvg(): string {
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20"><path d="M11.9997 10.5865L16.9495 5.63672L18.3637 7.05093L13.4139 12.0007L18.3637 16.9504L16.9495 18.3646L11.9997 13.4149L7.04996 18.3646L5.63574 16.9504L10.5855 12.0007L5.63574 7.05093L7.04996 5.63672L11.9997 10.5865Z"></path></svg>';
}

function renderCollapsedState() {
    if (filterBody) filterBody.style.display = isCollapsed ? "none" : "";
    if (collapseButton) collapseButton.innerHTML = chevronSvg(isCollapsed);
}

function syncControls() {
    const currentPeriod = getCurrentPeriod();
    const hasActiveFilter = currentPeriod !== "any";

    filterRoot?.querySelectorAll<HTMLInputElement>('input[name="tap-last-tapped"]').forEach((input) => {
        input.checked = input.value === currentPeriod;
    });

    if (clearButton) clearButton.style.display = hasActiveFilter ? "" : "none";

    if (hasActiveFilter && isCollapsed) {
        isCollapsed = false;
        renderCollapsedState();
    }
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
    title.innerHTML = '<h4>Last tapped</h4>';

    const actions = document.createElement("div");
    actions.className = "resource-search__refinements__refinement__title__actions";

    clearButton = document.createElement("button");
    clearButton.type = "button";
    clearButton.className = "button";
    clearButton.title = "Clear";
    clearButton.innerHTML = clearSvg();
    clearButton.style.padding = "0";
    clearButton.style.margin = "0";
    clearButton.style.width = "auto";
    clearButton.style.height = "auto";
    clearButton.addEventListener("click", () => updatePeriod("any"));

    collapseButton = document.createElement("button");
    collapseButton.type = "button";
    collapseButton.className = "button";
    collapseButton.style.padding = "0";
    collapseButton.style.margin = "0";
    collapseButton.style.width = "auto";
    collapseButton.style.height = "auto";
    collapseButton.addEventListener("click", () => {
        isCollapsed = !isCollapsed;
        renderCollapsedState();
    });

    actions.append(clearButton, collapseButton);
    title.append(actions);
    filterRoot.append(title);

    filterBody = document.createElement("div");
    filterBody.className = "resource-search__refinements__refinement__body";

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
        filterBody.append(row);
    }

    filterRoot.append(filterBody);
    favoriteRefinement.insertAdjacentElement("afterend", filterRoot);

    isCollapsed = getCurrentPeriod() === "any";
    renderCollapsedState();
    syncControls();
    return true;
}

async function installControls() {
    installCocktailClientFilterBridge();
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
    uninstallCocktailClientFilterBridge();
});
</script>

<template></template>