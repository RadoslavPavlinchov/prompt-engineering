import {
    Card,
    CardContent,
    CardActions,
    Typography,
    IconButton,
    Tooltip,
    Stack,
} from "@mui/material"
import DeleteIcon from "@mui/icons-material/DeleteOutline"
import type { Prompt } from "@/types"

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
                </Stack>
                <Typography
                    variant="body2"
                    sx={{ mt: 1.5, color: "text.secondary" }}
                >
                    {preview(prompt.content)}
                </Typography>
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
