import type { Metadata } from 'next';
import { AuthLayout } from '../../components/auth-layout';
export const metadata: Metadata = {title:'Create Account | Pushtidham Haveli',description:'Donor account create account at Pushtidham Haveli.'};
export default function Page(){return <AuthLayout mode="register"/>;}
