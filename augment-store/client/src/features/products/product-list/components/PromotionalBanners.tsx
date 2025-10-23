import { Box, Grid } from '@mui/material'
import { mockBanners } from '@data/mockBanners'
import BannerCard from './BannerCard'
import BannerCarousel from './BannerCarousel'

const PromotionalBanners = () => {
  // Split banners into left (2), center (3 for carousel), right (2)
  const leftBanners = mockBanners.filter((b) => b.id === 'banner-1' || b.id === 'banner-2')
  const centerBanners = mockBanners.filter(
    (b) => b.id === 'banner-3' || b.id === 'banner-6' || b.id === 'banner-7'
  )
  const rightBanners = mockBanners.filter((b) => b.id === 'banner-4' || b.id === 'banner-5')

  return (
    <Box sx={{ mb: 6 }}>
      <Grid container spacing={3} sx={{ px: 6 }}>
        {/* Left Side - 2 Small Banners */}
        <Grid item xs={12} md={3}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {leftBanners.map((banner) => (
              <BannerCard key={banner.id} banner={banner} />
            ))}
          </Box>
        </Grid>

        {/* Center - Banner Carousel */}
        <Grid item xs={12} md={6}>
          <BannerCarousel banners={centerBanners} />
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
