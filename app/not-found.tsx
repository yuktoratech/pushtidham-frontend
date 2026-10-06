import { Header, Footer, MobileBottomNav } from '../components/layout';
import { Button } from '../components/ui';
export default function NotFound(){return <><Header/><main id="main" className="container haveli-not-found"><p className="eyebrow">Pushthidham Haveli</p><h1>Page not found</h1><p>The page you’re looking for is unavailable. Explore our events or return to the Haveli home page.</p><div><Button href="/events">Explore Events</Button><a className="event-all-link" href="/">Return Home</a></div></main><Footer/><MobileBottomNav/></>}
