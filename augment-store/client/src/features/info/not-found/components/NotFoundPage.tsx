import { Container, Typography, Box, Button } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import HomeIcon from '@mui/icons-material/Home'
import SearchIcon from '@mui/icons-material/Search'
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline'
import { useTranslation } from '@hooks/useTranslation'

const NotFoundPage = () => {
  const navigate = useNavigate()
  const { t } = useTranslation()

  return (
    <Container maxWidth="md" sx={{ py: 8 }}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          minHeight: '60vh',
        }}
      >
        {/* Icon/Illustration */}
        <Box
          sx={{
            width: { xs: 150, sm: 200, md: 250 },
            height: { xs: 150, sm: 200, md: 250 },
            mb: 4,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
          }}
        >
          {/* Background Circle */}
          <Box
            sx={{
              width: '100%',
              height: '100%',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: '50%',
              opacity: 0.1,
              position: 'absolute',
            }}
          />
          <ErrorOutlineIcon
            sx={{
              fontSize: { xs: 100, sm: 120, md: 150 },
              color: 'primary.main',
              zIndex: 1,
            }}
          />
        </Box>

        {/* 404 Text */}
        <Typography
          variant="h1"
          sx={{
            fontWeight: 700,
            color: 'text.primary',
            mb: 2,
            fontSize: { xs: '4rem', sm: '5rem', md: '6rem' },
          }}
        >
          404
        </Typography>

        {/* Title */}
        <Typography
          variant="h4"
          gutterBottom
          sx={{
            fontWeight: 600,
            color: 'text.primary',
            mb: 2,
            fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' },
          }}
        >
          {t('notFound.title')}
        </Typography>

        {/* Description */}
        <Typography
          variant="h6"
          color="text.secondary"
          paragraph
          sx={{
            mb: 4,
            maxWidth: 600,
            fontSize: { xs: '0.875rem', sm: '1rem', md: '1.125rem' },
          }}
        >
          {t('notFound.description')}
        </Typography>

        {/* Action Buttons */}
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
          <Button
            variant="contained"
            size="large"
            startIcon={<HomeIcon />}
            onClick={() => navigate('/')}
            sx={{ minWidth: 150 }}
          >
            {t('notFound.goHome')}
          </Button>
          <Button
            variant="outlined"
            size="large"
            startIcon={<SearchIcon />}
            onClick={() => navigate('/products')}
            sx={{ minWidth: 150 }}
          >
            {t('notFound.browseProducts')}
          </Button>
        </Box>
      </Box>
    </Container>
  )
}

export default NotFoundPage

