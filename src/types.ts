export interface Prompt {
    id: string
    title: string
    content: string
    createdAt: number
    /** Optional 0..5 star rating stored per user (local only) */
    rating?: number
}

// Notes feature types
export interface Note {
    id: string
    promptId: string
    content: string
    createdAt: number
    updatedAt: number
}

export type NotesMap = Record<string, Note[]> // promptId -> notes array
