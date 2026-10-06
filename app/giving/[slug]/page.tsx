import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { givingOpportunities, getGivingOpportunity } from '../../../lib/giving';
import { Header, Footer, MobileBottomNav } from '../../../components/layout';
import { GivingDetails } from '../../../components/giving-details';
export const dynamicParams=false;
export function generateStaticParams(){return givingOpportunities.map(item=>({slug:item.slug}));}
export async function generateMetadata({params}:{params:Promise<{slug:string}>}):Promise<Metadata>{
  const item=getGivingOpportunity((await params).slug);
  return item?{title:`${item.title} | Pushthidham Haveli`,description:item.fullDescription}:{title:'Giving opportunity not found | Pushthidham Haveli'};
}
export default async function GivingDetailsPage({params}:{params:Promise<{slug:string}>}){
  const item=getGivingOpportunity((await params).slug);
  if(!item)notFound();
  return <><a className="skip-link" href="#main">Skip to content</a><Header/><main id="main"><GivingDetails opportunity={item}/></main><Footer/><MobileBottomNav/></>;
}
