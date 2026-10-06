import type { Metadata } from 'next';
import { AuthLayout } from '../../components/auth-layout';
export const metadata: Metadata = {title:'Login | Pushthidham Haveli',description:'Donor account login at Pushthidham Haveli.'};
export default function Page(){return <AuthLayout mode="login"/>;}
