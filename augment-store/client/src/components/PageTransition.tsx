import { ReactNode } from 'react'
import { Box } from '@mui/material'

interface PageTransitionProps {
  children: ReactNode
}

const PageTransition = ({ children }: PageTransitionProps) => {
  return (
    <Box
      sx={{
        width: '100%',
        minHeight: '100%',
        animation: 'slideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        '@keyframes slideIn': {
          from: {
            opacity: 0,
            transform: 'translateX(20px)',
          },
          to: {
            opacity: 1,
            transform: 'translateX(0)',
          },
        },
      }}
    >
      {children}
    </Box>
  )
}

export default PageTransition
