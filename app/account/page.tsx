import type {Metadata} from 'next';
import AccountOverview from '../../components/account-overview';
export const metadata:Metadata={title:'My Account | Pushtidham Haveli',description:'View your donor account overview and recent giving at Pushtidham Haveli.'};
export default function AccountPage(){return <AccountOverview/>;}
