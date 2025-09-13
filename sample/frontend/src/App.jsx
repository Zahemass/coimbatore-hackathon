import React from "react";
import { Routes, Route } from "react-router-dom";
import AdminLogin from "./components/AdminLogin";
import AddStudent from "./pages/AddStudent";
import Attendance from "./pages/Attendance";
import StudentList from "./components/StudentList";
import PollSummary from "./pages/PollSummary";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";

const theme = createTheme({
  palette: {
    primary: {
      main: "#007BFF",
    },
    secondary: {
      main: "#28A745",
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Routes>
        <Route path="/" element={<AdminLogin />} />
        <Route path="/dashboard" element={<AddStudent />} />
        <Route path="/attendance" element={<Attendance />} />
        <Route path="/students" element={<StudentList />} />
        <Route path="/poll-summary" element={<PollSummary />} />
      </Routes>
    </ThemeProvider>
  );
}

export default App;