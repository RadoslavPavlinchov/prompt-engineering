import type { MetadataObject, TokenEstimate, TokenConfidence } from "@/types"

// Validate ISO 8601 format with Zulu timezone
const ISO_REGEX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/

function isoNow(): string {
    return new Date().toISOString()
}

function assertISODate(value: string, fieldName: string) {
    if (typeof value !== "string" || !ISO_REGEX.test(value)) {
        throw new Error(
            `${fieldName} must be a valid ISO 8601 string (YYYY-MM-DDTHH:mm:ss.sssZ)`
        )
    }
    const t = Date.parse(value)
    if (Number.isNaN(t)) {
        throw new Error(`${fieldName} is not a parseable date`)
    }
}

function clampNonNegative(n: number): number {
    return Number.isFinite(n) && n > 0 ? n : 0
}

function countWords(text: string): number {
    const t = (text ?? "").trim()
    if (!t) return 0
    // Split by whitespace, collapse multiples
    return t.split(/\s+/).filter(Boolean).length
}

export function estimateTokens(text: string, isCode: boolean): TokenEstimate {
    if (typeof text !== "string") {
        throw new Error("estimateTokens: text must be a string")
    }
    const words = countWords(text)
    const chars = (text ?? "").length

    let min = 0.75 * words
    let max = 0.25 * chars

    if (isCode) {
        min *= 1.3
        max *= 1.3
    }

    // Normalize to integers
    const minInt = Math.max(0, Math.floor(min))
    const maxInt = Math.max(minInt, Math.ceil(max))

    // Confidence based on conservative upper bound
    const upper = maxInt
    let confidence: TokenConfidence
    if (upper < 1000) confidence = "high"
    else if (upper <= 5000) confidence = "medium"
    else confidence = "low"

    return {
        min: clampNonNegative(minInt),
        max: clampNonNegative(maxInt),
        confidence,
    }
}

export function trackModel(modelName: string, content: string): MetadataObject {
    if (typeof modelName !== "string" || modelName.trim().length === 0) {
        throw new Error("Model name must be a non-empty string")
    }
    const trimmed = modelName.trim()
    if (trimmed.length > 100) {
        throw new Error("Model name must be at most 100 characters")
    }

    const createdAt = isoNow()
    const tokenEstimate = estimateTokens(content, false)

    const metadata: MetadataObject = {
        model: trimmed,
        createdAt,
        updatedAt: createdAt,
        tokenEstimate,
    }

    // Validate before returning
    assertISODate(metadata.createdAt, "createdAt")
    assertISODate(metadata.updatedAt, "updatedAt")

    return metadata
}

export function updateTimestamps(metadata: MetadataObject): MetadataObject {
    if (!metadata || typeof metadata !== "object") {
        throw new Error("updateTimestamps: metadata must be provided")
    }
    assertISODate(metadata.createdAt, "createdAt")

    const updatedAt = isoNow()
    assertISODate(updatedAt, "updatedAt")

    const createdMs = Date.parse(metadata.createdAt)
    const updatedMs = Date.parse(updatedAt)
    if (updatedMs < createdMs) {
        throw new Error("updatedAt must be greater than or equal to createdAt")
    }

    return { ...metadata, updatedAt }
}

// Optional helper to format for display
export function formatHuman(dateISO: string): string {
    try {
        assertISODate(dateISO, "date")
        const d = new Date(dateISO)
        return new Intl.DateTimeFormat(undefined, {
            year: "numeric",
            month: "short",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
        }).format(d)
    } catch {
        return dateISO
    }
}
