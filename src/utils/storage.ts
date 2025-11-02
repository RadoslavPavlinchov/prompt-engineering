import type { Prompt } from "@/types"

const STORAGE_KEY = "prompt-library.prompts"

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
