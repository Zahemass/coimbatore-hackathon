import React, { useState } from "react";
import { AppBar, Toolbar, Typography, Button, Box, IconButton, Drawer, List, ListItem, ListItemText } from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import { Link } from "react-router-dom";
import logo from "../assets/logo.png"; // Ensure your logo is in the assets folder

function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  return (
    <>
      <AppBar position="static" sx={{ backgroundColor: "#2C3930" }}>
        <Toolbar>
          {/* Mobile Menu Button */}
          <IconButton
            color="inherit"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ display: { xs: "block", md: "none" } }}
          >
            <MenuIcon />
          </IconButton>

          {/* Logo and Title */}
          <Box sx={{ flexGrow: 1, display: "flex", alignItems: "center" }}>
            <img src={logo} alt="Logo" style={{ height: 50, marginRight: 10 }} />
            <Typography
              variant="h6"
              component={Link}
              to="/dashboard"
              sx={{ textDecoration: "none", color: "white" }}
            >
              Student Management
            </Typography>
          </Box>

          {/* Desktop Navigation */}
          <Box sx={{ display: { xs: "none", md: "block" } }}>
            <Button color="inherit" component={Link} to="/dashboard">Add Student</Button>
            <Button color="inherit" component={Link} to="/students">Student List</Button>
            <Button color="inherit" component={Link} to="/attendance">Attendance</Button>
            <Button color="inherit" component={Link} to="/poll-summary">Poll Summary</Button>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Mobile Drawer */}
      <Drawer
        anchor="left"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        sx={{ display: { xs: "block", md: "none" } }}
      >
        <List>
          <ListItem button component={Link} to="/dashboard" onClick={handleDrawerToggle}>
            <ListItemText primary="Add Student" />
          </ListItem>
          <ListItem button component={Link} to="/students" onClick={handleDrawerToggle}>
            <ListItemText primary="Student List" />
          </ListItem>
          <ListItem button component={Link} to="/attendance" onClick={handleDrawerToggle}>
            <ListItemText primary="Attendance" />
          </ListItem>
          <ListItem button component={Link} to="/polls" onClick={handleDrawerToggle}>
            <ListItemText primary="Polls" />
          </ListItem>
          <ListItem button component={Link} to="/poll-summary" onClick={handleDrawerToggle}>
            <ListItemText primary="Poll Summary" />
          </ListItem>
        </List>
      </Drawer>
    </>
  );
}

export default Navbar;
