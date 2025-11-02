import type { Prompt } from "@/types"
import { getPrompts } from "@/utils/storage"
import { getAllRatingsMap } from "@/utils/storage"

// ---- Export schema ----
export const EXPORT_VERSION = 1 as const

export interface ExportStats {
    totalPrompts: number
    averageRating: number // 0..5
    mostUsedModel: string | null
}

export interface ExportFileV1 {
    version: typeof EXPORT_VERSION
    exportedAt: string // ISO 8601
    stats: ExportStats
    prompts: Prompt[]
}

// ---- Helpers ----
function isoNow(): string {
    return new Date().toISOString()
}

function computeStats(prompts: Prompt[]): ExportStats {
    const ratings = getAllRatingsMap()
    const ratedValues: number[] = []
    for (const p of prompts) {
        const r = ratings[p.id]
        if (typeof r === "number" && r > 0) ratedValues.push(r)
    }
    const averageRating = ratedValues.length
        ? Number(
              (
                  ratedValues.reduce((a, b) => a + b, 0) / ratedValues.length
              ).toFixed(2)
          )
        : 0

    // model usage counts
    const counts: Record<string, number> = {}
    for (const p of prompts) {
        const m = p.metadata?.model?.trim()
        if (!m) continue
        counts[m] = (counts[m] ?? 0) + 1
    }
    let mostUsedModel: string | null = null
    let max = 0
    for (const [m, c] of Object.entries(counts)) {
        if (c > max) {
            max = c
            mostUsedModel = m
        }
    }

    return {
        totalPrompts: prompts.length,
        averageRating,
        mostUsedModel,
    }
}

function validatePromptShape(p: any): p is Prompt {
    return (
        p &&
        typeof p === "object" &&
        typeof p.id === "string" &&
        typeof p.title === "string" &&
        typeof p.content === "string" &&
        typeof p.createdAt === "number"
    )
}

export function buildExportPayload(): ExportFileV1 {
    const prompts = getPrompts()
    // basic validation to avoid exporting corrupt data
    const ok = prompts.every(validatePromptShape)
    if (!ok) {
        throw new Error("Storage contains invalid prompt records")
    }
    const payload: ExportFileV1 = {
        version: EXPORT_VERSION,
        exportedAt: isoNow(),
        stats: computeStats(prompts),
        prompts,
    }
    return payload
}

export function exportPromptsToFile(): void {
    const payload = buildExportPayload()
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: "application/json",
    })

    const ts = new Date().toISOString().replace(/[:]/g, "-").replace(/\..+/, "")
    const filename = `prompts-export-${ts}.json`

    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
}

// ---- Import ----
export type ImportMode =
    | "replace" // replace everything with file prompts
    | "merge-skip" // merge; skip imported that conflict
    | "merge-overwrite" // merge; overwrite existing on conflict
    | "merge-duplicate" // merge; keep both by changing conflicting imported IDs

export interface ImportPlanConflict {
    id: string
    existingTitle: string
    incomingTitle: string
}

export interface ImportAnalysis {
    valid: boolean
    reason?: string
    version?: number
    hasInternalDuplicates?: boolean
    duplicateIds?: string[]
    conflicts?: ImportPlanConflict[]
    importedCount?: number
}

export interface ImportResult {
    applied: boolean
    mode: ImportMode
    imported: number
    skipped: number
    overwritten: number
    duplicated: number
    errors: string[]
}

const PROMPTS_KEY = "prompt-library.prompts"
const BACKUP_PREFIX = "prompt-library.backup:"

function readLocal<T>(key: string, fallback: T): T {
    try {
        const raw = localStorage.getItem(key)
        return raw ? (JSON.parse(raw) as T) : fallback
    } catch {
        return fallback
    }
}

function writeLocal(key: string, value: unknown) {
    localStorage.setItem(key, JSON.stringify(value))
}

function backupPrompts(): string {
    const now = isoNow()
    const prompts = readLocal<Prompt[]>(PROMPTS_KEY, [])
    const payload = { createdAt: now, prompts }
    const key = `${BACKUP_PREFIX}${now}`
    writeLocal(key, payload)
    return key
}

function restoreBackup(key: string) {
    const data = readLocal<{ createdAt: string; prompts: Prompt[] } | null>(
        key,
        null
    )
    if (!data) return
    writeLocal(PROMPTS_KEY, data.prompts)
}

export async function analyzeImportFile(
    file: File
): Promise<{ analysis: ImportAnalysis; payload?: ExportFileV1 }> {
    const text = await file.text()
    let data: any
    try {
        data = JSON.parse(text)
    } catch {
        return { analysis: { valid: false, reason: "Invalid JSON" } }
    }

    if (!data || typeof data !== "object") {
        return { analysis: { valid: false, reason: "Invalid payload" } }
    }
    if (data.version !== EXPORT_VERSION) {
        return {
            analysis: {
                valid: false,
                reason: `Unsupported version ${data.version}`,
                version: data.version,
            },
        }
    }
    const prompts: any[] = Array.isArray(data.prompts) ? data.prompts : []
    if (!prompts.length) {
        return { analysis: { valid: false, reason: "No prompts to import" } }
    }
    if (!prompts.every(validatePromptShape)) {
        return {
            analysis: {
                valid: false,
                reason: "One or more prompts are invalid",
            },
        }
    }

    // check duplicates within file
    const seen = new Set<string>()
    const dupIds: string[] = []
    for (const p of prompts as Prompt[]) {
        if (seen.has(p.id)) dupIds.push(p.id)
        seen.add(p.id)
    }

    const existing = readLocal<Prompt[]>(PROMPTS_KEY, [])
    const existingMap = new Map(existing.map((p) => [p.id, p]))
    const conflicts: ImportPlanConflict[] = []
    for (const p of prompts as Prompt[]) {
        const e = existingMap.get(p.id)
        if (e) {
            conflicts.push({
                id: p.id,
                existingTitle: e.title,
                incomingTitle: p.title,
            })
        }
    }

    return {
        analysis: {
            valid: true,
            version: data.version,
            importedCount: prompts.length,
            hasInternalDuplicates: dupIds.length > 0,
            duplicateIds: dupIds,
            conflicts,
        },
        payload: data as ExportFileV1,
    }
}

export async function applyImport(
    payload: ExportFileV1,
    mode: ImportMode
): Promise<ImportResult> {
    const result: ImportResult = {
        applied: false,
        mode,
        imported: 0,
        skipped: 0,
        overwritten: 0,
        duplicated: 0,
        errors: [],
    }

    // validate again defensively
    if (payload.version !== EXPORT_VERSION) {
        result.errors.push("Unsupported version")
        return result
    }
    if (
        !Array.isArray(payload.prompts) ||
        !payload.prompts.every(validatePromptShape)
    ) {
        result.errors.push("Invalid prompt data")
        return result
    }

    const backupKey = backupPrompts()
    try {
        const existing = readLocal<Prompt[]>(PROMPTS_KEY, [])
        const map = new Map(existing.map((p) => [p.id, p]))
        const next: Prompt[] = [...existing]

        for (const incoming of payload.prompts) {
            const has = map.has(incoming.id)
            if (!has) {
                map.set(incoming.id, incoming)
                next.push(incoming)
                result.imported += 1
                continue
            }
            // conflict
            switch (mode) {
                case "replace":
                    // handled after loop
                    break
                case "merge-skip":
                    result.skipped += 1
                    break
                case "merge-overwrite":
                    {
                        const idx = next.findIndex((p) => p.id === incoming.id)
                        if (idx >= 0) {
                            next[idx] = incoming
                            map.set(incoming.id, incoming)
                            result.overwritten += 1
                        }
                    }
                    break
                case "merge-duplicate":
                    {
                        // generate new id deterministically based on time + random
                        const newId = `${incoming.id}-${Date.now().toString(
                            36
                        )}-${Math.random().toString(36).slice(2, 6)}`
                        const dup: Prompt = { ...incoming, id: newId }
                        map.set(newId, dup)
                        next.push(dup)
                        result.duplicated += 1
                    }
                    break
            }
        }

        if (mode === "replace") {
            writeLocal(PROMPTS_KEY, payload.prompts)
            result.imported = payload.prompts.length
            result.skipped = 0
            result.overwritten = 0
            result.duplicated = 0
        } else {
            // de-duplicate next by id while preserving last write
            const finalMap = new Map(next.map((p) => [p.id, p]))
            const final = Array.from(finalMap.values())
            writeLocal(PROMPTS_KEY, final)
        }

        result.applied = true
        return result
    } catch (e) {
        // rollback
        try {
            restoreBackup(backupKey)
        } catch {}
        result.errors.push(
            e instanceof Error ? e.message : "Import failed unexpectedly"
        )
        return result
    }
}
