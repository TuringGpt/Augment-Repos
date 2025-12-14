import { Container, Typography, Box, Grid, Paper, Card, CardContent } from '@mui/material'
import {
  ShoppingCart,
  People,
  Inventory,
  AttachMoney,
  TrendingUp,
  Assessment,
} from '@mui/icons-material'
import { useAuthStore } from '@store/authStore'

const AdminDashboard = () => {
  const { user } = useAuthStore()

  const stats = [
    {
      title: 'Total Orders',
      value: '1,234',
      icon: <ShoppingCart sx={{ fontSize: 40 }} />,
      color: '#1976d2',
      trend: '+12%',
    },
    {
      title: 'Total Users',
      value: '5,678',
      icon: <People sx={{ fontSize: 40 }} />,
      color: '#2e7d32',
      trend: '+8%',
    },
    {
      title: 'Total Products',
      value: '890',
      icon: <Inventory sx={{ fontSize: 40 }} />,
      color: '#ed6c02',
      trend: '+5%',
    },
    {
      title: 'Revenue',
      value: '$45,678',
      icon: <AttachMoney sx={{ fontSize: 40 }} />,
      color: '#9c27b0',
      trend: '+15%',
    },
  ]

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
          Admin Dashboard
        </Typography>
        <Typography color="text.secondary">
          Welcome back, {user?.firstName || 'Admin'}! Here's what's happening with your store.
        </Typography>
      </Box>

      {/* Stats Grid */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {stats.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card
              sx={{
                height: '100%',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 4,
                },
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Box
                    sx={{
                      bgcolor: `${stat.color}20`,
                      color: stat.color,
                      p: 1.5,
                      borderRadius: 2,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {stat.icon}
                  </Box>
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                  {stat.value}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  {stat.title}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <TrendingUp sx={{ fontSize: 16, color: 'success.main' }} />
                  <Typography variant="caption" color="success.main" sx={{ fontWeight: 600 }}>
                    {stat.trend}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    vs last month
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Quick Actions */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Assessment sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Recent Activity
              </Typography>
            </Box>
            <Typography color="text.secondary">
              Activity feed and recent actions will be displayed here.
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <ShoppingCart sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Recent Orders
              </Typography>
            </Box>
            <Typography color="text.secondary">
              Latest orders will be displayed here.
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  )
}

export default AdminDashboard

