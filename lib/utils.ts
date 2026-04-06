export function cn(...inputs: (string | undefined | null | false)[]) {
  return inputs.filter(Boolean).join(' ');
}

export interface Post {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  tags: string[];
  author: {
    name: string;
    avatar: string;
    role: string;
  };
  date: string;
  readTime: string;
  image: string;
  featured?: boolean;
}

export const SAMPLE_POSTS: Post[] = [
  {
    id: '1',
    slug: 'future-of-digital-romanticism',
    title: 'The Future of Digital Romanticism in Design',
    excerpt: 'Exploring how high-contrast palettes and editorial layouts are reshaping the way we experience long-form digital storytelling.',
    content: `In the quiet overlap between silicon logic and human desire lies a new aesthetic frontier. We have long associated "dark modes" with utility—a shield against the glare of late-night productivity. But as the digital landscape matures, we are seeing a shift toward the editorial nocturne: a space where deep blacks and vibrant neons create a canvas for romantic expression.

## The Architecture of Shadows

Designing for the dark requires a fundamental shift in how we perceive depth. Unlike light themes, where shadows imply elevation, dark themes rely on luminosity and tonal shifts. A surface doesn't just "sit" on top of another; it glows with a faint internal light, separated by a slightly higher value of gray or a subtle bleed of color.

> "The screen is no longer a window we look through, but a glowing atmosphere we inhabit. We are curators of light in an infinite void."

Consider the use of high-contrast accents like #b8ffbb (Electric Moss) against a base of #c197fe (Amethyst Pulse). These aren't just colors; they are signals. They guide the eye through the "editorial Z-pattern," ensuring that even in the deepest shadows, the narrative remains clear and compelling.

## Reading Between the Lines

Typography in this ecosystem must be architectural. Using a typeface like Epilogue for headers provides a brutalist weight that grounds the ethereal color palette. Meanwhile, Manrope—with its generous x-height—ensures that long-form essays remain legible even after hours of immersion.`,
    category: 'Editorial Focus',
    tags: ['EDITORIAL', 'THEORY', 'DARK UI'],
    author: {
      name: 'Elara Vance',
      avatar: 'https://picsum.photos/seed/elara/100/100',
      role: 'Editor in Chief'
    },
    date: 'March 24, 2024',
    readTime: '12 min read',
    image: 'https://picsum.photos/seed/romanticism/1200/800',
    featured: true
  },
  {
    id: '2',
    slug: 'constructing-shadows',
    title: 'Constructing Shadows: The Brutalist Revival',
    excerpt: 'How modern dark interfaces draw inspiration from the raw, structural integrity of architectural movements.',
    content: '...',
    category: 'Architecture',
    tags: ['MINIMALISM', 'ARCHITECTURE'],
    author: {
      name: 'Julian Thorne',
      avatar: 'https://picsum.photos/seed/julian/100/100',
      role: 'Staff Writer'
    },
    date: 'March 20, 2024',
    readTime: '5 min read',
    image: 'https://picsum.photos/seed/brutalist/800/1000'
  },
  {
    id: '3',
    slug: 'psychology-deep-palette',
    title: 'The Psychology of the Deep Palette',
    excerpt: 'Why our brains respond more emotionally to saturated accents against nocturnal backdrops.',
    content: '...',
    category: 'Philosophy',
    tags: ['THEORY', 'CHROMATICS'],
    author: {
      name: 'Sarah Hudson',
      avatar: 'https://picsum.photos/seed/sarah/100/100',
      role: 'Contributor'
    },
    date: 'March 18, 2024',
    readTime: '8 min read',
    image: 'https://picsum.photos/seed/palette/800/1000'
  },
  {
    id: '4',
    slug: 'solitude-high-saturation',
    title: 'Solitude in High Saturation',
    excerpt: 'Finding quiet moments in the most vibrant corners of the world\'s megacities.',
    content: '...',
    category: 'Travel',
    tags: ['PHOTOGRAPHY', 'LIFESTYLE'],
    author: {
      name: 'Alex Turner',
      avatar: 'https://picsum.photos/seed/alex/100/100',
      role: 'Photographer'
    },
    date: 'March 15, 2024',
    readTime: '12 min read',
    image: 'https://picsum.photos/seed/solitude/800/1000'
  },
  {
    id: '5',
    slug: 'analog-pulse',
    title: 'The Analog Pulse in Digital Veins',
    excerpt: 'Bringing back the tactile warmth of retro hardware to the modern flat web.',
    content: '...',
    category: 'Tech',
    tags: ['RETROFUTURISM', 'TECH'],
    author: {
      name: 'Elara Vance',
      avatar: 'https://picsum.photos/seed/elara/100/100',
      role: 'Editor in Chief'
    },
    date: 'March 12, 2024',
    readTime: '4 min read',
    image: 'https://picsum.photos/seed/analog/800/1000'
  }
];
