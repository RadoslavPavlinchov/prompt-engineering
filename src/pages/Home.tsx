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

export default function Home() {
    const [prompts, setPrompts] = useState<Prompt[]>([])

    useEffect(() => {
        setPrompts(getPrompts())
    }, [])

    const handleSave = (data: { title: string; content: string }) => {
        const id =
            typeof crypto !== "undefined" && "randomUUID" in crypto
                ? crypto.randomUUID()
                : `${Date.now()}`
        const prompt: Prompt = {
            id,
            title: data.title,
            content: data.content,
            createdAt: Date.now(),
        }
        saveToStorage(prompt)
        setPrompts((prev: Prompt[]) => [prompt, ...prev])
    }

    const handleDelete = (id: string) => {
        removeFromStorage(id)
        setPrompts((prev: Prompt[]) => prev.filter((p: Prompt) => p.id !== id))
    }

    const hasPrompts = useMemo(() => prompts.length > 0, [prompts])

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
                        {prompts.map((p) => (
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
