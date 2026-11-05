/**
 * Demo data for presentations: one family per situation the system handles.
 *
 *   npm run seed
 *
 * All demo accounts share one password, read from DEMO_PASSWORD (server/.env
 * locally, an environment variable on Vercel). It is never stored in the code.
 * If it is missing, a random password is generated and printed once.
 *
 * Scenarios
 *   1. Ramesh Kumar  — ACTIVE: healthy, complete plan. Priya accepted, Arjun invited.
 *   2. Sunita Iyer   — REMINDED: check-in due in 2 days, reminder email sent.
 *   3. Mohan Das     — GRACE: missed his check-in; release in 4 days.
 *   4. Meera Nair    — GRACE: her daughter reported she may have passed away.
 *   5. Gopal Rao     — RELEASED: passed away; son and daughter each see only their items.
 *   6. Harish Menon  — Ready for a LIVE DEMO (seconds-based countdown).
 *
 * Re-running replaces only these demo accounts.
 */
import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { prisma } from '../src/db.js';
import { encryptJson, encryptText } from '../src/lib/crypto.js';
import { sealFile } from '../src/lib/storage.js';
import { createToken } from '../src/lib/tokens.js';
import { appLink } from '../src/lib/mailer.js';

const DAY = 24 * 60 * 60 * 1000;
const ago = (days) => new Date(Date.now() - days * DAY);
const ahead = (days) => new Date(Date.now() + days * DAY);

let PASSWORD = process.env.DEMO_PASSWORD;
let generated = false;
if (!PASSWORD || PASSWORD.length < 8) {
  PASSWORD = `Demo-${crypto.randomInt(1000, 9999)}-${crypto.randomBytes(3).toString('hex')}`;
  generated = true;
}

const EMAILS = [
  'ramesh', 'priya', 'arjun',
  'sunita', 'karthik',
  'mohan', 'lakshmi', 'vikram',
  'meera', 'anjali',
  'gopal', 'deepa', 'ravi',
  'harish', 'kavya',
].map((n) => `${n}@example.com`);

let hash;

async function person(name, email, extra = {}) {
  return prisma.user.create({ data: { name, email, passwordHash: hash, ...extra } });
}

async function nominee(owner, { name, email, relationship, status = 'ACCEPTED', user = null }) {
  return prisma.nominee.create({
    data: {
      ownerId: owner.id,
      userId: user?.id ?? null,
      name,
      email,
      relationship,
      status,
      acceptedAt: status === 'ACCEPTED' ? ago(60) : null,
    },
  });
}

async function asset(owner, { secret, to = [], ...data }) {
  return prisma.asset.create({
    data: {
      ...data,
      ownerId: owner.id,
      secretEnc: secret ? encryptJson(owner.id, secret) : null,
      shares: { create: to.map((n) => ({ nomineeId: n.id })) },
    },
  });
}

function pdf(text) {
  const body = `BT /F1 14 Tf 30 120 Td (${text.replace(/[()\\]/g, '')}) Tj ET`;
  return Buffer.from(
    '%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n' +
      '3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 460 200]/Contents 4 0 R/Resources<</Font<</F1 5 0 R>>>>>>endobj\n' +
      `4 0 obj<</Length ${body.length}>>stream\n${body}\nendstream endobj\n` +
      '5 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF',
  );
}

async function document(owner, { title, category, file, text, to = [] }) {
  const data = pdf(text);
  return prisma.document.create({
    data: {
      ownerId: owner.id,
      title,
      category,
      originalName: file,
      mimeType: 'application/pdf',
      size: data.length,
      data: sealFile(owner.id, data),
      shares: { create: to.map((n) => ({ nomineeId: n.id })) },
    },
  });
}

const letter = (owner, to, subject, body) =>
  prisma.letter.create({ data: { ownerId: owner.id, nomineeId: to.id, subject, bodyEnc: encryptText(owner.id, body) } });

const history = (user, entries) =>
  prisma.auditLog.createMany({
    data: entries.map(([daysAgo, action, detail]) => ({ userId: user.id, action, detail, createdAt: ago(daysAgo) })),
  });

const mail = (to, subject, text, link = null, daysAgo = 0) =>
  prisma.emailLog.create({ data: { to, subject, text: link ? `${text}\n\nOpen: ${link}` : text, link, createdAt: ago(daysAgo) } });

async function main() {
  await prisma.user.deleteMany({ where: { email: { in: EMAILS } } });
  await prisma.emailLog.deleteMany({ where: { to: { in: EMAILS } } });
  hash = await bcrypt.hash(PASSWORD, 12);

  // Nominee accounts (people who receive things)
  const priya = await person('Priya Kumar', 'priya@example.com');
  const karthik = await person('Karthik Iyer', 'karthik@example.com');
  const lakshmi = await person('Lakshmi Das', 'lakshmi@example.com');
  const vikram = await person('Vikram Rao', 'vikram@example.com');
  const anjali = await person('Anjali Nair', 'anjali@example.com');
  const deepa = await person('Deepa Rao', 'deepa@example.com');
  const kavya = await person('Kavya Menon', 'kavya@example.com');

  // ---------------------------------------------------------------- 1. ACTIVE
  const ramesh = await person('Ramesh Kumar', 'ramesh@example.com', { phone: '+91 98765 43210', lastCheckInAt: ago(3) });
  const rPriya = await nominee(ramesh, { name: 'Priya Kumar', email: 'priya@example.com', relationship: 'Daughter', user: priya });
  const rArjun = await nominee(ramesh, { name: 'Arjun Kumar', email: 'arjun@example.com', relationship: 'Son', status: 'INVITED' });
  await asset(ramesh, {
    category: 'BANK', title: 'SBI Savings Account', institution: 'State Bank of India, Lajpat Nagar', identifierHint: 'ending 4321',
    instructions: 'Close the account and divide the money equally between Priya and Arjun.',
    secret: { username: 'ramesh.k1953', password: 'Sbi@Net2024', notes: 'Locker no. 112 at the same branch. Key is in the steel almirah.' },
    to: [rPriya, rArjun],
  });
  await asset(ramesh, {
    category: 'EMAIL', title: 'Gmail account', institution: 'Google', identifierHint: 'ramesh.k1953@gmail.com',
    instructions: 'Download the family photos from Google Photos, then close the account.',
    secret: { username: 'ramesh.k1953@gmail.com', password: 'Family#Photos53' }, to: [rPriya],
  });
  await asset(ramesh, {
    category: 'INSURANCE', title: 'LIC Jeevan Anand Policy', institution: 'Life Insurance Corporation of India', identifierHint: 'policy ending 7788',
    instructions: 'Priya is the nominee on the policy. Claim at the Saket LIC office with the death certificate.',
    secret: { notes: 'Agent: Mr. Sharma, 98100 11223' }, to: [rPriya],
  });
  await asset(ramesh, {
    category: 'PROPERTY', title: 'House — 12, Green Park', institution: 'Delhi Development Authority',
    instructions: 'The house goes to Arjun as per my registered will. Original papers are in the bank locker.', to: [rArjun],
  });
  await asset(ramesh, { category: 'SOCIAL', title: 'Facebook', institution: 'Meta', instructions: 'Please memorialise my profile.', secret: { username: 'ramesh.kumar.53' } });
  await document(ramesh, { title: 'My registered will (copy)', category: 'WILL', file: 'will-ramesh-kumar.pdf', text: 'Will of Ramesh Kumar - demo copy', to: [rPriya, rArjun] });
  await letter(ramesh, rPriya, 'For my dear Priya',
    'My dear Priya,\n\nIf you are reading this, I want you to know how proud I am of you. Please look after your mother and keep the family together.\n\nAll the important papers are listed here so you do not have to worry.\n\nWith all my love,\nPapa');
  await history(ramesh, [[90, 'ACCOUNT_CREATED', 'Your secure vault was created.'], [60, 'NOMINEE_ACCEPTED', 'Priya Kumar accepted your invitation.'], [3, 'CHECK_IN', 'You confirmed you are well (logged in).']]);
  await history(priya, [[60, 'BECAME_NOMINEE', "You accepted Ramesh Kumar's invitation."]]);

  // -------------------------------------------------------------- 2. REMINDED
  const sunita = await person('Sunita Iyer', 'sunita@example.com', { lastCheckInAt: ago(28), legacyStatus: 'REMINDED', statusChangedAt: ago(1) });
  const sKarthik = await nominee(sunita, { name: 'Karthik Iyer', email: 'karthik@example.com', relationship: 'Son', user: karthik });
  await asset(sunita, {
    category: 'INVESTMENT', title: 'HDFC Mutual Fund (SIP)', institution: 'HDFC AMC', identifierHint: 'folio ending 5521',
    instructions: 'Transfer the units to Karthik. Statements come to my Gmail.', secret: { username: 'sunita.iyer', password: 'Hdfc#2023' }, to: [sKarthik],
  });
  await asset(sunita, {
    category: 'DEVICE', title: 'My mobile phone', instructions: 'The phone has all my contacts. Please inform my friends from the kirtan group.',
    secret: { password: '2468', notes: 'Screen lock PIN' }, to: [sKarthik],
  });
  const sToken = await createToken({ type: 'CHECK_IN', userId: sunita.id, ttlMinutes: 14 * 24 * 60 });
  await mail('sunita@example.com', 'Friendly reminder: please check in',
    'Hello Sunita Iyer, how are you?\n\nIt is almost time for your regular check-in (due in 2 days).\n\nPlease press the button below to tell us you are well.',
    appLink(`/check-in/${sToken}`), 1);
  await history(sunita, [[120, 'ACCOUNT_CREATED', 'Your secure vault was created.'], [28, 'CHECK_IN', 'You confirmed you are well (logged in).'], [1, 'REMINDER_SENT', 'A check-in reminder was emailed to you.']]);

  // ------------------------------------------------- 3. GRACE (missed check-in)
  const mohan = await person('Mohan Das', 'mohan@example.com', {
    lastCheckInAt: ago(33), legacyStatus: 'GRACE', statusChangedAt: ago(3), graceEndsAt: ahead(4),
    statusReason: `You have not checked in since ${ago(33).toDateString()}.`,
  });
  const mLakshmi = await nominee(mohan, { name: 'Lakshmi Das', email: 'lakshmi@example.com', relationship: 'Wife', user: lakshmi });
  const mVikram = await nominee(mohan, { name: 'Vikram Rao', email: 'vikram@example.com', relationship: 'Nephew', user: vikram });
  await asset(mohan, {
    category: 'BANK', title: 'Indian Bank Pension Account', institution: 'Indian Bank, Mylapore', identifierHint: 'ending 0912',
    instructions: 'Lakshmi should apply for family pension with my PPO number.', secret: { notes: 'PPO number: 123456789' }, to: [mLakshmi],
  });
  await asset(mohan, { category: 'DEVICE', title: 'Laptop', instructions: 'Vikram can keep the laptop. Please wipe it first.', secret: { password: 'Mohan@1950' }, to: [mVikram] });
  for (const [to, name] of [['lakshmi@example.com', 'Lakshmi Das'], ['vikram@example.com', 'Vikram Rao']]) {
    await mail(to, 'We are trying to reach Mohan Das', `Dear ${name},\n\nWe have not been able to reach Mohan Das recently. If you can, please check on them.`, null, 3);
  }
  await history(mohan, [[200, 'ACCOUNT_CREATED', 'Your secure vault was created.'], [33, 'CHECK_IN', 'You confirmed you are well (logged in).'], [6, 'REMINDER_SENT', 'A check-in reminder was emailed to you.'], [3, 'GRACE_STARTED', 'You missed your check-in. Release scheduled in 7 days unless you check in.']]);

  // ------------------------------------------------ 4. GRACE (reported by nominee)
  const meera = await person('Meera Nair', 'meera@example.com', {
    lastCheckInAt: ago(10), legacyStatus: 'GRACE', statusChangedAt: ago(1), graceEndsAt: ahead(6),
    statusReason: 'Anjali Nair (Daughter) told us they believe you may have passed away or are unwell. Their note: "Amma was admitted to hospital last night."',
  });
  const mAnjali = await nominee(meera, { name: 'Anjali Nair', email: 'anjali@example.com', relationship: 'Daughter', user: anjali });
  await asset(meera, {
    category: 'INSURANCE', title: 'Star Health Insurance', institution: 'Star Health', identifierHint: 'policy ending 3310',
    instructions: 'Use this for my hospital bills. The card is in my handbag.', secret: { username: 'meera.nair', password: 'Star@Health1' }, to: [mAnjali],
  });
  await document(meera, { title: 'Medical records', category: 'MEDICAL', file: 'meera-medical.pdf', text: 'Medical summary - Meera Nair (demo)', to: [mAnjali] });
  await mail('meera@example.com', 'Urgent: please confirm you are well', 'Anjali Nair told us they believe you may be unwell. Please log in if you are well.', null, 1);
  await history(meera, [[150, 'ACCOUNT_CREATED', 'Your secure vault was created.'], [1, 'GRACE_STARTED', 'Anjali Nair reported a concern. Release in 7 days unless you check in.']]);
  await history(anjali, [[1, 'REPORTED_OWNER', 'You reported that Meera Nair may have passed away.']]);

  // --------------------------------------------------- 5. RELEASED (passed away)
  const gopal = await person('Gopal Rao', 'gopal@example.com', { lastCheckInAt: ago(75), legacyStatus: 'RELEASED', statusChangedAt: ago(5) });
  const gVikram = await nominee(gopal, { name: 'Vikram Rao', email: 'vikram@example.com', relationship: 'Son', user: vikram });
  const gDeepa = await nominee(gopal, { name: 'Deepa Rao', email: 'deepa@example.com', relationship: 'Daughter', user: deepa });
  await nominee(gopal, { name: 'Ravi Menon', email: 'ravi@example.com', relationship: 'Friend', status: 'DECLINED' });
  await asset(gopal, {
    category: 'BANK', title: 'Canara Bank Savings', institution: 'Canara Bank, T. Nagar', identifierHint: 'ending 7730',
    instructions: 'Vikram: close this account and use the money for your mother’s care.',
    secret: { username: 'gopal.rao', password: 'Canara#1948', notes: 'Fixed deposit receipts are in the blue file.' }, to: [gVikram],
  });
  await asset(gopal, {
    category: 'PROPERTY', title: 'Flat — Anna Nagar', institution: 'CMDA', instructions: 'The flat goes to Vikram as written in my will.', to: [gVikram],
  });
  await asset(gopal, {
    category: 'INSURANCE', title: 'LIC Policy', institution: 'LIC of India', identifierHint: 'policy ending 4401',
    instructions: 'Deepa: you are the nominee. Claim at the Teynampet branch.', secret: { notes: 'Agent: Mrs. Revathi, 94440 12345' }, to: [gDeepa],
  });
  await asset(gopal, {
    category: 'OTHER', title: 'Gold jewellery', instructions: 'Your mother’s jewellery in the bank locker goes to Deepa.', secret: { notes: 'Locker 58, key with Deepa’s aunt.' }, to: [gDeepa],
  });
  await asset(gopal, { category: 'EMAIL', title: 'Yahoo Mail', institution: 'Yahoo', instructions: 'Please close it.', secret: { username: 'gopal.rao48@yahoo.com', password: 'Yahoo@48' }, to: [gVikram, gDeepa] });
  await document(gopal, { title: 'Registered will', category: 'WILL', file: 'will-gopal-rao.pdf', text: 'Will of Gopal Rao - demo copy', to: [gVikram, gDeepa] });
  await document(gopal, { title: 'Flat sale deed', category: 'PROPERTY', file: 'anna-nagar-deed.pdf', text: 'Sale deed - Anna Nagar flat (demo)', to: [gVikram] });
  await letter(gopal, gVikram, 'For Vikram', 'Vikram,\n\nYou are the man of the house now. Take care of your mother and your sister. Do not fight over property — family comes first.\n\nAppa');
  await letter(gopal, gDeepa, 'For my little Deepa', 'Deepa kanna,\n\nYou were always the light of this house. Keep singing. Your mother’s jewellery is yours — wear it at your wedding.\n\nWith love,\nAppa');
  for (const [to, name] of [['vikram@example.com', 'Vikram Rao'], ['deepa@example.com', 'Deepa Rao']]) {
    await mail(to, 'Gopal Rao has left items for you', `Dear ${name},\n\nAs they wished, the items and messages Gopal Rao chose for you are now available.`, appLink('/app/shared'), 5);
  }
  await history(gopal, [[300, 'ACCOUNT_CREATED', 'Your secure vault was created.'], [75, 'CHECK_IN', 'You confirmed you are well (logged in).'], [12, 'GRACE_STARTED', 'You missed your check-in.'], [5, 'VAULT_RELEASED', 'Your vault was released to your accepted nominees.'], [4, 'NOMINEE_VIEWED', 'Vikram Rao opened the items you left for them.']]);
  await history(vikram, [[200, 'BECAME_NOMINEE', "You accepted Gopal Rao's invitation."], [4, 'SHARED_SECRET_VIEWED', 'You viewed "Canara Bank Savings" left by Gopal Rao.']]);

  // ------------------------------------------------------ 6. LIVE DEMO account
  const harish = await person('Harish Menon', 'harish@example.com', { lastCheckInAt: ago(1) });
  const hKavya = await nominee(harish, { name: 'Kavya Menon', email: 'kavya@example.com', relationship: 'Daughter', user: kavya });
  await asset(harish, {
    category: 'BANK', title: 'ICICI Savings Account', institution: 'ICICI Bank, Adyar', identifierHint: 'ending 6601',
    instructions: 'Kavya: transfer the balance to your account and close this one.',
    secret: { username: 'harish.menon', password: 'Icici@Live30', notes: 'Debit card is in the top drawer.' }, to: [hKavya],
  });
  await asset(harish, { category: 'EMAIL', title: 'Gmail account', institution: 'Google', instructions: 'Save the family photos, then close it.', secret: { username: 'harish.menon@gmail.com', password: 'Photos#Kavya' }, to: [hKavya] });
  await document(harish, { title: 'Will (copy)', category: 'WILL', file: 'will-harish-menon.pdf', text: 'Will of Harish Menon - demo copy', to: [hKavya] });
  await letter(harish, hKavya, 'To Kavya', 'Kavya,\n\nIf you are reading this, the system did exactly what I asked it to do. Everything you need is here. Be brave, and be kind to your mother.\n\nAcha');
  await history(harish, [[30, 'ACCOUNT_CREATED', 'Your secure vault was created.'], [1, 'CHECK_IN', 'You confirmed you are well (logged in).']]);

  console.log('✔ Demo data ready: 6 scenarios, 15 accounts (see seed.js header).');
  if (generated) {
    console.log(`  No DEMO_PASSWORD set — generated one for this run: ${PASSWORD}`);
    console.log('  Set DEMO_PASSWORD in server/.env to keep the same password every time.');
  } else {
    console.log('  Password for all demo accounts: the value of DEMO_PASSWORD.');
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
