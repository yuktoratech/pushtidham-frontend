import type {Metadata} from 'next';
export const metadata:Metadata={title:'Donor Account | Pushtidham Haveli',description:'View your donor account and donation history.',robots:{index:false,follow:false}};
export default function AccountMetadataLayout({children}:{children:React.ReactNode}){return children;}
