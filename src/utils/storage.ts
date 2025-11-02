import type { Prompt } from "@/types"

const STORAGE_KEY = "prompt-library.prompts"
const RATINGS_KEY = "prompt-library.ratings.v1"

function safeParse<T>(raw: string | null, fallback: T): T {
    if (!raw) return fallback
    try {
        return JSON.parse(raw) as T
    } catch {
        return fallback
    }
}

export function getPrompts(): Prompt[] {
    if (typeof window === "undefined") return []
    return safeParse<Prompt[]>(localStorage.getItem(STORAGE_KEY), [])
}

export function savePrompt(prompt: Prompt) {
    const prompts = getPrompts()
    const next = [prompt, ...prompts]
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
}

export function deletePrompt(id: string) {
    const prompts = getPrompts()
    const next = prompts.filter((p) => p.id !== id)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
}

export function clearAll() {
    localStorage.removeItem(STORAGE_KEY)
}

// --- Ratings helpers ---
type RatingsMap = Record<string, number> // promptId -> rating (0..5)

function readRatings(): RatingsMap {
    if (typeof window === "undefined") return {}
    return safeParse<RatingsMap>(localStorage.getItem(RATINGS_KEY), {})
}

function writeRatings(map: RatingsMap) {
    if (typeof window === "undefined") return
    try {
        localStorage.setItem(RATINGS_KEY, JSON.stringify(map))
    } catch {
        // ignore storage errors
    }
}

export function getRating(promptId: string): number {
    const map = readRatings()
    const val = map[promptId]
    return typeof val === "number" ? val : 0
}

export function setRating(promptId: string, rating: number) {
    const r = Math.max(0, Math.min(5, Math.round(rating)))
    const map = readRatings()
    if (r === 0) {
        delete map[promptId]
    } else {
        map[promptId] = r
    }
    writeRatings(map)
}
