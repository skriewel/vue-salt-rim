import BarAssistantClient from "@/api/BarAssistantClient";

const originalGetIngredients = BarAssistantClient.getIngredients.bind(BarAssistantClient);

function normalizeIngredientName(name: string): string {
    return name.normalize("NFKC").trim().toLocaleLowerCase();
}

BarAssistantClient.getIngredients = async (query = {}) => {
    const queryRecord = query as Record<string, unknown>;
    const exactName = queryRecord["filter[name_exact]"];

    if (typeof exactName !== "string" || exactName.trim() === "") {
        return originalGetIngredients(query);
    }

    // Some backend versions return prefix/fuzzy matches for name_exact. Ask for
    // enough candidates and enforce exact matching in Salt Rim before the
    // importer decides whether an ingredient already exists.
    const response = await originalGetIngredients({
        ...queryRecord,
        per_page: 100,
    });

    if (!response?.data) {
        return response;
    }

    const normalizedExactName = normalizeIngredientName(exactName);

    return {
        ...response,
        data: response.data.filter((ingredient) => normalizeIngredientName(ingredient.name) === normalizedExactName),
    };
};
