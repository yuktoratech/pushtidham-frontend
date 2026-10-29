import type {Metadata} from 'next';
import {AccountLayout} from '../../components/account-layout';
export const metadata:Metadata={title:'Donor Account | Pushtidham Haveli',description:'View your donor account and donation history.',robots:{index:false,follow:false}};
export default function AccountMetadataLayout({children}:{children:React.ReactNode}){return <AccountLayout>{children}</AccountLayout>;}
