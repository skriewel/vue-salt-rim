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

    // Do not rely on the backend's name_exact semantics here. Some backend
    // versions return prefix/fuzzy matches (for example "Lime Juice Cordial"
    // for "Lime juice"). Replace name_exact with the normal name search, fetch
    // the candidate set, then enforce exact matching in Salt Rim itself.
    const searchQuery = { ...queryRecord };
    delete searchQuery["filter[name_exact]"];
    searchQuery["filter[name]"] = exactName;
    searchQuery.per_page = 100;

    const response = await originalGetIngredients(searchQuery);

    if (!response?.data) {
        return response;
    }

    const normalizedExactName = normalizeIngredientName(exactName);

    return {
        ...response,
        data: response.data.filter((ingredient) => normalizeIngredientName(ingredient.name) === normalizedExactName),
    };
};
