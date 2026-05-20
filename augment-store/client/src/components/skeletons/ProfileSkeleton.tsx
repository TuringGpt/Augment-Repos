import { Container, Box, Skeleton, Divider, Grid, Card, CardContent } from '@mui/material'

interface ProfileSkeletonProps {
  /**
   * Whether to animate the skeleton
   * @default "wave"
   */
  animation?: 'pulse' | 'wave' | false
}

/**
 * Skeleton loader for ProfilePage
 * Matches the layout of the user profile page
 */
const ProfileSkeleton = ({ animation = 'wave' }: ProfileSkeletonProps) => {
  return (
    <Container maxWidth="lg" sx={{ py: { xs: 3, md: 5 } }}>
      {/* Page Header */}
      <Box sx={{ mb: 4 }}>
        <Skeleton variant="text" width="30%" height={48} animation={animation} sx={{ mb: 1 }} />
        <Skeleton variant="text" width="50%" height={24} animation={animation} />
      </Box>

      <Grid container spacing={3}>
        {/* Left Column - Profile Card Skeleton */}
        <Grid item xs={12} md={4}>
          <Card elevation={0} sx={{ borderRadius: 3, border: (theme) => `1px solid ${theme.palette.divider}` }}>
            <CardContent sx={{ p: 3 }}>
              {/* Avatar */}
              <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
                <Skeleton variant="circular" width={140} height={140} animation={animation} />
              </Box>

              {/* User Info */}
              <Box sx={{ textAlign: 'center', mb: 3 }}>
                <Skeleton variant="text" width="80%" height={32} animation={animation} sx={{ mx: 'auto', mb: 1 }} />
                <Skeleton variant="text" width="60%" height={20} animation={animation} sx={{ mx: 'auto', mb: 2 }} />
                <Skeleton variant="rounded" width={100} height={24} animation={animation} sx={{ mx: 'auto', mb: 2 }} />
                <Skeleton variant="text" width="50%" height={16} animation={animation} sx={{ mx: 'auto', mb: 1 }} />
                <Skeleton variant="text" width="70%" height={16} animation={animation} sx={{ mx: 'auto' }} />
              </Box>

              <Divider sx={{ mb: 2 }} />

              {/* Action Buttons */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Skeleton variant="rounded" width="100%" height={40} animation={animation} />
                <Skeleton variant="rounded" width="100%" height={40} animation={animation} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Right Column - Form Skeleton */}
        <Grid item xs={12} md={8}>
          <Card elevation={0} sx={{ borderRadius: 3, border: (theme) => `1px solid ${theme.palette.divider}` }}>
            <CardContent sx={{ p: 4 }}>
              {/* Card Header */}
              <Box sx={{ mb: 3 }}>
                <Skeleton variant="text" width="40%" height={32} animation={animation} sx={{ mb: 0.5 }} />
                <Skeleton variant="text" width="60%" height={20} animation={animation} />
              </Box>

              <Divider sx={{ mb: 4 }} />

              {/* Form Fields */}
              <Grid container spacing={3}>
                {[1, 2, 3, 4, 5, 6].map((item) => (
                  <Grid item xs={12} sm={6} key={item}>
                    <Skeleton variant="text" width="30%" height={20} animation={animation} sx={{ mb: 1 }} />
                    <Skeleton
                      variant="rounded"
                      width="100%"
                      height={56}
                      animation={animation}
                      sx={{ borderRadius: 2 }}
                    />
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  )
}

export default ProfileSkeleton
