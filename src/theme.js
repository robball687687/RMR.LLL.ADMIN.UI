import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    primary: { main: "#2563eb" },    // LLL blue
    secondary: { main: "#f59e0b" },  // accent
    background: { default: "#f8fafc" }
  },
  shape: { borderRadius: 12 },
});

export default theme;
