import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { 
  Container, Typography, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Paper, Button, 
  TextField, Box 
} from "@mui/material";
import Navbar from "../components/Navbar"; 

function Attendance() {
  const [attendance, setAttendance] = useState([]);
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split("T")[0]); // Default to today's date
  const [filterRegisterNumber, setFilterRegisterNumber] = useState(""); // Register Number filter
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAttendance = async () => {
      const response = await axios.get("http://localhost:5000/attendance");
      setAttendance(response.data);
    };
    fetchAttendance();
  }, []);

  // Filtering based on Date and Register Number
  const filteredAttendance = attendance.filter((record) =>
    (filterDate ? record.date === filterDate : true) &&
    (filterRegisterNumber ? record.registerNumber.includes(filterRegisterNumber) : true)
  );

  return (
    <>
    <Navbar />
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom>
          Attendance Records
        </Typography>
        <Box sx={{ mb: 3, display: "flex", gap: 2 }}>
          {/* Date Filter */}
          <TextField
            label="Filter by Date"
            type="date"
            variant="outlined"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            fullWidth
          />
          {/* Register Number Filter */}
          <TextField
            label="Filter by Register Number"
            variant="outlined"
            value={filterRegisterNumber}
            onChange={(e) => setFilterRegisterNumber(e.target.value)}
            fullWidth
          />
        </Box>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Register Number</TableCell>
                <TableCell>Student Name</TableCell>
                <TableCell>Department</TableCell>
                <TableCell>Shift</TableCell>
                <TableCell>Received Food</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredAttendance.map((record, index) => (
                <TableRow key={index}>
                  <TableCell>{record.date}</TableCell>
                  <TableCell>{record.registerNumber}</TableCell>
                  <TableCell>{record.name}</TableCell>
                  <TableCell>{record.department}</TableCell>
                  <TableCell>{record.shift}</TableCell>
                  <TableCell>{record.receivedFood ? "Yes" : "No"}</TableCell>

                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <Box sx={{ mt: 4 }}>
          <Button variant="contained" color="primary" onClick={() => navigate("/dashboard")}>
            Back to Dashboard
          </Button>
        </Box>
      </Paper>
    </Container>
    </>
  );
}

export default Attendance;
