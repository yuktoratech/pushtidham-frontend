// Public R2 artwork used by the homepage carousel.
const base = 'https://pub-bcdd94010c11431cad2500a97fbe995f.r2.dev/home-slider/official-5ba55c13ca87a17e';
const adhikMaas = 'https://pub-bcdd94010c11431cad2500a97fbe995f.r2.dev/home-slider/adhik-maas-shrinathji/adhik-maas-shrinathji-hd.webp';
const adhikMaasMobile = 'https://pub-bcdd94010c11431cad2500a97fbe995f.r2.dev/home-slider/adhik-maas-shrinathji/adhik-maas-shrinathji-960.webp';

export const homeSlides = [
  {id: 'adhik-maas-shrinathji', alt: 'Devotional artwork of Lord Shrinathji with devotees', src: adhikMaas, mobileSrc: adhikMaasMobile, position: 'center'},
  {id: 'devotional-hero', alt: 'Shri Krishna in a golden devotional setting', src: `${base}/devotional-hero-1920.webp`, mobileSrc: `${base}/devotional-hero-960.webp`, position: 'right top'},
  {id: 'pushtidham', alt: 'Pushtidham Haveli in Ocala, Florida', src: `${base}/pushtidham-1920.webp`, mobileSrc: `${base}/pushtidham-960.webp`, position: 'center'},
];
