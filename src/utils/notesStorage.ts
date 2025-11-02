import type { Note, NotesMap } from "@/types"

const STORAGE_KEY = "prompt-notes:v1"

function safeParse<T>(raw: string | null, fallback: T): T {
    if (!raw) return fallback
    try {
        return JSON.parse(raw) as T
    } catch {
        return fallback
    }
}

function readAll(): NotesMap {
    if (typeof window === "undefined") return {}
    return safeParse<NotesMap>(localStorage.getItem(STORAGE_KEY), {})
}

function writeAll(map: NotesMap) {
    if (typeof window === "undefined") return
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map))
}

export function getNotes(promptId: string): Note[] {
    const all = readAll()
    const notes = all[promptId] ?? []
    // Sort by updatedAt desc for display consistency
    return [...notes].sort((a, b) => b.updatedAt - a.updatedAt)
}

export function addNote(promptId: string, content: string): Note {
    const now = Date.now()
    const id =
        typeof crypto !== "undefined" && "randomUUID" in crypto
            ? crypto.randomUUID()
            : `${now}-${Math.random().toString(36).slice(2, 8)}`

    const note: Note = {
        id,
        promptId,
        content,
        createdAt: now,
        updatedAt: now,
    }

    const all = readAll()
    const nextArr = [note, ...(all[promptId] ?? [])]
    all[promptId] = nextArr
    writeAll(all)
    return note
}

export function updateNote(promptId: string, patch: Note): Note {
    const all = readAll()
    const arr = all[promptId] ?? []
    const idx = arr.findIndex((n) => n.id === patch.id)
    if (idx === -1) {
        // If missing, treat as add to avoid silent failure
        const created = addNote(promptId, patch.content)
        return created
    }
    const updated: Note = {
        ...arr[idx],
        content: patch.content,
        updatedAt: Date.now(),
    }
    const next = [...arr]
    next[idx] = updated
    all[promptId] = next
    writeAll(all)
    return updated
}

export function deleteNote(promptId: string, noteId: string): void {
    const all = readAll()
    const arr = all[promptId] ?? []
    const next = arr.filter((n) => n.id !== noteId)
    all[promptId] = next
    writeAll(all)
}
