import React from "react"
import {
    Box,
    Stack,
    Typography,
    IconButton,
    TextField,
    Button,
    Tooltip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
} from "@mui/material"
import EditIcon from "@mui/icons-material/Edit"
import DeleteIcon from "@mui/icons-material/DeleteOutline"
import SaveIcon from "@mui/icons-material/CheckCircleOutline"
import CloseIcon from "@mui/icons-material/Close"
import type { Note } from "@/types"

interface Props {
    note: Note
    onSave: (content: string) => Promise<void> | void
    onDelete: () => Promise<void> | void
}

export default function NoteItem({ note, onSave, onDelete }: Props) {
    const [editing, setEditing] = React.useState(false)
    const [content, setContent] = React.useState(note.content)
    const [confirmOpen, setConfirmOpen] = React.useState(false)
    const [status, setStatus] = React.useState<
        "idle" | "saving" | "saved" | "error"
    >("idle")

    React.useEffect(() => {
        // if note content changes externally, sync
        setContent(note.content)
    }, [note.content])

    const hasChanges = content.trim() !== note.content.trim()

    const handleStartEdit = () => setEditing(true)
    const handleCancel = () => {
        setContent(note.content)
        setEditing(false)
        setStatus("idle")
    }

    const handleSave = async () => {
        if (!hasChanges) return
        try {
            setStatus("saving")
            await onSave(content.trim())
            setStatus("saved")
            setEditing(false)
            // reset saved after a short delay
            setTimeout(() => setStatus("idle"), 1500)
        } catch {
            setStatus("error")
        }
    }

    const handleDelete = async () => {
        setConfirmOpen(false)
        await onDelete()
    }

    return (
        <article
            className="note-item"
            data-note-id={note.id}
            data-prompt-id={note.promptId}
            aria-label="Note"
        >
            {!editing ? (
                <Stack direction="row" spacing={1.5} alignItems="flex-start">
                    <Box sx={{ flex: 1 }}>
                        <Typography
                            variant="body2"
                            sx={{ whiteSpace: "pre-wrap" }}
                        >
                            {note.content}
                        </Typography>
                        <Typography
                            variant="caption"
                            sx={{ color: "text.secondary" }}
                        >
                            Updated {new Date(note.updatedAt).toLocaleString()}
                        </Typography>
                    </Box>
                    <Stack direction="row" spacing={0.5}>
                        <Tooltip title="Edit note">
                            <IconButton
                                aria-label="edit note"
                                onClick={handleStartEdit}
                                size="small"
                            >
                                <EditIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete note">
                            <IconButton
                                aria-label="delete note"
                                color="error"
                                onClick={() => setConfirmOpen(true)}
                                size="small"
                            >
                                <DeleteIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    </Stack>
                </Stack>
            ) : (
                <Box>
                    <TextField
                        label="Edit note"
                        aria-label="Edit note"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        multiline
                        minRows={3}
                        fullWidth
                        onKeyDown={(e) => {
                            if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                                e.preventDefault()
                                handleSave()
                            } else if (e.key === "Escape") {
                                e.preventDefault()
                                handleCancel()
                            }
                        }}
                    />
                    <Stack
                        direction="row"
                        spacing={1}
                        justifyContent="flex-end"
                        sx={{ mt: 1 }}
                    >
                        <Button
                            variant="outlined"
                            startIcon={<CloseIcon />}
                            onClick={handleCancel}
                            aria-label="Cancel editing note"
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="contained"
                            startIcon={<SaveIcon />}
                            disabled={!hasChanges || status === "saving"}
                            onClick={handleSave}
                            aria-label="Save note"
                        >
                            {status === "saving"
                                ? "Saving…"
                                : status === "saved"
                                ? "Saved"
                                : "Save"}
                        </Button>
                    </Stack>
                </Box>
            )}

            <Dialog
                open={confirmOpen}
                onClose={() => setConfirmOpen(false)}
                aria-labelledby="delete-title"
            >
                <DialogTitle id="delete-title">Delete note?</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        This action will permanently remove the note. Are you
                        sure you want to continue?
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setConfirmOpen(false)}>
                        Cancel
                    </Button>
                    <Button color="error" onClick={handleDelete} autoFocus>
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>
        </article>
    )
}
