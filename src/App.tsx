import { Container, Box, AppBar, Toolbar, Typography } from "@mui/material"
import Home from "./pages/Home"

export default function App() {
    return (
        <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
            <AppBar
                position="static"
                color="transparent"
                elevation={0}
                sx={{ borderBottom: 1, borderColor: "divider" }}
            >
                <Toolbar>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                        Prompt Library
                    </Typography>
                </Toolbar>
            </AppBar>
            <Container maxWidth="md" sx={{ py: 4 }}>
                <Home />
            </Container>
        </Box>
    )
}
