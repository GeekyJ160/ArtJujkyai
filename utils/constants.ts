import { ArtStyle, Character } from '../types';

export const styleOptions: ArtStyle[] = [
  {
    id: 'pixar',
    name: 'Pixar',
    prompt: 'in the style of Pixar 3D animation, vibrant colors, detailed characters, cinematic lighting, smooth textures, family-friendly',
    image: 'https://picsum.photos/seed/pixar/200/200',
    category: 'Digital',
    keywords: ['character design', 'storytelling', 'whimsical', 'heartwarming', '3D render'],
  },
  {
    id: 'anime',
    name: 'Anime',
    prompt: 'in the style of modern anime, detailed linework, expressive eyes, dynamic pose, vibrant colors, high quality, sharp focus',
    image: 'https://picsum.photos/seed/anime/200/200',
    category: 'Digital',
    keywords: ['kawaii', 'shonen', 'shojo', 'mecha', 'Studio Ghibli style'],
  },
  {
    id: 'cinematic',
    name: 'Cinematic',
    prompt: 'cinematic film still, dramatic lighting, high contrast, film grain, epic composition, photorealistic, anamorphic lens flare',
    image: 'https://picsum.photos/seed/cinematic/200/200',
    category: 'Photography',
    keywords: ['film noir', 'epic landscape', 'dramatic portrait', 'anamorphic', 'color grading'],
  },
  {
    id: 'fantasy',
    name: 'Fantasy',
    prompt: 'fantasy art style, magical elements, ethereal atmosphere, detailed fantasy landscape, mythical creatures, glowing effects, oil on canvas',
    image: 'https://picsum.photos/seed/fantasy/200/200',
    category: 'Painting',
    keywords: ['dragons', 'elves', 'enchanted forest', 'glowing runes', 'mythical'],
  },
    {
    id: 'luxury',
    name: 'Luxury',
    prompt: 'luxury fashion photography style, elegant, high-end, sophisticated, glossy finish, professional lighting, vogue editorial',
    image: 'https://picsum.photos/seed/luxury/200/200',
    category: 'Photography',
    keywords: ['high fashion', 'Vogue', 'elegant', 'gold accents', 'couture'],
  },
  {
    id: 'cultural',
    name: 'Cultural',
    prompt: 'in a traditional cultural art style, intricate patterns, vibrant colors, historical motifs, detailed brushwork, folk art',
    image: 'https://picsum.photos/seed/cultural/200/200',
    category: 'Painting',
    keywords: ['tribal patterns', 'folk art', 'traditional motifs', 'heritage', 'indigenous'],
  },
  {
    id: 'surrealism',
    name: 'Surreal',
    prompt: 'surrealist painting, dreamlike, bizarre, unexpected juxtapositions, subconscious exploration, in the style of Salvador Dalí and René Magritte',
    image: 'https://picsum.photos/seed/surreal/200/200',
    category: 'Painting',
    keywords: ['dreamlike', 'melting clocks', 'bizarre', 'Dalí-esque', 'juxtaposition'],
  },
  {
    id: 'abstract',
    name: 'Abstract',
    prompt: 'abstract art, non-representational, focus on color, form, and texture, geometric shapes, expressive brushstrokes, in the style of Wassily Kandinsky',
    image: 'https://picsum.photos/seed/abstract/200/200',
    category: 'Painting',
    keywords: ['geometric', 'non-representational', 'bold colors', 'expressive', 'Kandinsky'],
  },
  {
    id: 'pixelart',
    name: 'Pixel Art',
    prompt: '8-bit pixel art, retro video game style, limited color palette, blocky, nostalgic, sprites, detailed pixel work',
    image: 'https://picsum.photos/seed/pixelart/200/200',
    category: 'Digital',
    keywords: ['8-bit', '16-bit', 'retro gaming', 'sprite', 'chiptune aesthetic'],
  },
  {
    id: 'cyberpunk',
    name: 'Cyberpunk',
    prompt: 'cyberpunk style, futuristic cityscape, neon lights, high-tech, dystopian, Blade Runner aesthetic, moody atmosphere',
    image: 'https://picsum.photos/seed/cyberpunk/200/200',
    category: 'Digital',
    keywords: ['neon-drenched', 'dystopian', 'cyborgs', 'megacity', 'holograms'],
  },
  {
    id: 'steampunk',
    name: 'Steampunk',
    prompt: 'steampunk style, Victorian era technology, gears, cogs, steam-powered machinery, retro-futuristic, brass and copper details',
    image: 'https://picsum.photos/seed/steampunk/200/200',
    category: 'Digital',
    keywords: ['gears and cogs', 'Victorian', 'airship', 'goggles', 'brass automaton'],
  },
  {
    id: 'gothic',
    name: 'Gothic',
    prompt: 'gothic art style, dark, mysterious, intricate architecture, pointed arches, stained glass, dramatic shadows, moody atmosphere',
    image: 'https://picsum.photos/seed/gothic/200/200',
    category: 'Painting',
    keywords: ['dark fantasy', 'vampiric', 'cathedral', 'moonlit', 'macabre'],
  },
  {
    id: 'artnouveau',
    name: 'Art Nouveau',
    prompt: 'Art Nouveau style, elegant, flowing lines, organic forms, decorative patterns, inspired by nature, Alphonse Mucha aesthetic',
    image: 'https://picsum.photos/seed/artnouveau/200/200',
    category: 'Painting',
    keywords: ['organic forms', 'whiplash curves', 'Mucha-inspired', 'elegant', 'decorative'],
  },
  {
    id: 'impressionism',
    name: 'Impressionism',
    prompt: 'Impressionist painting style, visible brushstrokes, emphasis on light and its changing qualities, ordinary subject matter, in the style of Claude Monet and Edgar Degas',
    image: 'https://picsum.photos/seed/impressionism/200/200',
    category: 'Painting',
    keywords: ['en plein air', 'dappled light', 'Monet style', 'visible brushstrokes', 'soft focus'],
  },
  {
    id: 'vaporwave',
    name: 'Vaporwave',
    prompt: 'Vaporwave aesthetic, neon grids, 80s retro-futurism, glitch art, roman statues, pastel gradients, palm trees, nostalgic, surreal',
    image: 'https://picsum.photos/seed/vaporwave/200/200',
    category: 'Digital',
    keywords: ['80s retro', 'neon grid', 'glitch effect', 'pastel goth', 'synthwave'],
  },
  {
    id: 'watercolor',
    name: 'Watercolor',
    prompt: 'delicate watercolor painting, soft edges, translucent layers of color, wet-on-wet technique, paper texture, gentle and flowing',
    image: 'https://picsum.photos/seed/watercolor/200/200',
    category: 'Painting',
    keywords: ['soft wash', 'translucent', 'wet-on-wet', 'paper texture', 'botanical'],
  },
  {
    id: 'comicbook',
    name: 'Comic Book',
    prompt: 'classic comic book art style, bold ink lines, halftone dot shading, dynamic action poses, speech bubbles, vibrant flat colors, graphic novel aesthetic',
    image: 'https://picsum.photos/seed/comicbook/200/200',
    category: 'Digital',
    keywords: ['superhero', 'graphic novel', 'halftone', 'bold lines', 'pop art'],
  },
  {
    id: 'minimalist',
    name: 'Minimalist',
    prompt: 'minimalist design, clean lines, geometric shapes, ample negative space, limited and muted color palette, simplicity, abstract',
    image: 'https://picsum.photos/seed/minimalist/200/200',
    category: 'Digital',
    keywords: ['simplicity', 'negative space', 'clean lines', 'monochromatic', 'zen'],
  },
  {
    id: 'vintagephoto',
    name: 'Vintage Photo',
    prompt: 'vintage photograph from the 1950s, sepia tones, film grain, slightly faded, soft focus, nostalgic atmosphere, analog camera look',
    image: 'https://picsum.photos/seed/vintagephoto/200/200',
    category: 'Photography',
    keywords: ['sepia', 'film grain', 'retro', 'nostalgic', 'daguerreotype'],
  },
  {
    id: 'artdeco',
    name: 'Art Deco',
    prompt: 'Art Deco style, glamorous, elegant, geometric patterns, strong symmetrical lines, rich colors, gold and chrome accents, 1920s jazz age aesthetic',
    image: 'https://picsum.photos/seed/artdeco/200/200',
    category: 'Painting',
    keywords: ['roaring twenties', 'geometric patterns', 'gold inlay', 'Great Gatsby', 'streamlined'],
  },
  {
    id: 'popart',
    name: 'Pop Art',
    prompt: 'Pop Art style, bold and vibrant colors, heavy outlines, screen printing effect, repetition of subjects, inspired by Andy Warhol and Roy Lichtenstein',
    image: 'https://picsum.photos/seed/popart/200/200',
    category: 'Painting',
    keywords: ['Warhol style', 'Lichtenstein dots', 'bold colors', 'screenprint', 'mass culture'],
  },
  {
    id: 'ukiyoe',
    name: 'Ukiyo-e',
    prompt: 'traditional Japanese Ukiyo-e woodblock print style, flowing lines, flat areas of color, scenes of nature or daily life, inspired by Hokusai and Hiroshige',
    image: 'https://picsum.photos/seed/ukiyoe/200/200',
    category: 'Painting',
    keywords: ['woodblock print', 'Hokusai style', 'Edo period', 'The Great Wave', 'Japanese art'],
  },
];

export const characterOptions: Character[] = [
  {
    id: 'char1',
    name: 'Blobby',
    viewBox: '0 0 100 100',
    svgTemplate: `
      <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="grad1" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
            <stop offset="0%" style="stop-color:rgb(167, 222, 255);stop-opacity:1" />
            <stop offset="100%" style="stop-color:rgb(55, 150, 255);stop-opacity:1" />
          </radialGradient>
        </defs>
        <path d="M 50,10 C 10,10 10,90 50,90 C 90,90 90,10 50,10 Z" fill="url(#grad1)"/>
        <circle cx="35" cy="40" r="5" fill="white" />
        <circle cx="65" cy="40" r="5" fill="white" />
        <circle cx="36" cy="41" r="2" fill="black" />
        <circle cx="66" cy="41" r="2" fill="black" />
        <path d="{{MOUTH_PATH}}" fill="#444" />
      </svg>
    `,
    mouths: [
      'M 40 70 Q 50 75 60 70', // Closed
      'M 40 70 Q 50 80 60 70', // Slightly open
      'M 40 68 C 45 85, 55 85, 60 68 Z', // Open
      'M 38 65 C 45 88, 55 88, 62 65 Z', // Wide open (O shape)
      'M 40 72 Q 50 65 60 72', // Frown / U shape
    ],
  },
  {
    id: 'char2',
    name: 'Blocky',
    viewBox: '0 0 100 100',
    svgTemplate: `
       <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="grad2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:rgb(255,170,150);stop-opacity:1" />
            <stop offset="100%" style="stop-color:rgb(255,100,80);stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect x="15" y="15" width="70" height="70" rx="10" fill="url(#grad2)" />
        <rect x="30" y="35" width="15" height="10" fill="white" />
        <rect x="55" y="35" width="15" height="10" fill="white" />
        <rect x="35" y="36" width="5" height="8" fill="black" />
        <rect x="60" y="36" width="5" height="8" fill="black" />
        <path d="{{MOUTH_PATH}}" fill="#333" />
      </svg>
    `,
     mouths: [
      'M 40 70 L 60 70 L 60 72 L 40 72 Z', // Closed
      'M 40 70 L 60 70 L 60 75 L 40 75 Z', // Slightly open
      'M 40 68 L 60 68 L 62 80 L 38 80 Z', // Open
      'M 42 65 C 45 85, 55 85, 58 65 Z', // Wide open (O shape)
      'M 40 75 L 60 75 L 55 68 L 45 68 Z', // Frown
    ],
  },
];