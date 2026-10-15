import type { Metadata } from 'next';
import { AuthLayout } from '../../components/auth-layout';
export const metadata: Metadata = {title:'Reset Password | Pushtidham Haveli',description:'Password form preview only; no email is sent or password changed.'};
export default function Page(){return <AuthLayout mode="reset-password"/>;}
