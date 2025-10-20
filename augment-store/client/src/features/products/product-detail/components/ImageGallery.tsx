import { useState } from 'react'
import { Box, IconButton, MobileStepper } from '@mui/material'
import { KeyboardArrowLeft, KeyboardArrowRight } from '@mui/icons-material'
import { useSwipeable } from 'react-swipeable'

interface ImageGalleryProps {
  images: string[]
  productName: string
}

const ImageGallery = ({ images, productName }: ImageGalleryProps) => {
  const [activeStep, setActiveStep] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)
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
        sx={{
          position: 'relative',
          width: '100%',
          height: { xs: '300px', sm: '400px', md: '50vh' }, // Half screen height on desktop
          maxHeight: '600px',
          backgroundColor: 'grey.100',
          borderRadius: 2,
          overflow: 'hidden',
          cursor: 'grab',
          '&:active': {
            cursor: 'grabbing',
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
              }}
            />
          ))}
        </Box>

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
    </Box>
  )
}

export default ImageGallery
