import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import pg from 'pg';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { PNG } from 'pngjs';
import { hashPassword } from '../src/utils/argon2id.js';
import { callFn } from '../src/db/call.js';
import { runtimePool, authPool } from '../src/db/pool.js';
import { env } from '../src/config/env.js';

if (process.env.DEMO_BOOTSTRAP !== '1' || env.PGDATABASE !== 'bsc_demo_v1') {
  throw new Error('Gunakan python3 scripts/demo.py setup/reset pada cluster demo khusus.');
}
const local = path.resolve('../.local/demo');
const dba = new pg.Pool(); // PG* supplied only to this development process, never the server.

try {
  await fs.mkdir(path.join(local, 'fixtures'), { recursive: true, mode: 0o700 });
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595, 842]);
  const font = await pdf.embedFont(StandardFonts.HelveticaBold);
  page.drawText('BSC ADMISSIONS - DEMO AKADEMIK', { x: 42, y: 760, size: 22, font, color: rgb(0.1, 0.2, 0.5) });
  page.drawText('DOKUMEN SINTETIS / BUKAN DOKUMEN SISWA ASLI', { x: 42, y: 700, size: 13, font });
  page.drawText('Contoh berkas untuk rekaman UTS Manajemen Proyek.', { x: 42, y: 660, size: 12 });
  const pdfBytes = Buffer.from(await pdf.save());
  await fs.writeFile(path.join(local, 'fixtures/dokumen-dummy.pdf'), pdfBytes, { mode: 0o600 });
  const image = new PNG({ width: 240, height: 320 });
  for (let y = 0; y < image.height; y++) for (let x = 0; x < image.width; x++) {
    const i = (y * image.width + x) * 4;
    const stripe = (x + y) % 48 < 24;
    image.data[i] = stripe ? 30 : 215; image.data[i + 1] = stripe ? 58 : 230;
    image.data[i + 2] = stripe ? 138 : 250; image.data[i + 3] = 255;
  }
  const pngBytes = PNG.sync.write(image);
  await fs.writeFile(path.join(local, 'fixtures/foto-dummy.png'), pngBytes, { mode: 0o600 });

  const accounts: { email: string; password: string; role: string }[] = [];
  const ids: Record<string, string> = {};
  for (const [name, role] of [['siswa', 'applicant'], ['panitia', 'committee'], ['admin', 'admin'],
    ['contoh-1', 'applicant'], ['contoh-2', 'applicant'], ['contoh-3', 'applicant']]) {
    const email = `${name}.demo@example.test`;
    const password = crypto.randomBytes(18).toString('base64url');
    const id = String(await callFn('register_account', [email, await hashPassword(password)]));
    if (role !== 'applicant') {
      await dba.query('UPDATE bsc.users SET role_code=$1 WHERE id=$2', [role, id]);
    }
    ids[name] = id;
    accounts.push({ email, password, role });
  }
  const year = new Date().getFullYear();
  const period = await callFn('create_period', [ids.admin, 'DEMO UTS — Data Sintetis', `${year}/${year + 1}`,
    new Date(Date.now() - 86400000), new Date(Date.now() + 30 * 86400000), true]);
  const catalog = await callFn('get_catalog') as any;
  for (const [i, name] of ['siswa', 'contoh-1', 'contoh-2', 'contoh-3'].entries()) {
    const actor = ids[name];
    await callFn('save_profile', [actor, `Siswa Sintetis ${i + 1}`, 'Kota Contoh', '2010-05-01',
      i % 2 ? 'P' : 'L', 'Alamat Sintetis untuk Demo UTS', '+6280000000000']);
    if (i === 0) continue; // Main student has no application: ready for recording.
    const app = String(await callFn('create_application', [actor, period, catalog.majors[i % 5].id]));
    for (const type of catalog.document_types.filter((t: any) => t.is_required)) {
      const photo = type.code === 'photo';
      const key = `applications/${app}/${crypto.randomUUID()}`;
      const dest = path.join(env.UPLOAD_DIR, key);
      await fs.mkdir(path.dirname(dest), { recursive: true, mode: 0o700 });
      const bytes = photo ? pngBytes : pdfBytes;
      await fs.writeFile(dest, bytes, { mode: 0o600 });
      await callFn('put_document', [actor, app, type.id, key, photo ? 'image/png' : 'application/pdf', bytes.length]);
    }
    await callFn('change_application_status', [actor, app, 'submitted', null]);
    if (i > 1) {
      await callFn('change_application_status', [ids.panitia, app, 'under_review', null]);
      if (i === 2) await callFn('change_application_status', [ids.panitia, app, 'correction_requested', 'DEMO: unggah berkas yang lebih jelas.']);
    }
  }
  await fs.writeFile(path.join(local, 'accounts.json'), JSON.stringify(accounts, null, 2) + '\n', { mode: 0o600 });
  console.log('6 akun sintetis, 1 periode, 3 pendaftaran, dan berkas dummy dibuat. Password tidak dicetak.');
} finally {
  await Promise.all([dba.end(), runtimePool.end(), authPool.end()]);
}
