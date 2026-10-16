import type { Metadata } from 'next';
import { AuthLayout } from '../../components/auth-layout';
export const metadata: Metadata = {title:'Reset Password | Pushtidham Haveli',description:'Reset your donor account password using a secure link.'};
export default function Page(){return <AuthLayout mode="reset-password"/>;}
