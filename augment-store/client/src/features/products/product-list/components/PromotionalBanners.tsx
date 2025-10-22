import { Box, Grid } from '@mui/material'
import { mockBanners } from '@data/mockBanners'
import BannerCard from './BannerCard'

const PromotionalBanners = () => {
  // Split banners into left (2), center (1), right (2)
  const leftBanners = mockBanners.filter((b) => b.id === 'banner-1' || b.id === 'banner-2')
  const centerBanner = mockBanners.find((b) => b.id === 'banner-3')
  const rightBanners = mockBanners.filter((b) => b.id === 'banner-4' || b.id === 'banner-5')

  return (
    <Box sx={{ mb: 6 }}>
      <Grid container spacing={3} sx={{ px: 3 }}>
        {/* Left Side - 2 Small Banners */}
        <Grid item xs={12} md={3}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {leftBanners.map((banner) => (
              <BannerCard key={banner.id} banner={banner} />
            ))}
          </Box>
        </Grid>

        {/* Center - 1 Large Banner */}
        <Grid item xs={12} md={6}>
          {centerBanner && <BannerCard banner={centerBanner} />}
        </Grid>

        {/* Right Side - 2 Small Banners */}
        <Grid item xs={12} md={3}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {rightBanners.map((banner) => (
              <BannerCard key={banner.id} banner={banner} />
            ))}
          </Box>
        </Grid>
      </Grid>
    </Box>
  )
}

export default PromotionalBanners
