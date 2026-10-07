import type {Metadata} from 'next';
import AccountOverview from '../../components/account-overview';
export const metadata:Metadata={title:'My Account | Pushthidham Haveli',description:'View your donor account overview and recent giving at Pushthidham Haveli.'};
export default function AccountPage(){return <AccountOverview/>;}
