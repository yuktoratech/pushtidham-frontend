import type { Metadata } from 'next';
import { Header, Footer, MobileBottomNav } from '../../../components/layout';
import { GivingDetails } from '../../../components/giving-details';
export const metadata:Metadata={title:'Giving | Pushthidham Haveli',description:'Support a Pushthidham Haveli giving opportunity.'};
export default async function GivingDetailsPage({params}:{params:Promise<{slug:string}>}){
  const {slug}=await params;
  return <><a className="skip-link" href="#main">Skip to content</a><Header/><main id="main"><GivingDetails slug={slug}/></main><Footer/><MobileBottomNav/></>;
}
