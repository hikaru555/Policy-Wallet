
import React from 'react';

const otherCompanies = [
  'AIA Thailand',
  'Allianz Ayudhya Life',
  'Bangkok Life Assurance',
  'Chubb Life Assurance',
  'Dhipaya Life Assurance',
  'Generali Life Assurance',
  'Krungthai-AXA Life',
  'Manulife Thailand',
  'MBK Life',
  'Muang Thai Life Assurance',
  'Ocean Life Insurance',
  'Phillip Life Assurance',
  'Prudential Thailand',
  'Samsung Life Insurance',
  'SE Life (Southeast Life)',
  'Thai Life Insurance',
  'Tokio Marine Life'
].sort();

export const INSURANCE_COMPANIES = [
  'FWD Life Insurance',
  ...otherCompanies
];

export const COMPANY_LOGOS: Record<string, string> = {
  'AIA Thailand': 'https://picsum.photos/seed/aia/40/40',
  'FWD Life Insurance': 'https://picsum.photos/seed/fwd/40/40',
  'Allianz Ayudhya Life': 'https://picsum.photos/seed/allianz/40/40',
  'Muang Thai Life Assurance': 'https://picsum.photos/seed/mtl/40/40',
  'Krungthai-AXA Life': 'https://picsum.photos/seed/axa/40/40',
  'Thai Life Insurance': 'https://picsum.photos/seed/thailife/40/40',
  'Bangkok Life Assurance': 'https://picsum.photos/seed/bla/40/40',
};

export const EMERGENCY_CONTACTS = [
  { name: 'FWD Customer Service', phone: '1351' },
  { name: 'AIA Call Center', phone: '1581' },
  { name: 'Muang Thai Life', phone: '1766' },
  { name: 'Allianz Ayudhya Life', phone: '1292' },
  { name: 'Krungthai-AXA Life', phone: '1159' },
  { name: 'Thai Life Insurance', phone: '1124' },
  { name: 'Bangkok Life Assurance', phone: '02-777-8888' },
  { name: 'Ocean Life Insurance', phone: '02-207-8888' },
  { name: 'Prudential Thailand', phone: '1621' },
  { name: 'Emergency Services', phone: '191' },
  { name: 'Tourist Police', phone: '1155' }
];
