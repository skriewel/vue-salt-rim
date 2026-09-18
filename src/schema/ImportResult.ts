import type { components } from "@/api/api";

type Ingredient = components["schemas"]["IngredientBasic"];

export interface ImportResult {
    name: string;
    description: string | null;
    instructions: string;
    garnish: string | null;
    source: string;
    publication?: string | null;
    author?: string | null;
    year?: string | null;
    parentName?: string | null;
    parentId?: number | null;
    utensils?: string[];
    tags: string[];
    glassName: string | null;
    methodName: string | null;
    images: {
        uri: string;
        copyright: string;
    }[];
    ingredients: {
        matchedIngredient: Ingredient | null;
        source: string;
        name: string;
        amount: number | null;
        amount_max: number | null;
        units: string | null;
        note: string | null;
        description?: string | null;
        substitutes: {
            matchedIngredient: Ingredient | null;
            name: string;
            amount: number | null;
            amount_max: number | null;
            units: string | null;
        }[];
    }[];
}
