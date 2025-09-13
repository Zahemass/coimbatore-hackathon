import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  Button,
  Box,
} from "@mui/material";
import Navbar from "../components/Navbar"; 

function StudentList() {
  const [students, setStudents] = useState([]);
  const [filterDepartment, setFilterDepartment] = useState("");
  const navigate = useNavigate();

  // Fetch all students from the backend
  const fetchStudents = async () => {
    try {
      const response = await axios.get("http://localhost:5000/students");
      setStudents(response.data);
    } catch (error) {
      console.error("Error fetching students:", error);
      alert("Failed to fetch students.");
    }
  };

  // Fetch students on component mount
  useEffect(() => {
    fetchStudents();
  }, []);

  // Delete a student and re-generate QR codes for remaining students
  const handleDelete = async (registerNumber) => {
    try {
      // Delete the student
      await axios.delete(`http://localhost:5000/delete-student/${registerNumber}`);
      alert("Student deleted successfully!");

      // Re-fetch the updated student list
      fetchStudents();

      // Re-generate QR codes for all remaining students
      const studentsResponse = await axios.get("http://localhost:5000/students");
      for (const student of studentsResponse.data) {
        await axios.post("http://localhost:5000/generate-and-store-qr", {
          registerNumber: student.registerNumber,
        });
      }
    } catch (error) {
      console.error("Error deleting student:", error);
      alert("Failed to delete student.");
    }
  };

  // Filter students by department
  const filteredStudents = students.filter((student) =>
    filterDepartment ? student.department === filterDepartment : true
  );

  return (
    <>
    <Navbar />
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom>
          Student List
        </Typography>

        {/* Filter by Department */}
        <Box sx={{ mb: 3 }}>
          <TextField
            label="Filter by Department"
            variant="outlined"
            value={filterDepartment}
            onChange={(e) => setFilterDepartment(e.target.value)}
            sx={{ mr: 2 }}
          />
          <Button
            variant="contained"
            color="primary"
            onClick={() => setFilterDepartment("")}
          >
            Clear Filter
          </Button>
        </Box>

        {/* Student Table */}
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Student Name</TableCell>
                <TableCell>Register Number</TableCell>
                <TableCell>Department</TableCell>
                <TableCell>Shift</TableCell>
                <TableCell>Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredStudents.map((student, index) => (
                <TableRow key={index}>
                  <TableCell>{student.name}</TableCell>
                  <TableCell>{student.registerNumber}</TableCell>
                  <TableCell>{student.department}</TableCell>
                  <TableCell>{student.shift}</TableCell>
                  <TableCell>
                    <Button
                      variant="contained"
                      color="error"
                      onClick={() => handleDelete(student.registerNumber)}
                    >
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Back to Dashboard Button */}
        <Box sx={{ mt: 4 }}>
          <Button
            variant="contained"
            color="primary"
            onClick={() => navigate("/dashboard")}
          >
            Back to Dashboard
          </Button>
        </Box>
      </Paper>
    </Container>
    </>
  );
}

export default StudentList;