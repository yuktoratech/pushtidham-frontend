import type { Metadata } from 'next';
import { DonationHistory } from '../../../components/account-donations';
export const metadata:Metadata={title:'Donation History | Pushtidham Haveli',description:'Review donation history in your Pushtidham Haveli donor account preview.'};
export default function DonationsPage(){return <DonationHistory/>;}
