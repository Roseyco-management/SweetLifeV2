import { serializeJsonLd } from "@/lib/schema-utils";
import { PUBLIC_BUSINESS_FACTS } from "@/lib/businessFacts";

export default function StructuredData() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    "@id": "https://sweetlife.cafe/#restaurant",
    "name": "Sweet Life Cafe",
    "image": "https://sweetlife.cafe/SweetLifeCafe_Hero_1.webp",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "12 Monaghan Street",
      "addressLocality": "Newry",
      "addressRegion": "County Down",
      "postalCode": "BT35 6AA",
      "addressCountry": "GB"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": 54.1754,
      "longitude": -6.3398
    },
    "url": "https://sweetlife.cafe",
    "email": "sweetlifenewry@gmail.com",
    "servesCuisine": ["Korean", "Cafe", "Sushi", "Desserts", "Bubble Tea"],
    "priceRange": "££",
    "menu": "https://sweetlife.cafe/menu",
    "acceptsReservations": "True",
    "hasMenu": {
      "@type": "Menu",
      "url": "https://sweetlife.cafe/menu",
      "hasMenuSection": [
        {
          "@type": "MenuSection",
          "name": "Bingsu",
          "description": "Korean shaved ice desserts"
        },
        {
          "@type": "MenuSection",
          "name": "Bubble Tea",
          "description": "Fresh bubble tea with tapioca pearls"
        },
        {
          "@type": "MenuSection",
          "name": "Sushi",
          "description": "Fresh sushi platters available for pre-order"
        }
      ]
    },
    ...PUBLIC_BUSINESS_FACTS.schema
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(structuredData) }}
    />
  );
}
