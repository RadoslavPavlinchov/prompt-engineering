export interface Prompt {
    id: string
    title: string
    content: string
    createdAt: number
    /** Optional 0..5 star rating stored per user (local only) */
    rating?: number
    /** Optional metadata describing model usage and token estimates */
    metadata?: MetadataObject
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

// --- Metadata and tokens ---
export type TokenConfidence = "high" | "medium" | "low"

export interface TokenEstimate {
    min: number
    max: number
    confidence: TokenConfidence
}

export interface MetadataObject {
    model: string
    createdAt: string // ISO 8601
    updatedAt: string // ISO 8601
    tokenEstimate: TokenEstimate
}
