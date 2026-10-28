export const festivalGroups = {
  dolotsav: 'Dolotsav',
  'pragatya-divas-maha-bhog': 'Pragatya Divas / Maha Bhog',
  'nand-mahotsav': 'Nand Mahotsav',
  'adhikmas-hindola': 'Adhikmas / Hindola',
  annakut: 'Annakut',
} as const;
export type FestivalKey = keyof typeof festivalGroups;
export const dailySevaSlugs = ['mangla-seva','palna-seva','silver-palna-seva','rajbhog-seva','gold-palna-seva','shayan-seva','whole-day-manorathi'];
export function festivalName(key?: string) {return festivalGroups[key as FestivalKey] || '';}
