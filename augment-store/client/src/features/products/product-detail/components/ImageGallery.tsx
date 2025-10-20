import { useState, useRef, MouseEvent } from 'react'
import { Box, IconButton, MobileStepper, Dialog, IconButton as MuiIconButton } from '@mui/material'
import {
  KeyboardArrowLeft,
  KeyboardArrowRight,
  Close as CloseIcon,
  ZoomIn as ZoomInIcon,
} from '@mui/icons-material'
import { useSwipeable } from 'react-swipeable'

interface ImageGalleryProps {
  images: string[]
  productName: string
}

const ImageGallery = ({ images, productName }: ImageGalleryProps) => {
  const [activeStep, setActiveStep] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [isZoomed, setIsZoomed] = useState(false)
  const [zoomPosition, setZoomPosition] = useState({ x: 0, y: 0 })
  const [isFullscreen, setIsFullscreen] = useState(false)
  const imageRef = useRef<HTMLDivElement>(null)
  const maxSteps = images.length

  const handleNext = () => {
    setIsTransitioning(true)
    setActiveStep((prevActiveStep) => (prevActiveStep + 1) % maxSteps)
    setTimeout(() => setIsTransitioning(false), 300)
  }

  const handleBack = () => {
    setIsTransitioning(true)
    setActiveStep((prevActiveStep) => (prevActiveStep - 1 + maxSteps) % maxSteps)
    setTimeout(() => setIsTransitioning(false), 300)
  }

  const handleStepChange = (step: number) => {
    setIsTransitioning(true)
    setActiveStep(step)
    setTimeout(() => setIsTransitioning(false), 300)
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

  const handlers = useSwipeable({
    onSwipedLeft: () => handleNext(),
    onSwipedRight: () => handleBack(),
    trackMouse: true,
    trackTouch: true,
    preventScrollOnSwipe: true,
    delta: 10, // Minimum distance for swipe detection
  })

  return (
    <Box sx={{ width: '100%', position: 'relative' }}>
      {/* Main Image */}
      <Box
        {...handlers}
        ref={imageRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        sx={{
          position: 'relative',
          width: '100%',
          height: { xs: '300px', sm: '400px', md: '50vh' }, // Half screen height on desktop
          maxHeight: '600px',
          backgroundColor: 'grey.100',
          borderRadius: 2,
          overflow: 'hidden',
          cursor: isZoomed ? 'zoom-in' : 'grab',
          '&:active': {
            cursor: isZoomed ? 'zoom-in' : 'grabbing',
          },
        }}
      >
        {/* Image Container with Sliding Effect */}
        <Box
          sx={{
            display: 'flex',
            width: '100%',
            height: '100%',
            transform: `translateX(-${activeStep * 100}%)`,
            transition: isTransitioning ? 'transform 0.3s ease-in-out' : 'none',
          }}
        >
          {images.map((image, index) => (
            <Box
              key={index}
              component="img"
              src={image}
              alt={`${productName} - Image ${index + 1}`}
              sx={{
                minWidth: '100%',
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                userSelect: 'none',
                transform: isZoomed && index === activeStep ? 'scale(2)' : 'scale(1)',
                transformOrigin: isZoomed ? `${zoomPosition.x}% ${zoomPosition.y}%` : 'center',
                transition: isZoomed ? 'none' : 'transform 0.3s ease-in-out',
              }}
            />
          ))}
        </Box>

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
            zIndex: 2,
          }}
          aria-label="view fullscreen"
        >
          <ZoomInIcon />
        </IconButton>

        {/* Navigation Arrows */}
        {maxSteps > 1 && (
          <>
            <IconButton
              onClick={handleBack}
              sx={{
                position: 'absolute',
                left: 8,
                top: '50%',
                transform: 'translateY(-50%)',
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 1)',
                },
              }}
            >
              <KeyboardArrowLeft />
            </IconButton>
            <IconButton
              onClick={handleNext}
              sx={{
                position: 'absolute',
                right: 8,
                top: '50%',
                transform: 'translateY(-50%)',
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 1)',
                },
              }}
            >
              <KeyboardArrowRight />
            </IconButton>
          </>
        )}
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
              onClick={() => handleStepChange(index)}
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

      {/* Stepper Dots */}
      {maxSteps > 1 && (
        <MobileStepper
          steps={maxSteps}
          position="static"
          activeStep={activeStep}
          sx={{
            mt: 2,
            backgroundColor: 'transparent',
            justifyContent: 'center',
            '& .MuiMobileStepper-dot': {
              width: 8,
              height: 8,
            },
            '& .MuiMobileStepper-dotActive': {
              backgroundColor: 'primary.main',
            },
          }}
          nextButton={<Box />}
          backButton={<Box />}
        />
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
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
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
              zIndex: 3,
            }}
            aria-label="close fullscreen"
          >
            <CloseIcon />
          </MuiIconButton>

          {/* Fullscreen Image Container */}
          <Box
            sx={{
              display: 'flex',
              width: '100%',
              height: '100%',
              transform: `translateX(-${activeStep * 100}%)`,
              transition: isTransitioning ? 'transform 0.3s ease-in-out' : 'none',
            }}
          >
            {images.map((image, index) => (
              <Box
                key={index}
                component="img"
                src={image}
                alt={`${productName} - Image ${index + 1}`}
                sx={{
                  minWidth: '100%',
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  userSelect: 'none',
                  padding: 4,
                }}
              />
            ))}
          </Box>

          {/* Fullscreen Navigation Arrows */}
          {maxSteps > 1 && (
            <>
              <IconButton
                onClick={handleBack}
                sx={{
                  position: 'absolute',
                  left: 16,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'white',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  },
                  zIndex: 2,
                }}
                aria-label="previous image"
              >
                <KeyboardArrowLeft fontSize="large" />
              </IconButton>
              <IconButton
                onClick={handleNext}
                sx={{
                  position: 'absolute',
                  right: 16,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'white',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  },
                  zIndex: 2,
                }}
                aria-label="next image"
              >
                <KeyboardArrowRight fontSize="large" />
              </IconButton>
            </>
          )}

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
