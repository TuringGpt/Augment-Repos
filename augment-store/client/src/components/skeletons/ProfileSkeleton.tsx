import { Container, Paper, Box, Skeleton, Divider, Grid } from '@mui/material'

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
    <Container maxWidth="md" sx={{ py: 4 }}>
      {/* Page Title */}
      <Skeleton variant="text" width="30%" height={48} animation={animation} sx={{ mb: 1 }} />
      <Skeleton variant="text" width="50%" height={24} animation={animation} sx={{ mb: 4 }} />

      <Paper elevation={3} sx={{ p: 4 }}>
        {/* Avatar Section */}
        <Box sx={{ mb: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Skeleton
            variant="circular"
            width={120}
            height={120}
            animation={animation}
            sx={{ mb: 2 }}
          />
          <Skeleton variant="text" width={150} height={24} animation={animation} />
        </Box>

        <Divider sx={{ mb: 4 }} />

        {/* Profile Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
          <Box sx={{ flex: 1 }}>
            <Skeleton variant="text" width="40%" height={32} animation={animation} sx={{ mb: 1 }} />
            <Skeleton
              variant="text"
              width="60%"
              height={20}
              animation={animation}
              sx={{ mb: 0.5 }}
            />
            <Skeleton variant="text" width="30%" height={16} animation={animation} />
          </Box>
          <Skeleton
            variant="rectangular"
            width={120}
            height={40}
            animation={animation}
            sx={{ borderRadius: 1 }}
          />
        </Box>

        <Divider sx={{ mb: 3 }} />

        {/* Profile Fields */}
        <Grid container spacing={3}>
          {/* First Name */}
          <Grid item xs={12} sm={6}>
            <Skeleton variant="text" width="40%" height={20} animation={animation} sx={{ mb: 1 }} />
            <Skeleton
              variant="rectangular"
              width="100%"
              height={56}
              animation={animation}
              sx={{ borderRadius: 1 }}
            />
          </Grid>

          {/* Last Name */}
          <Grid item xs={12} sm={6}>
            <Skeleton variant="text" width="40%" height={20} animation={animation} sx={{ mb: 1 }} />
            <Skeleton
              variant="rectangular"
              width="100%"
              height={56}
              animation={animation}
              sx={{ borderRadius: 1 }}
            />
          </Grid>

          {/* Email */}
          <Grid item xs={12}>
            <Skeleton variant="text" width="30%" height={20} animation={animation} sx={{ mb: 1 }} />
            <Skeleton
              variant="rectangular"
              width="100%"
              height={56}
              animation={animation}
              sx={{ borderRadius: 1 }}
            />
          </Grid>

          {/* Phone */}
          <Grid item xs={12}>
            <Skeleton variant="text" width="35%" height={20} animation={animation} sx={{ mb: 1 }} />
            <Skeleton
              variant="rectangular"
              width="100%"
              height={56}
              animation={animation}
              sx={{ borderRadius: 1 }}
            />
          </Grid>

          {/* Bio */}
          <Grid item xs={12}>
            <Skeleton variant="text" width="25%" height={20} animation={animation} sx={{ mb: 1 }} />
            <Skeleton
              variant="rectangular"
              width="100%"
              height={120}
              animation={animation}
              sx={{ borderRadius: 1 }}
            />
          </Grid>
        </Grid>
      </Paper>
    </Container>
  )
}

export default ProfileSkeleton
