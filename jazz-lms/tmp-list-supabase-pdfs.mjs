import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
const env = fs.existsSync('.env.local') ? fs.readFileSync('.env.local','utf8') : '';
for (const line of env.split(/\r?\n/)) {
  const parts = line.split('=');
  const k = parts[0];
  const v = parts[1];
  if (!k || !v) continue;
  if (!process.env[k.trim()]) process.env[k.trim()] = v.trim().replace(/^['\"]|['\"]$/g,'');
}
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const bucket = process.env.SUPABASE_STORAGE_BUCKET;
if (!bucket) throw new Error('no bucket');
let page = 0;
const all = [];
while (true) {
  const { data, error } = await supabase.storage.from(bucket).list('', { limit: 1000, offset: page*1000, sortBy: {column: 'name', order: 'asc'}});
  if (error) { console.error(error); process.exit(1); }
  if (!data || data.length === 0) break;
  all.push(...data.map(x => x.name));
  if (data.length < 1000) break;
  page++;
}
const patterns = [
  'Lecon 1_', 'Lecon 7_', 'Lecon 9_', 'Lecon 12_', 'Notes auxiliaires 1', 'Notes auxiliaires 2'
];
for (const p of patterns) {
  console.log('===', p, '===');
  for (const name of all) if (name.includes(p)) console.log(name);
}
console.log('count', all.length);
