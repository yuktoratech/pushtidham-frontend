import type { Metadata } from 'next';
import { AccountLayout } from '../../../components/account-layout';
import { DonationHistory } from '../../../components/account-donations';
export const metadata:Metadata={title:'Donation History | Pushthidham Haveli',description:'Review donation history in your Pushthidham Haveli donor account preview.'};
export default function DonationsPage(){return <AccountLayout title="Donation History" description="Review your contributions and the receipt options for each one."><DonationHistory/></AccountLayout>;}
