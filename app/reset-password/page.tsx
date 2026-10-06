import type { Metadata } from 'next';
import { AuthLayout } from '../../components/auth-layout';
export const metadata: Metadata = {title:'Reset Password | Pushthidham Haveli',description:'Donor account reset password at Pushthidham Haveli.'};
export default function Page(){return <AuthLayout mode="reset-password"/>;}
