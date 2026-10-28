import type { Metadata } from 'next';
import { AuthLayout } from '../../components/auth-layout';
export const metadata: Metadata = {title:'Login | Pushtidham Haveli',description:'Donor account login at Pushtidham Haveli.'};
export default function Page(){return <AuthLayout mode="login"/>;}
