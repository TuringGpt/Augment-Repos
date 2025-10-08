import { Box, Container, Typography, Link, Grid } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";

const Footer = () => {
  return (
    <Box
      component="footer"
      sx={{
        py: 3,
        px: 2,
        mt: "auto",
        backgroundColor: (theme) => theme.palette.grey[200],
      }}>
      <Container maxWidth="xl">
        <Grid container spacing={4}>
          <Grid item xs={12} sm={4}>
            <Typography variant="h6" gutterBottom>
              Augment Store
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Your one-stop shop for all your needs.
            </Typography>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Typography variant="h6" gutterBottom>
              Quick Links
            </Typography>
            <Link component={RouterLink} to="/products" color="inherit" display="block">
              Products
            </Link>
            <Link component={RouterLink} to="/about" color="inherit" display="block">
              About Us
            </Link>
            <Link component={RouterLink} to="/contact" color="inherit" display="block">
              Contact
            </Link>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Typography variant="h6" gutterBottom>
              Customer Service
            </Typography>
            <Link href="/help" color="inherit" display="block">
              Help Center
            </Link>
            <Link href="/returns" color="inherit" display="block">
              Returns
            </Link>
            <Link href="/shipping" color="inherit" display="block">
              Shipping Info
            </Link>
          </Grid>
        </Grid>
        <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 3 }}>
          © {new Date().getFullYear()} Augment Store. All rights reserved.
        </Typography>
      </Container>
    </Box>
  );
};

export default Footer;
