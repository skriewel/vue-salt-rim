<template>
    <div class="resource-facts">
        <dl>
            <dt>{{ t("your-rating") }}</dt>
            <dd>
                <div>
                    <Rating :id="cocktail.id" :rating="(cocktail.rating && cocktail.rating.user) ?? 0" type="cocktail" @rated="onRated"></Rating>
                </div>
            </dd>
            <template v-if="cocktail.rating">
                <dt>{{ t("avg-rating") }}</dt>
                <dd>
                    <span class="rating-breakdown">
                        <RouterLink :to="{ name: 'cocktails', query: { 'filter[user_rating_min]': cocktail.rating.average } }">{{ cocktail.rating.average }} ★</RouterLink>
                        <span v-if="isAdmin && ratingBreakdown.length > 0" class="rating-breakdown__tooltip" role="tooltip">
                            <span v-for="entry in ratingBreakdown" :key="entry.name" class="rating-breakdown__entry">{{ entry.name }}: {{ entry.rating }} stars</span>
                        </span>
                    </span>
                </dd>
            </template>
            <dt>Taps</dt>
            <dd><CocktailTapWidget :cocktail-id="cocktail.id" /></dd>
            <template v-if="cocktail.public_id">
                <dt>{{ t("public-link") }}</dt>
                <dd>
                    <RouterLink :to="{ name: 'e.cocktail', params: { ulid: cocktail.public_id, slug: cocktail.slug } }" class="external-link" target="_blank"
                        >{{ t("click-here") }} <IconExternal
                    /></RouterLink>
                </dd>
            </template>
            <template v-if="cocktail.publication">
                <dt>Source</dt>
                <dd>
                    <RouterLink :to="{ name: 'cocktails', query: { 'filter[publication]': cocktail.publication } }">{{ cocktail.publication }}</RouterLink>
                </dd>
            </template>
            <template v-if="cocktail.source">
                <dt>Weblink</dt>
                <dd>
                    <a class="external-link" v-if="isValidUrl(cocktail.source)" :href="cocktail.source" target="_blank">{{ t("website") }} <IconExternal /></a>
                    <span v-else>{{ cocktail.source }}</span>
                </dd>
            </template>
            <template v-if="cocktail.year">
                <dt>{{ t("year") }}</dt>
                <dd><RouterLink :to="{ name: 'cocktails', query: { 'filter[year_min]': cocktail.year, 'filter[year_max]': cocktail.year } }">{{ cocktail.year }}</RouterLink></dd>
            </template>
            <template v-if="cocktail.author">
                <dt>{{ t("author.title") }}</dt>
                <dd><RouterLink :to="{ name: 'cocktails', query: { 'filter[author]': cocktail.author } }">{{ cocktail.author }}</RouterLink></dd>
            </template>
            <template v-if="cocktail.origin_bar">
                <dt>{{ t("origin-bar.title") }}</dt>
                <dd>
                    <RouterLink :to="{ name: 'cocktails', query: { 'filter[origin_bar]': cocktail.origin_bar } }">{{ cocktail.origin_bar }}</RouterLink>
                </dd>
            </template>
            <template v-if="cocktail.abv && cocktail.abv > 0">
                <dt>{{ t("ABV") }}</dt>
                <dd>
                    <RouterLink :to="{ name: 'cocktails', query: { 'filter[abv_min]': cocktail.abv } }">{{ cocktail.abv }}%</RouterLink>
                </dd>
            </template>
            <template v-if="cocktail.tags && cocktail.tags.length > 0">
                <dt>{{ t("tag.tags") }}</dt>
                <dd>
                    <div>
                        <template v-for="(tag, index) in cocktail.tags" :key="tag.id">
                            <RouterLink :to="{ name: 'cocktails', query: { 'filter[tag_id]': tag.id } }">{{ tag.name }}</RouterLink>
                            <template v-if="index + 1 !== cocktail.tags.length">, </template>
                        </template>
                    </div>
                </dd>
            </template>
            <template v-if="cocktail.glass">
                <dt>{{ t("glass-type.title") }}</dt>
                <dd>
                    <RouterLink :to="{ name: 'cocktails', query: { 'filter[glass_id]': cocktail.glass.id } }">{{ cocktail.glass.name }}</RouterLink>
                </dd>
            </template>
            <template v-if="cocktail.method">
                <dt>{{ t("method.title") }}</dt>
                <dd>
                    <RouterLink :to="{ name: 'cocktails', query: { 'filter[cocktail_method_id]': cocktail.method.id } }">{{ t("method." + cocktail.method.name) }}</RouterLink>
                </dd>
            </template>
        </dl>
    </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { components } from "@/api/api";
import Rating from "@/components/RatingActions.vue";
import { useI18n } from "vue-i18n";
import IconExternal from "@/components/Icons/IconExternal.vue";
import CocktailTapWidget from "@/components/Cocktail/CocktailTapWidget.vue";
import AppState from "@/AppState";

type Cocktail = components["schemas"]["Cocktail"] & { publication?: string | null };
type RatingBreakdownEntry = {
    name: string;
    rating: number;
};

const { t } = useI18n();
const appState = new AppState();
const props = defineProps<{
    cocktail: Cocktail;
}>();

const isAdmin = computed(() => Boolean(appState.isAdmin()));
const ratingBreakdown = computed(() => (((props.cocktail.rating as any)?.breakdown ?? []) as RatingBreakdownEntry[]));

const emit = defineEmits<{
    (e: "rating-changed", rating: number): void;
}>();

function onRated(rating: number) {
    emit("rating-changed", rating);
}

function isValidUrl(input: string) {
    try {
        const url = new URL(input);
        return url.protocol === "http:" || url.protocol === "https:";
    } catch (err) {
        return false;
    }
}
</script>

<style scoped>
.rating-breakdown {
    position: relative;
    display: inline-block;
}

.rating-breakdown__tooltip {
    position: absolute;
    left: 50%;
    bottom: calc(100% + 8px);
    z-index: 20;
    display: none;
    min-width: 180px;
    max-width: 320px;
    padding: 0.55rem 0.7rem;
    transform: translateX(-50%);
    border-radius: var(--radius-2);
    background: var(--clr-gray-900);
    color: #fff;
    box-shadow: 0 5px 18px rgba(0, 0, 0, 0.25);
    white-space: nowrap;
    font-size: 0.8rem;
    line-height: 1.45;
}

.rating-breakdown:hover .rating-breakdown__tooltip,
.rating-breakdown:focus-within .rating-breakdown__tooltip {
    display: block;
}

.rating-breakdown__entry {
    display: block;
}
</style>
