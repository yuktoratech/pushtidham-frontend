// Replace unconfirmed fields only with temple-approved contact information.
export const templeContact = {
  name: 'Pushthidham Haveli',
  locality: 'Ocala, Florida, USA',
  address: null as string | null,
  phone: null as string | null,
  email: null as string | null,
  hours: null as string | null,
  mapsUrl: null as string | null,
  image: '/images/haveli-about.webp',
  unconfirmed: {
    address: 'Street address to be confirmed',
    phone: 'Contact number to be confirmed',
    email: 'Email address to be confirmed',
    hours: 'Darshan hours to be confirmed',
  },
};
