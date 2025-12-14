import { Card, CardContent, Typography, Box, Skeleton } from '@mui/material'
import { ReactNode } from 'react'

interface MetricCardProps {
  title: string
  value: string | number
  icon?: ReactNode
  subtitle?: string
  color?: string
  isLoading?: boolean
}

/**
 * MetricCard Component
 * Displays a single metric with an optional icon and subtitle
 */
const MetricCard = ({ title, value, icon, subtitle, color = 'primary.main', isLoading = false }: MetricCardProps) => {
  if (isLoading) {
    return (
      <Card sx={{ height: '100%' }}>
        <CardContent>
          <Skeleton variant="text" width="60%" height={24} />
          <Skeleton variant="text" width="80%" height={40} sx={{ mt: 1 }} />
          {subtitle && <Skeleton variant="text" width="40%" height={20} sx={{ mt: 1 }} />}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card
      sx={{
        height: '100%',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 4,
        },
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2" color="text.secondary" fontWeight={500}>
            {title}
          </Typography>
          {icon && (
            <Box sx={{ color, display: 'flex', alignItems: 'center' }}>
              {icon}
            </Box>
          )}
        </Box>
        <Typography variant="h4" fontWeight={700} sx={{ mb: subtitle ? 0.5 : 0, color }}>
          {value}
        </Typography>
        {subtitle && (
          <Typography variant="caption" color="text.secondary">
            {subtitle}
          </Typography>
        )}
      </CardContent>
    </Card>
  )
}

export default MetricCard

