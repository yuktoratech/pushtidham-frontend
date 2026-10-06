export type GivingOpportunity = {
  slug: string;
  title: string;
  homeTitle?: string;
  shortDescription: string;
  fullDescription: string;
  image: string;
  imageAlt: string;
  suggestedAmounts: number[];
  category: 'General' | 'Seva' | 'Festivals' | 'Community';
  icon: 'give' | 'temple' | 'seva';
  detailsPath: string;
};
const opportunities: Omit<GivingOpportunity,'detailsPath'>[] = [
  {slug:'general-donation',title:'General Donation',shortDescription:'Support the temple and its daily activities.',fullDescription:'An offering towards the daily life of Pushthidham Haveli, helping sustain a welcoming place for darshan, devotion and community seva.',image:'/images/diya.webp',imageAlt:'A brass diya glowing among marigold flowers',suggestedAmounts:[25,51,101,251,501],category:'General',icon:'give'},
  {slug:'annakut-mahotsav',title:'Annakut Mahotsav',shortDescription:'Offer your support for Annakut bhog, aarti and community prasadam.',fullDescription:'Help our community celebrate gratitude to Shri Krishna through Annakut offerings, devotional aarti and the sharing of prasadam.',image:'/images/annakut.webp',imageAlt:'Traditional Annakut offerings arranged before Shri Krishna',suggestedAmounts:[25,51,101,251,501],category:'Festivals',icon:'seva'},
  {slug:'temple-seva',title:'Temple Seva',shortDescription:'Support daily seva and the care of our Haveli.',fullDescription:'Contribute towards daily temple seva and the care of our spiritual home, supporting the traditions and devotional activities that bring us together.',image:'/images/haveli-about.webp',imageAlt:'A serene Haveli with white domes and temple gardens',suggestedAmounts:[25,51,101,251,501],category:'Seva',icon:'temple'},
  {slug:'prasad-seva',title:'Prasad Seva',shortDescription:'Share the joy of prasadam with devotees, families and visitors.',fullDescription:'Support the preparation and sharing of prasadam, an offering of love that welcomes devotees and visitors to the Haveli community.',image:'/images/annakut.webp',imageAlt:'Vegetarian offerings and prasadam prepared for a temple celebration',suggestedAmounts:[25,51,101,251,501],category:'Seva',icon:'give'},
  {slug:'festival-sponsorship',title:'Festival Sponsorship',homeTitle:'Festival Donation',shortDescription:'Contribute towards our devotional celebrations.',fullDescription:'Support festival seva, devotional music and community gatherings for celebrations such as Janmashtami and Sharad Purnima. Every offering helps our traditions flourish.',image:'/images/devotional-hero.webp',imageAlt:'Shri Krishna adorned with flowers for a devotional celebration',suggestedAmounts:[25,51,101,251,501],category:'Festivals',icon:'seva'},
  {slug:'community-religious-activities',title:'Community & Religious Activities',shortDescription:'Help nurture faith, learning and togetherness across generations.',fullDescription:'Support devotional gatherings, religious learning and community activities that share the values of seva, bhakti and sanskar with families and future generations.',image:'/images/haveli-about.webp',imageAlt:'A peaceful temple courtyard surrounded by greenery',suggestedAmounts:[25,51,101,251,501],category:'Community',icon:'temple'}
];
export const givingOpportunities: GivingOpportunity[] = opportunities.map(item=>({...item,detailsPath:`/giving/${item.slug}`}));
export function getGivingOpportunity(slug:string){return givingOpportunities.find(item=>item.slug===slug);}
export function givingDetailsPath(item:GivingOpportunity,eventSlug?:string){return item.detailsPath+(eventSlug?`?event=${encodeURIComponent(eventSlug)}`:'');}
