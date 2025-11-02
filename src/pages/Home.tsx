import { useEffect, useMemo, useState } from "react"
import { Grid, Stack, Typography } from "@mui/material"
import PromptForm from "@/components/PromptForm"
import PromptCard from "@/components/PromptCard"
import type { Prompt } from "@/types"
import {
    deletePrompt as removeFromStorage,
    getPrompts,
    savePrompt as saveToStorage,
} from "@/utils/storage"
import { trackModel, estimateTokens } from "@/utils/metadata"

export default function Home() {
    const [prompts, setPrompts] = useState<Prompt[]>([])

    useEffect(() => {
        setPrompts(getPrompts())
    }, [])

    const handleSave = (data: {
        title: string
        content: string
        modelName: string
        isCode: boolean
    }) => {
        const id =
            typeof crypto !== "undefined" && "randomUUID" in crypto
                ? crypto.randomUUID()
                : `${Date.now()}`
        try {
            let metadata = trackModel(data.modelName, data.content)
            // If the user marks prompt as code-heavy, adjust token estimate
            if (data.isCode) {
                metadata = {
                    ...metadata,
                    tokenEstimate: estimateTokens(data.content, true),
                }
            }
            const prompt: Prompt = {
                id,
                title: data.title,
                content: data.content,
                createdAt: Date.now(),
                metadata,
            }
            saveToStorage(prompt)
            setPrompts((prev: Prompt[]) => sortDesc([prompt, ...prev]))
        } catch (err) {
            // Basic error surfacing; in a larger app we might use a snackbar
            console.error(err)
            alert(
                err instanceof Error ? err.message : "Failed to create metadata"
            )
        }
    }

    const handleDelete = (id: string) => {
        removeFromStorage(id)
        setPrompts((prev: Prompt[]) => prev.filter((p: Prompt) => p.id !== id))
    }

    const hasPrompts = useMemo(() => prompts.length > 0, [prompts])

    // Sort prompts by metadata.createdAt (desc), fallback to prompt.createdAt
    function sortDesc(list: Prompt[]): Prompt[] {
        const copy = [...list]
        copy.sort((a, b) => {
            const aTime = a.metadata?.createdAt
                ? Date.parse(a.metadata.createdAt)
                : a.createdAt
            const bTime = b.metadata?.createdAt
                ? Date.parse(b.metadata.createdAt)
                : b.createdAt
            return bTime - aTime
        })
        return copy
    }

    return (
        <Stack spacing={3}>
            <PromptForm onSave={handleSave} />

            <div>
                <Typography
                    variant="subtitle2"
                    sx={{ color: "text.secondary", mb: 1 }}
                >
                    Saved prompts ({prompts.length})
                </Typography>
                {hasPrompts ? (
                    <Grid container spacing={2}>
                        {sortDesc(prompts).map((p) => (
                            <Grid item key={p.id} xs={12} sm={6}>
                                <PromptCard
                                    prompt={p}
                                    onDelete={handleDelete}
                                />
                            </Grid>
                        ))}
                    </Grid>
                ) : (
                    <Typography
                        variant="body2"
                        sx={{ color: "text.secondary" }}
                    >
                        No saved prompts yet. Add your first one above.
                    </Typography>
                )}
            </div>
        </Stack>
    )
}
