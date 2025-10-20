import { useState, useRef, MouseEvent } from 'react'
import { Box, IconButton, Dialog, IconButton as MuiIconButton } from '@mui/material'
import { Close as CloseIcon, ZoomIn as ZoomInIcon } from '@mui/icons-material'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation, Pagination, Keyboard, Mousewheel } from 'swiper/modules'
import type { Swiper as SwiperType } from 'swiper'

// Import Swiper styles
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'

interface ImageGalleryProps {
  images: string[]
  productName: string
}

const ImageGallery = ({ images, productName }: ImageGalleryProps) => {
  const [activeStep, setActiveStep] = useState(0)
  const [isZoomed, setIsZoomed] = useState(false)
  const [zoomPosition, setZoomPosition] = useState({ x: 0, y: 0 })
  const [isFullscreen, setIsFullscreen] = useState(false)
  const imageRef = useRef<HTMLDivElement>(null)
  const swiperRef = useRef<SwiperType | null>(null)
  const maxSteps = images.length

  const handleSlideChange = (swiper: SwiperType) => {
    setActiveStep(swiper.activeIndex)
    setIsZoomed(false) // Reset zoom when changing images
  }

  const handleThumbnailClick = (index: number) => {
    setIsZoomed(false)
    swiperRef.current?.slideTo(index)
  }

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!imageRef.current) return

    const rect = imageRef.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100

    setZoomPosition({ x, y })
  }

  const handleMouseEnter = () => {
    setIsZoomed(true)
  }

  const handleMouseLeave = () => {
    setIsZoomed(false)
  }

  const handleFullscreenOpen = () => {
    setIsFullscreen(true)
  }

  const handleFullscreenClose = () => {
    setIsFullscreen(false)
  }

  return (
    <Box sx={{ width: '100%', position: 'relative' }}>
      {/* Main Image Swiper */}
      <Box
        ref={imageRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        sx={{
          position: 'relative',
          width: '100%',
          height: { xs: '300px', sm: '400px', md: '50vh' },
          maxHeight: '600px',
          backgroundColor: 'grey.100',
          borderRadius: 2,
          overflow: 'hidden',
          cursor: isZoomed ? 'zoom-in' : 'grab',
          '&:active': {
            cursor: isZoomed ? 'zoom-in' : 'grabbing',
          },
          '& .swiper': {
            width: '100%',
            height: '100%',
          },
          '& .swiper-button-next, & .swiper-button-prev': {
            color: '#fff',
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            '&:after': {
              fontSize: '20px',
              fontWeight: 'bold',
              color: '#000',
            },
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 1)',
            },
          },
          '& .swiper-pagination-bullet': {
            backgroundColor: '#fff',
            opacity: 0.5,
          },
          '& .swiper-pagination-bullet-active': {
            opacity: 1,
            backgroundColor: 'primary.main',
          },
        }}
      >
        <Swiper
          modules={[Navigation, Pagination, Keyboard, Mousewheel]}
          navigation
          pagination={{ clickable: true }}
          keyboard={{ enabled: true }}
          mousewheel={{ forceToAxis: true }}
          onSwiper={(swiper) => (swiperRef.current = swiper)}
          onSlideChange={handleSlideChange}
          spaceBetween={0}
          slidesPerView={1}
          style={{ width: '100%', height: '100%' }}
        >
          {images.map((image, index) => (
            <SwiperSlide key={index}>
              <Box
                component="img"
                src={image}
                alt={`${productName} - Image ${index + 1}`}
                sx={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  userSelect: 'none',
                  transform: isZoomed && index === activeStep ? 'scale(2)' : 'scale(1)',
                  transformOrigin: isZoomed ? `${zoomPosition.x}% ${zoomPosition.y}%` : 'center',
                  transition: isZoomed ? 'none' : 'transform 0.3s ease-in-out',
                }}
              />
            </SwiperSlide>
          ))}
        </Swiper>

        {/* Fullscreen Button */}
        <IconButton
          onClick={handleFullscreenOpen}
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 1)',
            },
            zIndex: 10,
          }}
          aria-label="view fullscreen"
        >
          <ZoomInIcon />
        </IconButton>
      </Box>

      {/* Thumbnail Navigation */}
      {maxSteps > 1 && (
        <Box
          sx={{
            display: 'flex',
            gap: 1,
            mt: 2,
            overflowX: 'auto',
            pb: 1,
            '&::-webkit-scrollbar': {
              height: 6,
            },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: 'grey.400',
              borderRadius: 3,
            },
          }}
        >
          {images.map((image, index) => (
            <Box
              key={index}
              onClick={() => handleThumbnailClick(index)}
              sx={{
                minWidth: 80,
                height: 80,
                borderRadius: 1,
                overflow: 'hidden',
                cursor: 'pointer',
                border: 2,
                borderColor: activeStep === index ? 'primary.main' : 'transparent',
                opacity: activeStep === index ? 1 : 0.6,
                transition: 'all 0.2s',
                '&:hover': {
                  opacity: 1,
                  borderColor: activeStep === index ? 'primary.main' : 'grey.400',
                },
              }}
            >
              <Box
                component="img"
                src={image}
                alt={`${productName} - Thumbnail ${index + 1}`}
                sx={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
            </Box>
          ))}
        </Box>
      )}

      {/* Fullscreen Dialog */}
      <Dialog
        open={isFullscreen}
        onClose={handleFullscreenClose}
        maxWidth={false}
        fullScreen
        sx={{
          '& .MuiDialog-paper': {
            backgroundColor: 'rgba(0, 0, 0, 0.95)',
          },
        }}
      >
        <Box
          sx={{
            position: 'relative',
            width: '100vw',
            height: '100vh',
            '& .swiper': {
              width: '100%',
              height: '100%',
            },
            '& .swiper-button-next, & .swiper-button-prev': {
              color: '#fff',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '50%',
              width: '50px',
              height: '50px',
              '&:after': {
                fontSize: '24px',
                fontWeight: 'bold',
              },
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
              },
            },
          }}
        >
          {/* Close Button */}
          <MuiIconButton
            onClick={handleFullscreenClose}
            sx={{
              position: 'absolute',
              top: 16,
              right: 16,
              color: 'white',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
              },
              zIndex: 1000,
            }}
            aria-label="close fullscreen"
          >
            <CloseIcon />
          </MuiIconButton>

          {/* Fullscreen Swiper */}
          <Swiper
            modules={[Navigation, Keyboard, Mousewheel]}
            navigation
            keyboard={{ enabled: true }}
            mousewheel={{ forceToAxis: true }}
            initialSlide={activeStep}
            onSlideChange={handleSlideChange}
            spaceBetween={0}
            slidesPerView={1}
            style={{ width: '100%', height: '100%' }}
          >
            {images.map((image, index) => (
              <SwiperSlide key={index}>
                <Box
                  sx={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 4,
                  }}
                >
                  <Box
                    component="img"
                    src={image}
                    alt={`${productName} - Image ${index + 1}`}
                    sx={{
                      maxWidth: '100%',
                      maxHeight: '100%',
                      objectFit: 'contain',
                      userSelect: 'none',
                    }}
                  />
                </Box>
              </SwiperSlide>
            ))}
          </Swiper>

          {/* Fullscreen Image Counter */}
          <Box
            sx={{
              position: 'absolute',
              bottom: 32,
              left: '50%',
              transform: 'translateX(-50%)',
              color: 'white',
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              px: 3,
              py: 1,
              borderRadius: 2,
              fontSize: '1rem',
              fontWeight: 500,
              zIndex: 1000,
            }}
          >
            {activeStep + 1} / {maxSteps}
          </Box>
        </Box>
      </Dialog>
    </Box>
  )
}

export default ImageGallery
