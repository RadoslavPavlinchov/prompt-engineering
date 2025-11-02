import { useState, type FormEvent, type ChangeEvent } from "react"
import {
    Box,
    Stack,
    TextField,
    Button,
    Paper,
    Typography,
    FormControlLabel,
    Switch,
} from "@mui/material"

interface Props {
    onSave: (data: {
        title: string
        content: string
        modelName: string
        isCode: boolean
    }) => void
}

export default function PromptForm({ onSave }: Props) {
    const [title, setTitle] = useState("")
    const [content, setContent] = useState("")
    const [modelName, setModelName] = useState("")
    const [isCode, setIsCode] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const canSave =
        title.trim().length > 0 &&
        content.trim().length > 0 &&
        modelName.trim().length > 0 &&
        modelName.trim().length <= 100

    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setError(null)
        if (!canSave) {
            setError(
                modelName.trim().length === 0
                    ? "Model name is required"
                    : modelName.trim().length > 100
                    ? "Model name must be at most 100 characters"
                    : "Please fill in all fields"
            )
            return
        }
        try {
            onSave({
                title: title.trim(),
                content: content.trim(),
                modelName: modelName.trim(),
                isCode,
            })
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Unknown error"
            setError(msg)
            return
        }
        setTitle("")
        setContent("")
        setModelName("")
        setIsCode(false)
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
                    label="Model name"
                    placeholder="e.g. gpt-4o, llama3-70b, etc."
                    value={modelName}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        setModelName(e.target.value)
                    }
                    inputProps={{ maxLength: 100 }}
                    required
                    error={Boolean(error) && modelName.trim().length === 0}
                    helperText={
                        Boolean(error) && modelName.trim().length === 0
                            ? error
                            : undefined
                    }
                />
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
                <FormControlLabel
                    control={
                        <Switch
                            checked={isCode}
                            onChange={(e) => setIsCode(e.target.checked)}
                        />
                    }
                    label="Contains code"
                />
                {error && modelName.trim().length > 0 && (
                    <Typography variant="body2" color="error">
                        {error}
                    </Typography>
                )}
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
