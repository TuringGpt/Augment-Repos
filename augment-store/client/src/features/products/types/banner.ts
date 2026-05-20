export interface PromotionalBanner {
  id: string
  title: string
  titleKey?: string
  subtitle?: string
  subtitleKey?: string
  description?: string
  descriptionKey?: string
  imageUrl: string
  ctaText?: string
  ctaTextKey?: string
  ctaLink?: string
  backgroundColor?: string
  textColor?: string
  size: 'small' | 'large'
}

