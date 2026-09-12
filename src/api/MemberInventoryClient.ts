import AppState from "@/AppState";

export interface MemberInventory {
    id: number;
    name: string;
    inventory_ingredients_count?: number;
}

export interface MemberInventoryIngredient {
    id: number;
    name: string;
    slug: string;
}

export interface MemberInventoryCocktail {
    id: number;
    name: string;
    slug: string;
    short_ingredients?: string[] | null;
}

interface ApiCollection<T> {
    data: T[];
    meta?: {
        current_page?: number;
        last_page?: number;
        total?: number;
    };
}

const apiBaseUrl = `${window.srConfig.API_URL}/api`;

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const appState = new AppState();
    const headers = new Headers(init.headers);
    headers.set("Accept", "application/json");
    headers.set("Content-Type", "application/json");
    headers.set("Authorization", `Bearer ${appState.token ?? ""}`);
    headers.set("Bar-Assistant-Bar-Id", appState.bar.id.toString());

    const response = await fetch(`${apiBaseUrl}${path}`, { ...init, headers });

    if (!response.ok) {
        let message = `Request failed with status ${response.status}`;
        try {
            const body = await response.json();
            message = body.message ?? message;
        } catch (_) {
            // Keep generic status message when no JSON error body is available.
        }
        throw new Error(message);
    }

    if (response.status === 204) {
        return undefined as T;
    }

    return (await response.json()) as T;
}

async function requestAllPages<T>(path: string): Promise<ApiCollection<T>> {
    const separator = path.includes("?") ? "&" : "?";
    const first = await request<ApiCollection<T>>(`${path}${separator}per_page=100&page=1`);
    const lastPage = first.meta?.last_page ?? 1;

    if (lastPage <= 1) {
        return first;
    }

    const data = [...first.data];
    for (let page = 2; page <= lastPage; page++) {
        const response = await request<ApiCollection<T>>(`${path}${separator}per_page=100&page=${page}`);
        data.push(...response.data);
    }

    return { ...first, data };
}

export default class MemberInventoryClient {
    static async getInventories(userId: number): Promise<ApiCollection<MemberInventory>> {
        return request(`/members/${userId}/inventories`);
    }

    static async getIngredients(userId: number, inventoryId: number): Promise<ApiCollection<MemberInventoryIngredient>> {
        return requestAllPages(`/members/${userId}/inventories/${inventoryId}/ingredients`);
    }

    static async addIngredients(userId: number, inventoryId: number, ingredientIds: number[]): Promise<void> {
        return request(`/members/${userId}/inventories/${inventoryId}/ingredients/batch-store`, {
            method: "POST",
            body: JSON.stringify({ ingredients: ingredientIds }),
        });
    }

    static async removeIngredients(userId: number, inventoryId: number, ingredientIds: number[]): Promise<void> {
        return request(`/members/${userId}/inventories/${inventoryId}/ingredients/batch-delete`, {
            method: "POST",
            body: JSON.stringify({ ingredients: ingredientIds }),
        });
    }

    static async getCocktails(userId: number, inventoryId: number): Promise<ApiCollection<MemberInventoryCocktail>> {
        return requestAllPages(`/members/${userId}/inventories/${inventoryId}/cocktails`);
    }
}
