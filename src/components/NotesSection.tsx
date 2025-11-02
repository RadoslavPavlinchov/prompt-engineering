import React from "react"
import {
    Box,
    Stack,
    Typography,
    TextField,
    Button,
    Divider,
} from "@mui/material"
import type { Note } from "@/types"
import { addNote, getNotes, updateNote, deleteNote } from "@/utils/notesStorage"
import NoteItem from "@/components/NoteItem"

interface Props {
    promptId: string
}

export default function NotesSection({ promptId }: Props) {
    const [notes, setNotes] = React.useState<Note[]>([])
    const [input, setInput] = React.useState("")
    const [error, setError] = React.useState<string | null>(null)
    const [status, setStatus] = React.useState<"idle" | "saving">("idle")

    const canAdd = input.trim().length > 0

    const refresh = React.useCallback(() => {
        try {
            setNotes(getNotes(promptId))
        } catch (e) {
            setError("Failed to load notes.")
        }
    }, [promptId])

    React.useEffect(() => {
        refresh()
    }, [refresh])

    const handleAdd = () => {
        if (!canAdd) return
        try {
            setStatus("saving")
            addNote(promptId, input.trim())
            setInput("")
            setError(null)
            refresh()
        } catch (e) {
            setError("Could not save note (storage error).")
        } finally {
            setStatus("idle")
        }
    }

    const handleSave = (id: string, content: string) => {
        try {
            const existingNote = notes.find((note) => note.id === id)
            updateNote(promptId, {
                id,
                promptId,
                content,
                createdAt: existingNote ? existingNote.createdAt : Date.now(),
                updatedAt: Date.now(),
            })
            setError(null)
            refresh()
        } catch (e) {
            setError("Could not save note (storage error).")
            throw e
        }
    }

    const handleDelete = (id: string) => {
        try {
            deleteNote(promptId, id)
            setError(null)
            refresh()
        } catch (e) {
            setError("Could not delete note (storage error).")
            throw e
        }
    }

    return (
        <section
            className="notes-section"
            data-prompt-id={promptId}
            aria-label="Notes"
        >
            <Divider sx={{ my: 2 }} />
            <Typography
                variant="subtitle2"
                sx={{ color: "text.secondary", mb: 1 }}
            >
                Notes ({notes.length})
            </Typography>

            <Box sx={{ mb: 2 }}>
                <TextField
                    label="Add a note"
                    placeholder="Write a note about using this prompt…"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    multiline
                    minRows={2}
                    fullWidth
                    aria-label="Add note"
                    onKeyDown={(e) => {
                        if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                            e.preventDefault()
                            handleAdd()
                        }
                    }}
                />
                <Stack
                    direction="row"
                    spacing={1}
                    alignItems="center"
                    justifyContent="flex-end"
                    sx={{ mt: 1 }}
                >
                    {error && (
                        <Typography
                            variant="caption"
                            color="error"
                            sx={{ mr: "auto" }}
                        >
                            {error}
                        </Typography>
                    )}
                    <Button
                        variant="contained"
                        onClick={handleAdd}
                        disabled={!canAdd || status === "saving"}
                        aria-label="Add note"
                    >
                        {status === "saving" ? "Saving…" : "Add Note"}
                    </Button>
                </Stack>
            </Box>

            <Stack spacing={1.5}>
                {notes.map((n) => (
                    <Box
                        key={n.id}
                        sx={{
                            p: 1.25,
                            border: 1,
                            borderColor: "divider",
                            borderRadius: 1,
                        }}
                    >
                        <NoteItem
                            note={n}
                            onSave={async (content) =>
                                handleSave(n.id, content)
                            }
                            onDelete={async () => handleDelete(n.id)}
                        />
                    </Box>
                ))}
                {notes.length === 0 && (
                    <Typography
                        variant="body2"
                        sx={{ color: "text.secondary" }}
                    >
                        No notes yet. Add your first note above.
                    </Typography>
                )}
            </Stack>
        </section>
    )
}
