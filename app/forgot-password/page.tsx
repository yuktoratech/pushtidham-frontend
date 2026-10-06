import type { Metadata } from 'next';
import { AuthLayout } from '../../components/auth-layout';
export const metadata: Metadata = {title:'Forgot Password | Pushthidham Haveli',description:'Donor account forgot password at Pushthidham Haveli.'};
export default function Page(){return <AuthLayout mode="forgot-password"/>;}
