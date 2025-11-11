import { useState, useRef, MouseEvent, useEffect } from 'react'
import { Box, IconButton, Dialog } from '@mui/material'
import { Close as CloseIcon, ZoomIn as ZoomInIcon } from '@mui/icons-material'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation, Pagination, Keyboard, Mousewheel } from 'swiper/modules'
import type { Swiper as SwiperType } from 'swiper'

// Import Swiper styles - using bundle for better compatibility
import 'swiper/swiper-bundle.css'

interface ImageGalleryProps {
  images: string[]
  productName: string
}

const ImageGallery = ({ images, productName }: ImageGalleryProps) => {
  const [activeStep, setActiveStep] = useState(0)
  const [isZoomed, setIsZoomed] = useState(false)
  const [zoomPosition, setZoomPosition] = useState({ x: 0, y: 0 })
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [touchZoomScale, setTouchZoomScale] = useState(1)
  const [touchZoomPosition, setTouchZoomPosition] = useState({ x: 50, y: 50 })
  const [fullscreenZoomScale, setFullscreenZoomScale] = useState(1)
  const [fullscreenZoomPosition, setFullscreenZoomPosition] = useState({ x: 50, y: 50 })
  const imageRef = useRef<HTMLDivElement>(null)
  const swiperRef = useRef<SwiperType | null>(null)
  const swiperContainerRef = useRef<HTMLDivElement>(null)
  const fullscreenSwiperContainerRef = useRef<HTMLDivElement>(null)
  const initialPinchDistance = useRef<number | null>(null)
  const initialScale = useRef<number>(1)
  const fullscreenInitialPinchDistance = useRef<number | null>(null)
  const fullscreenInitialScale = useRef<number>(1)
  const maxSteps = images.length

  const handleSlideChange = (swiper: SwiperType) => {
    setActiveStep(swiper.activeIndex)
    setIsZoomed(false) // Reset zoom when changing images
    setTouchZoomScale(1) // Reset touch zoom when changing images
    setFullscreenZoomScale(1) // Reset fullscreen zoom when changing images
  }

  const handleThumbnailClick = (index: number) => {
    setIsZoomed(false)
    setTouchZoomScale(1)
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

  // Calculate distance between two touch points
  const getTouchDistance = (touches: React.TouchList) => {
    if (touches.length < 2) return 0
    const touch1 = touches[0]
    const touch2 = touches[1]
    const dx = touch1.clientX - touch2.clientX
    const dy = touch1.clientY - touch2.clientY
    return Math.sqrt(dx * dx + dy * dy)
  }

  // Calculate center point between two touches
  const getTouchCenter = (touches: React.TouchList, rect: DOMRect) => {
    if (touches.length < 2) return { x: 50, y: 50 }
    const touch1 = touches[0]
    const touch2 = touches[1]
    const centerX = (touch1.clientX + touch2.clientX) / 2
    const centerY = (touch1.clientY + touch2.clientY) / 2
    const x = ((centerX - rect.left) / rect.width) * 100
    const y = ((centerY - rect.top) / rect.height) * 100
    return { x, y }
  }

  const handleFullscreenOpen = () => {
    setIsFullscreen(true)
  }

  const handleFullscreenClose = () => {
    setIsFullscreen(false)
    setFullscreenZoomScale(1) // Reset fullscreen zoom when closing
  }

  // Attach native touch event listeners for main swiper
  useEffect(() => {
    const container = swiperContainerRef.current
    if (!container) return

    const handleNativeTouchStart = (e: globalThis.TouchEvent) => {
      if (e.touches.length === 2) {
        console.log('Pinch started on main image')
        e.preventDefault()
        if (swiperRef.current) {
          swiperRef.current.allowTouchMove = false
        }
        const distance = getTouchDistance(e.touches as unknown as React.TouchList)
        initialPinchDistance.current = distance
        initialScale.current = touchZoomScale
      }
    }

    const handleNativeTouchMove = (e: globalThis.TouchEvent) => {
      if (e.touches.length === 2 && initialPinchDistance.current && swiperContainerRef.current) {
        e.preventDefault()
        const currentDistance = getTouchDistance(e.touches as unknown as React.TouchList)
        const scale = (currentDistance / initialPinchDistance.current) * initialScale.current
        const clampedScale = Math.max(1, Math.min(4, scale))
        console.log('Pinch zoom scale:', clampedScale)
        setTouchZoomScale(clampedScale)

        const rect = swiperContainerRef.current.getBoundingClientRect()
        const center = getTouchCenter(e.touches as unknown as React.TouchList, rect)
        setTouchZoomPosition(center)
      }
    }

    const handleNativeTouchEnd = (e: globalThis.TouchEvent) => {
      if (e.touches.length < 2) {
        if (swiperRef.current) {
          swiperRef.current.allowTouchMove = true
        }
        initialPinchDistance.current = null
        if (touchZoomScale < 1.1) {
          setTouchZoomScale(1)
        }
      }
    }

    container.addEventListener('touchstart', handleNativeTouchStart, { passive: false })
    container.addEventListener('touchmove', handleNativeTouchMove, { passive: false })
    container.addEventListener('touchend', handleNativeTouchEnd)

    return () => {
      container.removeEventListener('touchstart', handleNativeTouchStart)
      container.removeEventListener('touchmove', handleNativeTouchMove)
      container.removeEventListener('touchend', handleNativeTouchEnd)
    }
  }, [touchZoomScale])

  // Attach native touch event listeners for fullscreen swiper
  useEffect(() => {
    const container = fullscreenSwiperContainerRef.current
    if (!container || !isFullscreen) return

    const handleNativeTouchStart = (e: globalThis.TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault()
        if (swiperRef.current) {
          swiperRef.current.allowTouchMove = false
        }
        const distance = getTouchDistance(e.touches as unknown as React.TouchList)
        fullscreenInitialPinchDistance.current = distance
        fullscreenInitialScale.current = fullscreenZoomScale
      }
    }

    const handleNativeTouchMove = (e: globalThis.TouchEvent) => {
      if (
        e.touches.length === 2 &&
        fullscreenInitialPinchDistance.current &&
        fullscreenSwiperContainerRef.current
      ) {
        e.preventDefault()
        const currentDistance = getTouchDistance(e.touches as unknown as React.TouchList)
        const scale =
          (currentDistance / fullscreenInitialPinchDistance.current) *
          fullscreenInitialScale.current
        const clampedScale = Math.max(1, Math.min(4, scale))
        setFullscreenZoomScale(clampedScale)

        const rect = fullscreenSwiperContainerRef.current.getBoundingClientRect()
        const center = getTouchCenter(e.touches as unknown as React.TouchList, rect)
        setFullscreenZoomPosition(center)
      }
    }

    const handleNativeTouchEnd = (e: globalThis.TouchEvent) => {
      if (e.touches.length < 2) {
        if (swiperRef.current) {
          swiperRef.current.allowTouchMove = true
        }
        fullscreenInitialPinchDistance.current = null
        if (fullscreenZoomScale < 1.1) {
          setFullscreenZoomScale(1)
        }
      }
    }

    container.addEventListener('touchstart', handleNativeTouchStart, { passive: false })
    container.addEventListener('touchmove', handleNativeTouchMove, { passive: false })
    container.addEventListener('touchend', handleNativeTouchEnd)

    return () => {
      container.removeEventListener('touchstart', handleNativeTouchStart)
      container.removeEventListener('touchmove', handleNativeTouchMove)
      container.removeEventListener('touchend', handleNativeTouchEnd)
    }
  }, [fullscreenZoomScale, isFullscreen])

  return (
    <Box sx={{ width: '100%', position: 'relative' }}>
      {/* Main Image Swiper */}
      <Box
        ref={swiperContainerRef}
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
          touchAction: touchZoomScale > 1 ? 'none' : 'pan-y',
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
          {images.map((image, index) => {
            // Determine which zoom to apply (mouse or touch)
            const isActiveSlide = index === activeStep
            const mouseZoom = isZoomed && isActiveSlide ? 2 : 1
            const finalScale = isActiveSlide ? Math.max(mouseZoom, touchZoomScale) : 1
            const finalPosition = touchZoomScale > 1 ? touchZoomPosition : zoomPosition

            return (
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
                    transform: `scale(${finalScale})`,
                    transformOrigin:
                      finalScale > 1 ? `${finalPosition.x}% ${finalPosition.y}%` : 'center',
                    transition: finalScale > 1 ? 'none' : 'transform 0.3s ease-in-out',
                  }}
                />
              </SwiperSlide>
            )
          })}
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
          ref={fullscreenSwiperContainerRef}
          sx={{
            position: 'relative',
            width: '100vw',
            height: '100vh',
            touchAction: fullscreenZoomScale > 1 ? 'none' : 'pan-y',
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
          <IconButton
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
          </IconButton>

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
            {images.map((image, index) => {
              const isActiveSlide = index === activeStep
              const scale = isActiveSlide ? fullscreenZoomScale : 1

              return (
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
                        transform: `scale(${scale})`,
                        transformOrigin:
                          scale > 1
                            ? `${fullscreenZoomPosition.x}% ${fullscreenZoomPosition.y}%`
                            : 'center',
                        transition: scale > 1 ? 'none' : 'transform 0.3s ease-in-out',
                      }}
                    />
                  </Box>
                </SwiperSlide>
              )
            })}
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
