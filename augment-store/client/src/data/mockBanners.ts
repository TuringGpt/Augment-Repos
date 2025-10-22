import type { PromotionalBanner } from '@features/products/types/banner'

export const mockBanners: PromotionalBanner[] = [
  // Left side banners (small)
  {
    id: 'banner-1',
    title: 'Summer Sale',
    subtitle: 'Up to 50% Off',
    imageUrl: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800&h=400&fit=crop',
    ctaText: 'Shop Now',
    ctaLink: '/products',
    backgroundColor: '#FFE5B4',
    textColor: '#1a1a1a',
    size: 'small',
  },
  {
    id: 'banner-2',
    title: 'New Arrivals',
    subtitle: 'Fresh Styles',
    imageUrl: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=400&fit=crop',
    ctaText: 'Explore',
    ctaLink: '/products',
    backgroundColor: '#E6F3FF',
    textColor: '#1a1a1a',
    size: 'small',
  },
  // Center banner (large)
  {
    id: 'banner-3',
    title: 'Mega Sale Event',
    subtitle: 'Limited Time Offer',
    description: 'Get amazing deals on all categories. Don\'t miss out!',
    imageUrl: 'https://images.unsplash.com/photo-1607082349566-187342175e2f?w=1200&h=600&fit=crop',
    ctaText: 'Shop All Deals',
    ctaLink: '/products',
    backgroundColor: '#1a1a1a',
    textColor: '#ffffff',
    size: 'large',
  },
  // Right side banners (small)
  {
    id: 'banner-4',
    title: 'Electronics',
    subtitle: '20% Off',
    imageUrl: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=800&h=400&fit=crop',
    ctaText: 'View Deals',
    ctaLink: '/products',
    backgroundColor: '#F0E6FF',
    textColor: '#1a1a1a',
    size: 'small',
  },
  {
    id: 'banner-5',
    title: 'Fashion Week',
    subtitle: 'Trending Now',
    imageUrl: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=800&h=400&fit=crop',
    ctaText: 'Discover',
    ctaLink: '/products',
    backgroundColor: '#FFE6F0',
    textColor: '#1a1a1a',
    size: 'small',
  },
]

