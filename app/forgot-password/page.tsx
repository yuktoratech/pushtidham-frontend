import type { Metadata } from 'next';
import { AuthLayout } from '../../components/auth-layout';
export const metadata: Metadata = {title:'Forgot Password | Pushtidham Haveli',description:'Request a secure donor account password reset link.'};
export default function Page(){return <AuthLayout mode="forgot-password"/>;}
