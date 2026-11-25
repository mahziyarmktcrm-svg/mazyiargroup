// Business-wide content for Mahziyar Group. Facts come from the live mahziyargroup.com (read 25 Nov 2026)
// and the client's brief (social links + phone). Edit here to change contact details site-wide.

export const site = {
  url: 'https://www.mahziyargroup.com',
  name: 'Mahziyar Group',
  legalName: 'Mahziyar Real Estate Marketing',
  short: 'Mahziyar',
  tagline: 'Real Estate Marketing',
  motto: 'Do not wait to buy real estate — buy real estate and wait.',
  description:
    'Mahziyar Group (Mahziyar Real Estate Marketing) is a Blue Area, Islamabad real estate firm for authorized societies and high-rise projects: Faisal Town, Faisal Hills, Top City-1, Mumtaz City, Park View City, DHA Gandhara, Capital Smart City, PECHS, Taj Residencia and Blue World City.',
  since: 2022,
  phones: {
    main: { display: '0311 1555426', intl: '+92 311 1555426', tel: '+923111555426' },
    alt: { display: '0312 5772180', intl: '+92 312 5772180', tel: '+923125772180' },
    whatsapp: { display: '0311 1555426', wa: '923111555426' },
  },
  email: '', // ⚠ add the office email when the client shares it (shown everywhere automatically)
  address: {
    line1: 'Office #113, First Floor, Benazir Plaza',
    line2: 'Jinnah Avenue, Blue Area, Islamabad',
    street: 'Office #113, First Floor, Benazir Plaza, Jinnah Avenue, Blue Area',
    near: 'Block H, G-7/2',
    city: 'Islamabad', region: 'Islamabad Capital Territory', postal: '44000', country: 'PK',
    geo: { lat: 33.7128, lng: 73.0657 }, // Blue Area, Jinnah Avenue (area-level precision)
    mapQuery: 'Benazir Plaza, Jinnah Avenue, Blue Area, Islamabad',
  },
  hours: [['Monday – Saturday', 'Until 7:00 PM'], ['Sunday', 'By appointment']],
  // Links as supplied by the client (tracking parameters removed).
  // Links as supplied by the client (tracking parameters removed). Audience figures read 25 Nov 2026:
  // Facebook from mahziyargroup.com, Instagram & YouTube from the public profiles. TikTok/LinkedIn need a login to read:
  // fill `count` when the client shares them and they appear on /connect/ automatically.
  social: [
    { id: 'fb', name: 'Facebook', url: 'https://www.facebook.com/share/1VhAPSKSWD/', handle: 'Mahziyar Marketing', note: '19.9K+ followers', count: 19900, countLabel: '19.9K+', unit: 'followers', extra: '5.0 ★ page rating', pitch: 'Daily listings, offers and site-visit updates — our biggest community.' },
    { id: 'ig', name: 'Instagram', url: 'https://www.instagram.com/mahziyarmarketing', handle: '@mahziyarmarketing', note: 'Projects & site updates', count: 3211, countLabel: '3.2K+', unit: 'followers', extra: 'Reels & project stories', pitch: 'Villas, towers and on-site moments in reels and stories.' },
    { id: 'yt', name: 'YouTube', url: 'https://www.youtube.com/@mahziyarmarketing', handle: '@mahziyarmarketing', note: 'Site visits & walkthroughs', count: 354, countLabel: '354', unit: 'subscribers', extra: '162 videos', pitch: 'Full site visits, walkthroughs and market updates.' },
    { id: 'tt', name: 'TikTok', url: 'https://www.tiktok.com/@maysamraza1', handle: '@maysamraza1', note: 'Quick property reels', count: 0, countLabel: '', unit: '', extra: 'Short property reels', pitch: 'Quick 60-second property reels and on-ground clips.' },
    { id: 'li', name: 'LinkedIn', url: 'https://www.linkedin.com/company/mahziyar-marketing/', handle: 'Mahziyar Marketing', note: 'Company page', count: 0, countLabel: '', unit: '', extra: 'Company updates', pitch: 'Company news, partnerships and project announcements.' },
  ],
  google: {
    rating: '4.9', count: 16, facebookRating: '5.0',
    url: 'https://www.google.com/search?q=Mahziyar+Marketing+Islamabad',
    maps: 'https://www.google.com/maps/search/?api=1&query=Mahziyar+Marketing+Benazir+Plaza+Jinnah+Avenue+Blue+Area+Islamabad',
  },
  // Dealerships named on the current mahziyargroup.com
  dealerships: ['Park Development Consortium', 'Seven Wonders City Islamabad', 'J7 High Rise Apartments'],
  forms: { analyticsId: '' }, // optional GA4 id, e.g. 'G-XXXXXXX'
};

export const services = [
  { icon: 'plot', title: 'Plot sales & purchase', text: 'Residential and commercial plots — fresh bookings, resale and open files — across the societies on our panel.' },
  { icon: 'chart', title: 'Investment advisory', text: 'Block-by-block comparisons, development status, entry price and a realistic exit horizon before you commit.' },
  { icon: 'tower', title: 'Apartments & high-rise', text: 'Studios to penthouses in the capital’s rising towers — for living, renting out or holding.' },
  { icon: 'shop', title: 'Commercial & retail', text: 'Shops, offices and corporate floors on boulevards that are actually seeing footfall.' },
  { icon: 'megaphone', title: 'Project marketing', text: 'Campaigns, lead generation, a closing team and on-ground activation for developers.' },
  { icon: 'file', title: 'Files, transfer & docs', text: 'Verification, dealer confirmation, transfer, possession and NOC paperwork handled end to end.' },
];

export const steps = [
  { title: 'Consultation', text: 'Tell us your budget, timeline and whether it is for living or investment — by call, WhatsApp or a walk-in at Blue Area.' },
  { title: 'Shortlist & site visit', text: 'Two or three options that genuinely fit, and a drive out to see the ground — not just the brochure.' },
  { title: 'Verification', text: 'File, dealer status, NOC and development position are checked before any payment is even discussed.' },
  { title: 'Booking & transfer', text: 'Booking, instalment schedule, transfer and possession paperwork completed and handed over to you.' },
];

export const promises = [
  { title: 'Authorized, not second-hand', text: 'We work directly with developers, so you get official rates and confirmed inventory instead of a chain of agents.' },
  { title: 'Everything in writing', text: 'Payment plans, transfer costs and dues up front. No surprise premium at the transfer counter.' },
  { title: 'A real office in Blue Area', text: 'Office #113, Benazir Plaza, Jinnah Avenue. Sit down with the team and see the files first.' },
  { title: 'We answer after the sale', text: 'Instalment reminders, transfer follow-ups and resale support long after the booking is done.' },
];

export const faqs = [
  { q: 'Where is the Mahziyar Group office?', a: 'Office #113, First Floor, Benazir Plaza, Jinnah Avenue, Blue Area, Islamabad (near Block H, G-7/2). We are open Monday to Saturday until 7:00 PM, and on Sunday by appointment.' },
  { q: 'Which societies and projects do you deal in?', a: 'Faisal Town, Faisal Hills, Faisal Town Phase 2, Top City-1, Mumtaz City, Park View City, DHA Gandhara, Capital Smart City, PECHS, Taj Residencia and Blue World City — plus high-rise projects including Faisal Jewel, Faisal Heights, The Sofia, The Pearl and Elanza.' },
  { q: 'How do I know a project is authorized?', a: 'We only market projects we can stand behind, and we check the file, the dealer status, the NOC and the development position before any payment is discussed. Ask us for the approval documents of any project on this site.' },
  { q: 'Can overseas Pakistanis buy through you?', a: 'Yes. We share payment plans, availability and documents on WhatsApp, guide the payment to the developer, and send video updates from site, wherever you live.' },
  { q: 'Do you arrange site visits?', a: 'Yes — call or WhatsApp 0311 1555426 and we will plan a visit so you can see the location, the block and the real development progress.' },
  { q: 'Are the prices on this website final?', a: 'Developers revise prices and offers often, and prime locations (corner, park-facing, boulevard) carry extra charges. Always confirm the current rate and plan with our team before paying.' },
];
