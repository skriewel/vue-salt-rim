<template>
    <form @submit.prevent="submit">
        <OverlayLoader v-if="isLoading" />
        <div class="dialog-title">{{ dialogTitle }}</div>
        <div class="form-group">
            <label class="form-label form-label--required" for="name">{{ $t("name") }}:</label>
            <input id="name" v-model="collection.name" class="form-input" type="text" required />
        </div>
        <div class="form-group">
            <label class="form-label" for="description">{{ $t("description") }}:</label>
            <textarea id="description" v-model="collection.description" rows="5" class="form-input"></textarea>
        </div>
        <div class="form-group">
            <label class="form-checkbox" for="share-in-bar">
                <input id="share-in-bar" v-model="collection.is_bar_shared" type="checkbox" :value="true" />
                <span>{{ $t("collections.share-in-bar") }}</span>
            </label>
        </div>
        <div class="form-group">
            <label class="form-checkbox" for="collaborative-in-bar">
                <input id="collaborative-in-bar" v-model="collection.is_collaborative" type="checkbox" :value="true" :disabled="!collection.is_bar_shared" />
                <span>Allow bar members to edit this collection</span>
            </label>
        </div>
        <div class="dialog-actions">
            <button class="button button--outline" @click.prevent="$emit('collectionDialogClosed')">{{ $t("cancel") }}</button>
            <button class="button button--dark" type="submit">{{ $t("save") }}</button>
        </div>
    </form>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import BarAssistantClient from "@/api/BarAssistantClient";
import OverlayLoader from "@/components/OverlayLoader.vue";
import { useSaltRimToast } from "@/composables/toast";
import type { components } from "@/api/api";

type Collection = components["schemas"]["Collection"] & {
    is_collaborative?: boolean;
    is_owned_by_user?: boolean;
};

const props = withDefaults(defineProps<{ dialogTitle?: string; sourceCollection: Collection }>(), {
    dialogTitle: "",
});
const { t } = useI18n();
const toast = useSaltRimToast();

const emit = defineEmits<{ collectionDialogClosed: [] }>();

const isLoading = ref(false);
const collection = ref<Collection>(props.sourceCollection);

watch(
    () => collection.value.is_bar_shared,
    (isShared) => {
        if (!isShared) {
            collection.value.is_collaborative = false;
        }
    },
);

function submit() {
    isLoading.value = true;

    const postData = {
        name: collection.value.name ?? "",
        description: collection.value.description,
        is_bar_shared: collection.value.is_bar_shared,
        is_collaborative: Boolean(collection.value.is_bar_shared && collection.value.is_collaborative),
    };

    if (collection.value.id) {
        BarAssistantClient.updateCollection(collection.value.id, postData)
            .then(() => {
                isLoading.value = false;
                toast.default(t("collections.update-success"));
                emit("collectionDialogClosed");
            })
            .catch((e) => {
                toast.error(e.message);
                isLoading.value = false;
            });
    } else {
        BarAssistantClient.saveCollection(postData)
            .then(() => {
                isLoading.value = false;
                toast.default(t("collections.add-success"));
                emit("collectionDialogClosed");
            })
            .catch((e) => {
                toast.error(e.message);
                isLoading.value = false;
            });
    }
}
</script>
