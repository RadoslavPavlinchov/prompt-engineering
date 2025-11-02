import { useState, type FormEvent, type ChangeEvent } from "react"
import { Box, Stack, TextField, Button, Paper, Typography } from "@mui/material"

interface Props {
    onSave: (data: { title: string; content: string }) => void
}

export default function PromptForm({ onSave }: Props) {
    const [title, setTitle] = useState("")
    const [content, setContent] = useState("")

    const canSave = title.trim().length > 0 && content.trim().length > 0

    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        if (!canSave) return
        onSave({ title: title.trim(), content: content.trim() })
        setTitle("")
        setContent("")
    }

    return (
        <Paper
            component="form"
            onSubmit={handleSubmit}
            sx={{ p: 2.5, mb: 3 }}
            elevation={0}
        >
            <Stack spacing={2}>
                <Box>
                    <Typography
                        variant="subtitle2"
                        sx={{ color: "text.secondary", mb: 1 }}
                    >
                        Add a new prompt
                    </Typography>
                    <TextField
                        label="Title"
                        placeholder="e.g. Blog post outline"
                        value={title}
                        onChange={(e: ChangeEvent<HTMLInputElement>) =>
                            setTitle(e.target.value)
                        }
                    />
                </Box>
                <TextField
                    label="Content"
                    placeholder="Write your prompt here..."
                    value={content}
                    onChange={(
                        e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
                    ) => setContent(e.target.value)}
                    multiline
                    minRows={4}
                />
                <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                    <Button
                        type="submit"
                        variant="contained"
                        disabled={!canSave}
                    >
                        Save prompt
                    </Button>
                </Box>
            </Stack>
        </Paper>
    )
}
