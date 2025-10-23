export interface PromotionalBanner {
  id: string
  title: string
  subtitle?: string
  description?: string
  imageUrl: string
  ctaText?: string
  ctaLink?: string
  backgroundColor?: string
  textColor?: string
  size: 'small' | 'large'
}

