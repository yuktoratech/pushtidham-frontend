import { Header,Footer,MobileBottomNav } from '../components/layout';
import { HeroSection,QuickLinks,HomeSections } from '../components/home';
export default function Home(){return <><a className="skip-link" href="#main">Skip to content</a><div id="home"><Header/></div><main id="main"><HeroSection/><QuickLinks/><HomeSections/></main><Footer/><MobileBottomNav/></>}
