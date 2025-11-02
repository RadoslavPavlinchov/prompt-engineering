import { createTheme } from "@mui/material/styles"

const theme = createTheme({
    palette: {
        mode: "dark",
        primary: { main: "#00bcd4" }, // cyan
        secondary: { main: "#ff6e40" }, // deep orange accent
        background: {
            default: "#0b0f14",
            paper: "#11161c",
        },
    },
    typography: {
        fontFamily: [
            "Inter",
            "Segoe UI",
            "Roboto",
            "Helvetica Neue",
            "Arial",
            "Noto Sans",
            "Apple Color Emoji",
            "Segoe UI Emoji",
            "Segoe UI Symbol",
        ].join(","),
        h6: { fontWeight: 700 },
        body2: { color: "#aab4be" },
        button: { textTransform: "none", fontWeight: 600 },
        code: {
            // used with sx={{ fontFamily: 'code' }} when desired
            fontFamily: [
                "Fira Code",
                "SFMono-Regular",
                "Consolas",
                "Monaco",
                "monospace",
            ].join(","),
        },
    } as any,
    shape: { borderRadius: 10 },
    components: {
        MuiCard: {
            styleOverrides: {
                root: {
                    border: "1px solid rgba(255,255,255,0.08)",
                    backgroundImage: "none",
                },
            },
        },
        MuiTextField: {
            defaultProps: {
                variant: "outlined",
                fullWidth: true,
            },
        },
    },
})

export default theme
