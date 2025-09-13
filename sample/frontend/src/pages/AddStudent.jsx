import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Container,
  Typography,
  TextField,
  Button,
  Grid,
  Box,
  Paper,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from "@mui/material";
import Navbar from "../components/Navbar"; 

function AddStudent() {
  const [student, setStudent] = useState({
    name: "",
    registerNumber: "",
    department: "",
    shift: "",
  });
  const [qrCode, setQrCode] = useState("");
  const [qrMessage, setQrMessage] = useState("");

  // Fetch QR automatically
  const fetchQr = async () => {
    try {
      const response = await axios.get("http://localhost:5000/generate-qr");
      setQrCode(response.data.qrCode);
      setQrMessage("");
    } catch (error) {
      setQrCode("");
      setQrMessage("QR code is only available between 1 PM and 3 PM");
    }
  };

  // Run once on load + refresh every minute
  useEffect(() => {
    fetchQr();
    const interval = setInterval(fetchQr, 60000); // refresh every 60 sec
    return () => clearInterval(interval);
  }, []);

  const handleAddStudent = async () => {
    try {
      await axios.post("http://localhost:5000/add-student", student);
      alert("Student added successfully!");
      setStudent({ name: "", registerNumber: "", department: "", shift: "" });
    } catch (error) {
      console.error("Error adding student:", error);
      alert("Failed to add student.");
    }
  };

  return (
    <>
      <Navbar />
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h4" gutterBottom>
            Admin Panel - Add Student
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Student Name"
                variant="outlined"
                value={student.name}
                onChange={(e) => setStudent({ ...student, name: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Register Number"
                variant="outlined"
                value={student.registerNumber}
                onChange={(e) =>
                  setStudent({ ...student, registerNumber: e.target.value })
                }
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth variant="outlined">
                <InputLabel>Department</InputLabel>
                <Select
                  value={student.department}
                  onChange={(e) =>
                    setStudent({ ...student, department: e.target.value })
                  }
                  label="Department"
                >
                  <MenuItem value="BSc IT">BSc IT</MenuItem>
                  <MenuItem value="BSc CS">BSc CS</MenuItem>
                  <MenuItem value="BCA">BCA</MenuItem>
                  <MenuItem value="BSc DS">BSc DS</MenuItem>
                  <MenuItem value="BSc AI">BSc AI</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth variant="outlined">
                <InputLabel>Shift</InputLabel>
                <Select
                  value={student.shift}
                  onChange={(e) =>
                    setStudent({ ...student, shift: e.target.value })
                  }
                  label="Shift"
                >
                  <MenuItem value="I">I</MenuItem>
                  <MenuItem value="II">II</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <Button
                variant="contained"
                color="primary"
                onClick={handleAddStudent}
              >
                Add Student
              </Button>
            </Grid>
          </Grid>

          {/* QR Section */}
          <Box sx={{ mt: 4, textAlign: "center" }}>
            {qrCode ? (
              <>
                <Typography variant="h6" gutterBottom>
                  QR Code (Valid 1 PM - 3 PM)
                </Typography>
                <img
                  src={qrCode}
                  alt="QR Code"
                  style={{ width: "200px", height: "200px" }}
                />
              </>
            ) : (
              <Typography color="error">{qrMessage}</Typography>
            )}
          </Box>
        </Paper>
      </Container>
    </>
  );
}

export default AddStudent;
