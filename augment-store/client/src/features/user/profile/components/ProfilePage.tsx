import { Container, Typography } from '@mui/material'

const ProfilePage = () => {
  return (
    <Container maxWidth="xl">
      <Typography variant="h4" gutterBottom>
        My Profile
      </Typography>
      <Typography color="text.secondary">
        User profile will be displayed here
      </Typography>
    </Container>
  )
}

export default ProfilePage

