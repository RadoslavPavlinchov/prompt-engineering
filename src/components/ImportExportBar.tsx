import React from "react"
import {
    Stack,
    Button,
    Tooltip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    DialogContentText,
    RadioGroup,
    FormControlLabel,
    Radio,
    Alert,
    Typography,
    List,
    ListItem,
    ListItemText,
} from "@mui/material"
import UploadIcon from "@mui/icons-material/Upload"
import DownloadIcon from "@mui/icons-material/Download"
import { exportPromptsToFile, analyzeImportFile, applyImport, type ImportMode } from "@/utils/exportImport"
import { getPrompts } from "@/utils/storage"

interface Props {
    onDataChanged?: (count: number) => void
}

export default function ImportExportBar({ onDataChanged }: Props) {
    const fileInputRef = React.useRef<HTMLInputElement>(null)

    const [dialogOpen, setDialogOpen] = React.useState(false)
    const [error, setError] = React.useState<string | null>(null)

    const [analysis, setAnalysis] = React.useState<
        | null
        | (Awaited<ReturnType<typeof analyzeImportFile>> & { file: File })
    >(null)

    const [mode, setMode] = React.useState<ImportMode>("merge-skip")
    const [busy, setBusy] = React.useState(false)
    const [resultMessage, setResultMessage] = React.useState<string | null>(
        null
    )

    const triggerChooseFile = () => {
        setError(null)
        setResultMessage(null)
        fileInputRef.current?.click()
    }

    const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        e.currentTarget.value = "" // reset so same file can be selected again
        if (!file) return

        setBusy(true)
        try {
            const res = await analyzeImportFile(file)
            if (!res.analysis.valid) {
                setError(res.analysis.reason ?? "Invalid import file")
                setAnalysis(null)
                setDialogOpen(false)
                return
            }
            setAnalysis({ ...res, file })
            setDialogOpen(true)

            // default mode: if there are conflicts, prefer merge-overwrite suggestion
            if (res.analysis.conflicts && res.analysis.conflicts.length > 0) {
                setMode("merge-overwrite")
            } else {
                setMode("merge-skip")
            }
        } catch (err) {
            setError(
                err instanceof Error ? err.message : "Failed to read file"
            )
            setAnalysis(null)
            setDialogOpen(false)
        } finally {
            setBusy(false)
        }
    }

    const handleApply = async () => {
        if (!analysis?.payload) return
        setBusy(true)
        setError(null)
        setResultMessage(null)
        try {
            const res = await applyImport(analysis.payload, mode)
            if (!res.applied) {
                setError(res.errors[0] || "Import failed")
                return
            }
            setDialogOpen(false)
            const prompts = getPrompts()
            onDataChanged?.(prompts.length)
            setResultMessage(
                `Import complete: ${res.imported} added, ${res.overwritten} overwritten, ${res.skipped} skipped, ${res.duplicated} duplicated.`
            )
        } catch (e) {
            setError(
                e instanceof Error ? e.message : "Failed to apply import"
            )
        } finally {
            setBusy(false)
        }
    }

    return (
        <>
            <Stack direction="row" spacing={1} justifyContent="flex-end">
                {resultMessage && (
                    <Alert severity="success" sx={{ mr: "auto" }}>
                        {resultMessage}
                    </Alert>
                )}
                {error && (
                    <Alert severity="error" sx={{ mr: "auto" }}>
                        {error}
                    </Alert>
                )}
                <input
                    type="file"
                    accept="application/json"
                    ref={fileInputRef}
                    style={{ display: "none" }}
                    onChange={onFileChange}
                />
                <Tooltip title="Export prompts to a JSON file">
                    <Button
                        variant="outlined"
                        startIcon={<DownloadIcon />}
                        onClick={() => exportPromptsToFile()}
                    >
                        Export
                    </Button>
                </Tooltip>
                <Tooltip title="Import prompts from a JSON file">
                    <Button
                        variant="contained"
                        startIcon={<UploadIcon />}
                        onClick={triggerChooseFile}
                        disabled={busy}
                    >
                        Import
                    </Button>
                </Tooltip>
            </Stack>

            <Dialog
                open={dialogOpen}
                onClose={() => !busy && setDialogOpen(false)}
                fullWidth
                maxWidth="sm"
            >
                <DialogTitle>Import prompts</DialogTitle>
                <DialogContent>
                    {analysis && (
                        <>
                            <DialogContentText sx={{ mb: 2 }}>
                                File contains {analysis.analysis.importedCount}
                                {" "}
                                prompts. Version {analysis.analysis.version}.
                            </DialogContentText>

                            {analysis.analysis.hasInternalDuplicates && (
                                <Alert severity="warning" sx={{ mb: 2 }}>
                                    This file contains duplicate IDs: {" "}
                                    {analysis.analysis.duplicateIds?.join(", ")}
                                </Alert>
                            )}

                            {analysis.analysis.conflicts &&
                                analysis.analysis.conflicts.length > 0 && (
                                    <Alert severity="info" sx={{ mb: 2 }}>
                                        {analysis.analysis.conflicts.length} ID
                                        conflicts with existing prompts found.
                                    </Alert>
                                )}

                            {analysis.analysis.conflicts &&
                                analysis.analysis.conflicts.length > 0 && (
                                    <>
                                        <Typography variant="subtitle2" sx={{ mb: 1 }}>
                                            Conflicts
                                        </Typography>
                                        <List dense sx={{ maxHeight: 200, overflow: "auto", mb: 2 }}>
                                            {analysis.analysis.conflicts.map((c) => (
                                                <ListItem key={c.id}>
                                                    <ListItemText
                                                        primary={`ID ${c.id}`}
                                                        secondary={`Existing: ${c.existingTitle} | Incoming: ${c.incomingTitle}`}
                                                    />
                                                </ListItem>
                                            ))}
                                        </List>
                                    </>
                                )}

                            <Typography variant="subtitle2" sx={{ mb: 1 }}>
                                Choose how to resolve conflicts
                            </Typography>
                            <RadioGroup
                                value={mode}
                                onChange={(e) =>
                                    setMode(e.target.value as ImportMode)
                                }
                            >
                                <FormControlLabel
                                    value="replace"
                                    control={<Radio />}
                                    label="Replace all existing prompts"
                                />
                                <FormControlLabel
                                    value="merge-overwrite"
                                    control={<Radio />}
                                    label="Merge and overwrite existing on ID conflict"
                                />
                                <FormControlLabel
                                    value="merge-skip"
                                    control={<Radio />}
                                    label="Merge and keep existing on ID conflict (skip incoming)"
                                />
                                <FormControlLabel
                                    value="merge-duplicate"
                                    control={<Radio />}
                                    label="Merge and keep both on conflict (assign new IDs to incoming)"
                                />
                            </RadioGroup>
                        </>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDialogOpen(false)} disabled={busy}>
                        Cancel
                    </Button>
                    <Button onClick={handleApply} disabled={busy} variant="contained">
                        {busy ? "Importing…" : "Import"}
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    )
}
