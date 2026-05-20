import { Box, Typography, Button, Card, CardContent, CardMedia } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from '@hooks/useTranslation'
import type { PromotionalBanner } from '@features/products/types/banner'

interface BannerCardProps {
  banner: PromotionalBanner
}

const BannerCard = ({ banner }: BannerCardProps) => {
  const navigate = useNavigate()
  const { t } = useTranslation()

  const handleClick = () => {
    if (banner.ctaLink) {
      navigate(banner.ctaLink)
    }
  }

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      handleClick()
    }
  }

  const isLarge = banner.size === 'large'
  const isCardClickable = banner.ctaLink && !banner.ctaText && !banner.ctaTextKey

  // Get translated content for accessibility
  // Type assertion needed because banner keys are dynamic strings, not literal translation keys
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const displayTitle = banner.titleKey ? t(banner.titleKey as any) : banner.title
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const displaySubtitle = banner.subtitleKey ? t(banner.subtitleKey as any) : banner.subtitle
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const displayDescription = banner.descriptionKey ? t(banner.descriptionKey as any) : banner.description
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const displayCtaText = banner.ctaTextKey ? t(banner.ctaTextKey as any) : banner.ctaText

  return (
    <Card
      sx={{
        position: 'relative',
        height: isLarge ? 358 : 167,
        overflow: 'hidden',
        cursor: isCardClickable ? 'pointer' : 'default',
        transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
        '&:hover': isCardClickable
          ? {
              transform: 'translateY(-4px)',
              boxShadow: 6,
            }
          : {},
        '&:focus-visible': isCardClickable
          ? {
              outline: '2px solid',
              outlineColor: 'primary.main',
              outlineOffset: '2px',
            }
          : {},
      }}
      onClick={isCardClickable ? handleClick : undefined}
      onKeyDown={isCardClickable ? handleKeyDown : undefined}
      role={isCardClickable ? 'button' : undefined}
      tabIndex={isCardClickable ? 0 : undefined}
      aria-label={isCardClickable ? `${displayTitle}. ${t('home.banners.clickToViewDetails')}` : undefined}
    >
      {/* Background Image */}
      <CardMedia
        component="img"
        image={banner.imageUrl}
        alt={displayTitle}
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          filter: 'brightness(0.7)',
        }}
      />

      {/* Overlay */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: `linear-gradient(135deg, ${banner.backgroundColor || 'rgba(0,0,0,0.3)'} 0%, transparent 100%)`,
        }}
      />

      {/* Content */}
      <CardContent
        sx={{
          position: 'relative',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: isLarge ? 'center' : 'flex-end',
          alignItems: isLarge ? 'center' : 'flex-start',
          textAlign: isLarge ? 'center' : 'left',
          p: isLarge ? 4 : 3,
          color: banner.textColor || '#ffffff',
        }}
      >
        <Typography
          variant={isLarge ? 'h3' : 'h5'}
          sx={{
            fontWeight: 700,
            mb: 1,
            textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
          }}
        >
          {displayTitle}
        </Typography>

        {(banner.subtitle || banner.subtitleKey) && (
          <Typography
            variant={isLarge ? 'h5' : 'h6'}
            sx={{
              mb: isLarge ? 2 : 1,
              textShadow: '1px 1px 3px rgba(0,0,0,0.5)',
            }}
          >
            {displaySubtitle}
          </Typography>
        )}

        {(banner.description || banner.descriptionKey) && isLarge && (
          <Typography
            variant="body1"
            sx={{
              mb: 3,
              maxWidth: 600,
              textShadow: '1px 1px 3px rgba(0,0,0,0.5)',
            }}
          >
            {displayDescription}
          </Typography>
        )}

        {(banner.ctaText || banner.ctaTextKey) && banner.ctaLink && (
          <Button
            variant="contained"
            size={isLarge ? 'large' : 'medium'}
            onClick={handleClick}
            sx={{
              mt: isLarge ? 2 : 1,
              backgroundColor: banner.textColor === '#ffffff' ? '#ffffff' : '#1a1a1a',
              color: banner.textColor === '#ffffff' ? '#1a1a1a' : '#ffffff',
              fontWeight: 600,
              px: isLarge ? 4 : 3,
              '&:hover': {
                backgroundColor: banner.textColor === '#ffffff' ? '#f0f0f0' : '#333333',
              },
            }}
          >
            {displayCtaText}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

export default BannerCard
