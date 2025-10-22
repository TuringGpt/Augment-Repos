import { Box } from '@mui/material'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation, Pagination, Autoplay } from 'swiper/modules'
import type { PromotionalBanner } from '@features/products/types/banner'
import BannerCard from './BannerCard'

// Import Swiper styles
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'

interface BannerCarouselProps {
  banners: PromotionalBanner[]
}

const BannerCarousel = ({ banners }: BannerCarouselProps) => {
  return (
    <Box sx={{ height: '100%' }}>
      <Swiper
        modules={[Navigation, Pagination, Autoplay]}
        spaceBetween={0}
        slidesPerView={1}
        navigation
        pagination={{ clickable: true }}
        autoplay={{
          delay: 5000,
          disableOnInteraction: false,
        }}
        loop={true}
        style={{ height: '100%' }}
      >
        {banners.map((banner) => (
          <SwiperSlide key={banner.id}>
            <BannerCard banner={banner} />
          </SwiperSlide>
        ))}
      </Swiper>
    </Box>
  )
}

export default BannerCarousel

