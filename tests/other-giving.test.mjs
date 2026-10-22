import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readDonationSelection} from '../lib/checkout.ts';
import {donationQuery,donationSelectionKey} from '../lib/donation-selection.ts';

const other={_id:'000000000000000000000001',title:'Other',slug:'other',category:'general',categoryId:'34182ed239cb95df622288cc',amountTypeUi:'custom',suggestedAmounts:[],status:'active'};
const catalog={giving:[other],events:[]};
const selected={categorySlug:'general',givingSlug:'other',givingId:other._id,givingCategoryId:other.categoryId,amountCents:2500,amountChoice:'custom',currency:'USD',donationType:'one-time',donationPurpose:'Temple library'};

test('Other retains purpose when returning through checkout URL without exposing it in the URL',()=>{
 const saved=new Map([[donationSelectionKey,JSON.stringify(selected)]]);
 globalThis.sessionStorage={getItem:key=>saved.get(key)??null};
 const query=donationQuery(selected);
 assert.equal(query.includes('Temple library'),false);
 assert.equal(readDonationSelection(new URLSearchParams(query),catalog)?.donationPurpose,'Temple library');
 assert.equal(readDonationSelection(new URLSearchParams(query.replace('amount=2500','amount=2600')),catalog)?.donationPurpose,undefined);
 delete globalThis.sessionStorage;
});
