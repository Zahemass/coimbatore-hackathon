import React, { useEffect, useState } from "react";
import {
  Container,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  TextField,
  Grid,
  Box,
} from "@mui/material";
import { PieChart, Pie, Cell, Tooltip, Legend } from "recharts";
import Navbar from "../components/Navbar";

function PollSummary() {
  const [pollData, setPollData] = useState([]);
  const [count, setCount] = useState(0);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]); // default today

  useEffect(() => {
    fetchPollSummary(date);
  }, [date]);

  const fetchPollSummary = async (selectedDate) => {
    try {
      const res = await fetch(`http://localhost:5000/poll-summary/${selectedDate}`);
      const data = await res.json();
      setPollData(data.students || []);
      setCount(data.count || 0);
    } catch (err) {
      console.error("Error fetching poll summary:", err);
    }
  };

  const chartData = [
    { name: "YES", value: count },
    { name: "NO", value: pollData.length > 0 ? pollData.length - count : 0 },
  ];

  const COLORS = ["#4CAF50", "#F44336"];

  return (
    <>
      <Navbar />
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h4" gutterBottom>
            Poll Summary
          </Typography>

          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={4}>
              <TextField
                label="Select Date"
                type="date"
                variant="outlined"
                fullWidth
                value={date}
                onChange={(e) => setDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={2}>
              <Button
                variant="contained"
                color="primary"
                fullWidth
                sx={{ height: "100%" }}
                onClick={() => fetchPollSummary(date)}
              >
                Refresh
              </Button>
            </Grid>
          </Grid>

          {/* Chart + Total Count */}
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6">Total YES Votes</Typography>
                <Typography variant="h3" color="success.main">
                  {count}
                </Typography>
              </Paper>
            </Grid>

            <Grid item xs={12} md={6}>
              <PieChart width={300} height={250}>
                <Pie
                  data={chartData}
                  cx={150}
                  cy={120}
                  innerRadius={60}
                  outerRadius={90}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </Grid>
          </Grid>

          {/* Table */}
          <Box sx={{ mt: 4 }}>
            <Typography variant="h6" gutterBottom>
              Students Who Opted YES
            </Typography>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Register Number</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell>Department</TableCell>
                    <TableCell>Shift</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pollData.length > 0 ? (
                    pollData.map((student, index) => (
                      <TableRow key={index}>
                        <TableCell>{student.registerNumber}</TableCell>
                        <TableCell>{student.name}</TableCell>
                        <TableCell>{student.department}</TableCell>
                        <TableCell>{student.shift}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} align="center">
                        No students opted YES on this date
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </Paper>
      </Container>
    </>
  );
}

export default PollSummary;
