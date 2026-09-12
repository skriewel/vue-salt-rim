import AppState from "@/AppState";

export interface CocktailTap {
    id: number;
    date: string;
}

export interface CocktailTapList {
    data: CocktailTap[];
    meta: {
        total: number;
        last_tapped_on: string | null;
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
            // Keep generic status message when no JSON body is available.
        }
        throw new Error(message);
    }

    if (response.status === 204) {
        return undefined as T;
    }

    return (await response.json()) as T;
}

export default class CocktailTapClient {
    static async list(cocktailId: number): Promise<CocktailTapList> {
        return request(`/cocktails/${cocktailId}/taps`);
    }

    static async create(cocktailId: number, date?: string): Promise<{ data: CocktailTap }> {
        return request(`/cocktails/${cocktailId}/taps`, {
            method: "POST",
            body: JSON.stringify(date ? { date } : {}),
        });
    }

    static async update(cocktailId: number, tapId: number, date: string): Promise<{ data: CocktailTap }> {
        return request(`/cocktails/${cocktailId}/taps/${tapId}`, {
            method: "PATCH",
            body: JSON.stringify({ date }),
        });
    }

    static async delete(cocktailId: number, tapId: number): Promise<void> {
        return request(`/cocktails/${cocktailId}/taps/${tapId}`, { method: "DELETE" });
    }
}
