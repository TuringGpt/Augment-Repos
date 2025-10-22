import type { Review } from '@features/products/types'

export const mockReviews: Record<string, Review[]> = {
  '1': [
    {
      id: 'r1',
      userId: 'u1',
      userName: 'John Smith',
      userAvatar: 'https://i.pravatar.cc/150?img=12',
      rating: 5,
      title: 'Best phone I\'ve ever owned!',
      comment:
        'The iPhone 15 Pro Max exceeded all my expectations. The camera quality is phenomenal, especially in low light. The titanium build feels premium and the battery life easily gets me through a full day of heavy use.',
      createdAt: '2024-10-15T14:30:00Z',
      helpful: 45,
      verified: true,
    },
    {
      id: 'r2',
      userId: 'u2',
      userName: 'Sarah Johnson',
      userAvatar: 'https://i.pravatar.cc/150?img=5',
      rating: 4,
      title: 'Great phone, but expensive',
      comment:
        'Love the new features and the performance is incredible. The only downside is the price point, but if you can afford it, it\'s worth every penny. The Action button is more useful than I thought it would be.',
      createdAt: '2024-10-12T09:15:00Z',
      helpful: 32,
      verified: true,
    },
    {
      id: 'r3',
      userId: 'u3',
      userName: 'Michael Chen',
      userAvatar: 'https://i.pravatar.cc/150?img=33',
      rating: 5,
      title: 'Camera is absolutely stunning',
      comment:
        'As a photography enthusiast, the camera system on this phone is mind-blowing. The 5x telephoto lens produces sharp, detailed images. ProRAW and ProRes video recording are game changers for content creators.',
      createdAt: '2024-10-10T16:45:00Z',
      helpful: 28,
      verified: true,
    },
    {
      id: 'r4',
      userId: 'u4',
      userName: 'Emily Rodriguez',
      userAvatar: 'https://i.pravatar.cc/150?img=9',
      rating: 4,
      title: 'Solid upgrade from iPhone 13',
      comment:
        'Upgraded from iPhone 13 and the difference is noticeable. The screen is brighter, the processor is faster, and the battery life is significantly better. USB-C is a welcome change!',
      createdAt: '2024-10-08T11:20:00Z',
      helpful: 19,
      verified: true,
    },
  ],
  '2': [
    {
      id: 'r5',
      userId: 'u5',
      userName: 'David Park',
      userAvatar: 'https://i.pravatar.cc/150?img=15',
      rating: 5,
      title: 'S Pen makes all the difference',
      comment:
        'The S24 Ultra is a powerhouse. The S Pen integration is seamless and incredibly useful for note-taking and photo editing. The 200MP camera captures stunning detail.',
      createdAt: '2024-10-14T13:00:00Z',
      helpful: 38,
      verified: true,
    },
    {
      id: 'r6',
      userId: 'u6',
      userName: 'Lisa Anderson',
      userAvatar: 'https://i.pravatar.cc/150?img=20',
      rating: 4,
      title: 'Best Android phone available',
      comment:
        'Coming from a Pixel, the S24 Ultra is impressive. The display is gorgeous, performance is top-notch, and One UI has improved significantly. Battery life could be better with heavy use.',
      createdAt: '2024-10-11T10:30:00Z',
      helpful: 25,
      verified: true,
    },
  ],
  '3': [
    {
      id: 'r7',
      userId: 'u7',
      userName: 'Robert Taylor',
      userAvatar: 'https://i.pravatar.cc/150?img=52',
      rating: 5,
      title: 'Perfect for developers',
      comment:
        'The M3 chip is incredibly fast. Compiling large projects is a breeze, and I can run multiple VMs without any slowdown. The display is perfect for long coding sessions.',
      createdAt: '2024-10-13T15:45:00Z',
      helpful: 52,
      verified: true,
    },
    {
      id: 'r8',
      userId: 'u8',
      userName: 'Jennifer Lee',
      userAvatar: 'https://i.pravatar.cc/150?img=27',
      rating: 5,
      title: 'Video editing powerhouse',
      comment:
        'As a video editor, this laptop handles 4K footage effortlessly. Final Cut Pro runs like a dream, and the battery life is amazing - I can edit for hours without plugging in.',
      createdAt: '2024-10-09T12:00:00Z',
      helpful: 41,
      verified: true,
    },
    {
      id: 'r9',
      userId: 'u9',
      userName: 'Thomas Wilson',
      userAvatar: 'https://i.pravatar.cc/150?img=60',
      rating: 4,
      title: 'Expensive but worth it',
      comment:
        'The price is steep, but the performance and build quality justify it. The keyboard and trackpad are the best I\'ve used. Only wish it had more ports.',
      createdAt: '2024-10-07T14:20:00Z',
      helpful: 33,
      verified: true,
    },
  ],
  '5': [
    {
      id: 'r10',
      userId: 'u10',
      userName: 'Amanda Brown',
      userAvatar: 'https://i.pravatar.cc/150?img=16',
      rating: 5,
      title: 'Best noise cancellation ever',
      comment:
        'These headphones are incredible. The noise cancellation is so good I can work in a busy coffee shop without any distractions. Sound quality is exceptional across all genres.',
      createdAt: '2024-10-16T09:30:00Z',
      helpful: 67,
      verified: true,
    },
    {
      id: 'r11',
      userId: 'u11',
      userName: 'Chris Martinez',
      userAvatar: 'https://i.pravatar.cc/150?img=68',
      rating: 5,
      title: 'Perfect for travel',
      comment:
        'Used these on a 12-hour flight and they were perfect. Battery lasted the entire trip, and the noise cancellation made the flight so much more pleasant. Highly recommend!',
      createdAt: '2024-10-14T16:00:00Z',
      helpful: 54,
      verified: true,
    },
    {
      id: 'r12',
      userId: 'u12',
      userName: 'Nicole Davis',
      userAvatar: 'https://i.pravatar.cc/150?img=23',
      rating: 4,
      title: 'Great sound, comfortable fit',
      comment:
        'Sound quality is amazing and they\'re very comfortable for long listening sessions. The only minor issue is they can feel a bit warm after a few hours of use.',
      createdAt: '2024-10-12T11:45:00Z',
      helpful: 42,
      verified: true,
    },
  ],
}

