export type TempleEvent = {
  id: string;
  slug: string;
  kind: string;
  past: boolean;
  venue: string;
  location: string;
  schedule: { time: string; title: string; description: string }[];
  title: string;
  date: string;
  time: string;
  image: string;
  imageAlt: string;
  description: string;
  programme: string;
  detailsPath: string;
};

const celebrations = {
  janmashtami: {
    slug: 'janmashtami-celebration',
    schedule: [
      {time:'10:00 AM',title:'Opening darshan',description:'Begin the day with darshan of Shri Krishna.'},
      {time:'11:00 AM',title:'Bhajan & kirtan',description:'Join in devotional singing with the community.'},
      {time:'12:00 PM',title:'Festival celebration',description:'Come together for aarti and the main celebration.'},
      {time:'1:00 PM',title:'Mahaprasad',description:'Share prasadam with family and friends.'}
    ],
    title: 'Janmashtami Celebration',
    time: '10:00 AM',
    image: '/images/devotional-hero.webp',
    imageAlt: 'Shri Krishna adorned with flowers',
    description: 'Celebrate the birth of Shri Krishna with darshan, kirtan and a joyful gathering of our community.',
    programme: 'A devotional gathering with special darshan, kirtan and community prasadam. Come together with family and friends in celebration of Shri Krishna.'
  },
  annakut: {
    slug: 'annakut-mahotsav',
    schedule: [
      {time:'9:00 AM',title:'Morning darshan',description:'A peaceful start to our celebration of gratitude.'},
      {time:'10:00 AM',title:'Annakut offerings',description:'Devotional bhog offered to Shri Krishna.'},
      {time:'11:00 AM',title:'Aarti & kirtan',description:'Gather for aarti and devotional singing.'},
      {time:'12:00 PM',title:'Community prasadam',description:'Conclude with a shared offering of prasadam.'}
    ],
    title: 'Annakut Mahotsav',
    time: '9:00 AM',
    image: '/images/annakut.webp',
    imageAlt: 'Traditional vegetarian Annakut offerings in a devotional temple setting',
    description: 'Come together for a celebration of gratitude with Annakut offerings, aarti and community prasadam.',
    programme: 'Join the community in an offering of gratitude to Shri Krishna through Annakut bhog, devotional aarti and shared prasadam.'
  },
  sharad: {
    slug: 'sharad-purnima',
    schedule: [
      {time:'7:00 PM',title:'Evening darshan',description:'Gather for a serene evening of devotion.'},
      {time:'7:30 PM',title:'Aarti & kirtan',description:'Offer prayers and join in devotional singing.'},
      {time:'8:30 PM',title:'Prasadam',description:'Share prasadam and time with our community.'}
    ],
    title: 'Sharad Purnima',
    time: '7:00 PM',
    image: '/images/diya.webp',
    imageAlt: 'A glowing brass diya surrounded by marigold flowers',
    description: 'An evening of devotion with special darshan, aarti and kirtan in the company of our temple community.',
    programme: 'Gather for an evening of special darshan, aarti and devotional kirtan. Share a peaceful celebration of faith and togetherness.'
  }
};

function event(kind: keyof typeof celebrations, date: string, past = false): TempleEvent {
  const id = `${kind}-${date.slice(0,4)}`;
  const slug = `${celebrations[kind].slug}-${date.slice(0,4)}`;
  return { ...celebrations[kind], id, slug, kind, past, date, venue:'Pushthidham Haveli', location:'Ocala, Florida, USA', detailsPath: `/events/${slug}` };
}

// Static client-demo schedules. Replace with temple-approved schedules before launch.
export const upcomingEvents = [event('sharad','2026-10-25'), event('annakut','2026-11-10'), event('janmashtami','2027-08-29')];
export const pastEvents = [event('annakut','2025-11-02',true), event('sharad','2025-10-06',true), event('janmashtami','2025-08-26',true)];

export function eventDate(date: string) {
  return new Intl.DateTimeFormat('en-US',{weekday:'short',day:'numeric',month:'short',year:'numeric',timeZone:'UTC'}).format(new Date(`${date}T12:00:00Z`));
}

export const allEvents = [...upcomingEvents, ...pastEvents];
export const homeEvent = upcomingEvents.find(event => event.kind === 'janmashtami')!;
export function getEvent(slug: string) { return allEvents.find(event => event.slug === slug); }
