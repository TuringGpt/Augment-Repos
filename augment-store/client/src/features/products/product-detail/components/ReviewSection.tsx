import { Box, Typography, Rating, Avatar, Chip, Divider, LinearProgress, Paper } from '@mui/material'
import { Verified as VerifiedIcon, ThumbUp as ThumbUpIcon } from '@mui/icons-material'
import type { Review } from '@features/products/types'
import { formatDistanceToNow } from 'date-fns'

interface ReviewSectionProps {
  reviews: Review[]
  rating: number
}

const ReviewSection = ({ reviews, rating }: ReviewSectionProps) => {
  // Calculate rating distribution
  const ratingDistribution = [5, 4, 3, 2, 1].map((stars) => {
    const count = reviews.filter((r) => Math.floor(r.rating) === stars).length
    const percentage = reviews.length > 0 ? (count / reviews.length) * 100 : 0
    return { stars, count, percentage }
  })

  return (
    <Box>
      <Typography variant="h5" gutterBottom sx={{ fontWeight: 700, mb: 3 }}>
        Customer Reviews
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 4, mb: 4 }}>
        {/* Rating Summary */}
        <Box sx={{ minWidth: 250 }}>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Typography variant="h2" sx={{ fontWeight: 700, mb: 1 }}>
              {rating.toFixed(1)}
            </Typography>
            <Rating value={rating} precision={0.1} readOnly size="large" sx={{ mb: 1 }} />
            <Typography variant="body2" color="text.secondary">
              Based on {reviews.length} review{reviews.length !== 1 ? 's' : ''}
            </Typography>
          </Box>

          {/* Rating Distribution */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {ratingDistribution.map(({ stars, count, percentage }) => (
              <Box key={stars} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2" sx={{ minWidth: 60 }}>
                  {stars} star{stars !== 1 ? 's' : ''}
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={percentage}
                  sx={{
                    flex: 1,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: 'grey.200',
                    '& .MuiLinearProgress-bar': {
                      borderRadius: 4,
                    },
                  }}
                />
                <Typography variant="body2" color="text.secondary" sx={{ minWidth: 30 }}>
                  {count}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>

        {/* Reviews List */}
        <Box sx={{ flex: 1 }}>
          {reviews.length === 0 ? (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <Typography color="text.secondary">No reviews yet. Be the first to review!</Typography>
            </Paper>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {reviews.map((review, index) => (
                <Box key={review.id}>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    {/* Avatar */}
                    <Avatar
                      src={review.userAvatar}
                      alt={review.userName}
                      sx={{ width: 48, height: 48 }}
                    />

                    {/* Review Content */}
                    <Box sx={{ flex: 1 }}>
                      {/* Header */}
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                          mb: 1,
                          flexWrap: 'wrap',
                        }}
                      >
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                          {review.userName}
                        </Typography>
                        {review.verified && (
                          <Chip
                            icon={<VerifiedIcon />}
                            label="Verified Purchase"
                            size="small"
                            color="success"
                            variant="outlined"
                            sx={{ height: 20, fontSize: '0.7rem' }}
                          />
                        )}
                        <Typography variant="caption" color="text.secondary">
                          {formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })}
                        </Typography>
                      </Box>

                      {/* Rating */}
                      <Rating value={review.rating} readOnly size="small" sx={{ mb: 1 }} />

                      {/* Title */}
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                        {review.title}
                      </Typography>

                      {/* Comment */}
                      <Typography variant="body2" color="text.secondary" paragraph>
                        {review.comment}
                      </Typography>

                      {/* Helpful */}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <ThumbUpIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                        <Typography variant="caption" color="text.secondary">
                          {review.helpful} {review.helpful === 1 ? 'person' : 'people'} found this
                          helpful
                        </Typography>
                      </Box>
                    </Box>
                  </Box>

                  {/* Divider between reviews */}
                  {index < reviews.length - 1 && <Divider sx={{ mt: 3 }} />}
                </Box>
              ))}
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  )
}

export default ReviewSection

