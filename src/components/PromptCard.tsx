import React from "react"
import {
    Card,
    CardContent,
    CardActions,
    Typography,
    IconButton,
    Tooltip,
    Stack,
    Rating,
} from "@mui/material"
import DeleteIcon from "@mui/icons-material/DeleteOutline"
import type { Prompt } from "@/types"
import {
    getRating as getStoredRating,
    setRating as setStoredRating,
} from "@/utils/storage"
import NotesSection from "@/components/NotesSection"

interface Props {
    prompt: Prompt
    onDelete: (id: string) => void
}

function preview(content: string, words = 12): string {
    const parts = content.trim().split(/\s+/)
    const head = parts.slice(0, words).join(" ")
    return parts.length > words ? head + "…" : head
}

export default function PromptCard({ prompt, onDelete }: Props) {
    const [rating, setRating] = React.useState<number>(0)

    React.useEffect(() => {
        setRating(getStoredRating(prompt.id))
    }, [prompt.id])

    const handleRatingChange = (
        _event: React.SyntheticEvent<Element, Event>,
        value: number | null
    ) => {
        const next = value === rating ? 0 : value ?? 0
        setRating(next)
        setStoredRating(prompt.id, next)
    }

    return (
        <Card
            variant="outlined"
            sx={{ height: "100%", display: "flex", flexDirection: "column" }}
        >
            <CardContent sx={{ flexGrow: 1 }}>
                <Stack
                    direction="row"
                    alignItems="flex-start"
                    justifyContent="space-between"
                    spacing={1}
                >
                    <Typography variant="h6" sx={{ pr: 1 }}>
                        {prompt.title}
                    </Typography>
                    <Tooltip
                        title={
                            rating ? `Rated ${rating}/5` : "Rate this prompt"
                        }
                    >
                        <Rating
                            value={rating}
                            onChange={handleRatingChange}
                            max={5}
                            size="small"
                            aria-label={`Rate ${prompt.title}`}
                        />
                    </Tooltip>
                </Stack>
                <Typography
                    variant="body2"
                    sx={{ mt: 1.5, color: "text.secondary" }}
                >
                    {preview(prompt.content)}
                </Typography>

                {/* Notes section for this prompt */}
                <NotesSection promptId={prompt.id} />
            </CardContent>
            <CardActions sx={{ justifyContent: "flex-end" }}>
                <Tooltip title="Delete prompt">
                    <IconButton
                        color="error"
                        onClick={() => onDelete(prompt.id)}
                        aria-label="delete prompt"
                    >
                        <DeleteIcon />
                    </IconButton>
                </Tooltip>
            </CardActions>
        </Card>
    )
}
