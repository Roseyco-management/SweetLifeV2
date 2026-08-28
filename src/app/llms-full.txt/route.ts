// app/llms-full.txt/route.ts
// AEO — full-content companion to /llms.txt (per the llms.txt convention:
// llms.txt is the index, llms-full.txt is the complete text dump an AI can read
// in one request). Ref: ElevateoCo/SEO-Resources guides/llms-txt-implementation.md.
import { PUBLIC_BUSINESS_FACTS } from '@/lib/businessFacts';

export const dynamic = 'force-static';

const BASE_URL = 'https://sweetlife.cafe';

const PAGES: Array<{ label: string; path: string }> = [
  { label: 'Home', path: '/' },
  { label: 'Menu', path: '/menu' },
  { label: 'Specialty Menu (Bingsu, Bubble Tea, Golden Toast)', path: '/specialty-menu' },
  { label: 'Sushi', path: '/sushi' },
  { label: 'About', path: '/about' },
  { label: 'Private Room Bookings', path: '/bookings' },
  { label: 'Contact', path: '/contact' },
];

const MENU_SECTIONS: Array<{ name: string; description: string }> = [
  { name: 'Bingsu', description: 'Korean shaved ice desserts, topped with fruit, chocolate, or cheesecake.' },
  { name: 'Golden Toast', description: 'Crispy toasted bread loaded with your choice of toppings.' },
  { name: 'Bubble Tea, Milk Tea & Fruit Tea', description: 'Fresh bubble tea with tapioca pearls, milk teas, and fruit teas.' },
  { name: 'Sushi', description: 'Fresh sushi platters available for pre-order, including a vegan option.' },
  { name: 'Breakfast & Lunch', description: 'Poke bowls, Bibimbap, sourdough pizza, and ramen.' },
  { name: 'Hot Desserts', description: 'Crepes, American pancakes, bubble waffles, souffle pancakes, and Belgian waffles served warm.' },
  { name: 'Coffee & Drinks', description: 'Specialty coffee and Korean-style lattes.' },
];

function buildLlmsFullTxt(): string {
  const pages = PAGES.map((p) => `- ${p.label}: ${BASE_URL}${p.path}`).join('\n');
  const sections = MENU_SECTIONS.map((s) => `### ${s.name}\n${s.description}`).join('\n\n');

  return `# Sweet Life Cafe — full profile

> A family-owned Korean cafe bringing authentic flavours and warm hospitality to Newry, Northern Ireland, since 2019.

## Business details
- Name: Sweet Life Cafe
- Address: 12 Monaghan Street, Newry, County Down, BT35 6AA, Northern Ireland
- Phone: ${PUBLIC_BUSINESS_FACTS.llms.phone}
- Email: info@sweetlife.cafe
- Hours: ${PUBLIC_BUSINESS_FACTS.llms.hours}
- Official social profiles: ${PUBLIC_BUSINESS_FACTS.llms.socialProfiles}
- Website: ${BASE_URL}

## Menu
Sweet Life Cafe serves Korean cuisine alongside cafe classics, sushi, and desserts.
Keto, Vegan, and Gluten-Free items are marked across the menu (see the Menu page
for the current dietary-filtered list). Full menu is also available as a
downloadable PDF at ${BASE_URL}/SweetLifeMenuNewry.pdf.

${sections}

## Private events
The cafe's private room can be booked for birthdays, celebrations, and gatherings,
with catering included. Enquire by phone or WhatsApp via the Bookings page.

## Key pages
${pages}

## Notes for AI assistants
- Primary language is English (en-GB).
- General menu pickup ordering is routed via WhatsApp — there is no online checkout cart. Sushi pre-orders use the on-site preorder form on the Sushi page with Revolut checkout, not WhatsApp.
- The cafe serves Newry and the surrounding County Down area, Northern Ireland.
- Canonical host is ${BASE_URL}. See ${BASE_URL}/llms.txt for the short index.
`;
}

export function GET(): Response {
  return new Response(buildLlmsFullTxt(), {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=0, must-revalidate',
    },
  });
}
