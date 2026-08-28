/**
 * Evidence preserved for the A1 decision. These values were observed on
 * currently served surfaces before the A1-gated placeholder change and
 * conflict with each other. This test fixture is not imported by production
 * code: it is not a source of business facts and must never be rendered.
 */
export const A1_OBSERVED_CONFLICTS = {
  restaurantJsonLd: {
    telephone: '+44 28 3044 8808',
    weekdays: {
      days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      opens: '09:00',
      closes: '18:00',
    },
    saturday: { opens: '09:00', closes: '18:00' },
    sunday: { opens: '12:00', closes: '17:00' },
    sameAs: [
      'https://www.facebook.com/sweetlifenewry',
      'https://www.instagram.com/sweetlifenewry',
    ],
  },
  llmsTxt: {
    telephone: '+44 7716 508513',
    hours: 'Mon-Wed 08:00-18:00, Thu-Fri 08:00-20:00, Sat 09:00-18:00, Sunday closed',
    instagram: 'https://www.instagram.com/sweet_life_ireland',
  },
  llmsFullTxt: {
    telephone: '+44 7716 508513',
    hours: 'Mon-Wed 08:00-18:00, Thu-Fri 08:00-20:00, Sat 09:00-18:00, Sunday closed',
    instagram: 'https://www.instagram.com/sweet_life_ireland',
  },
  footer: {
    telephone: '+447716508513',
    hours: 'Mon-Wed 08:00-18:00, Thu-Fri 08:00-20:00, Sat 09:00-18:00, Sunday closed',
    facebook: 'https://www.facebook.com/Sweet.Life.Ireland/',
    instagram: 'https://www.instagram.com/sweet_life_ireland',
    tiktok: 'https://www.tiktok.com/@sweetlifeireland',
  },
} as const;
