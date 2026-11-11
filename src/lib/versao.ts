/* Gera um "carimbo" para cada arquivo de /assets. Quando o arquivo muda, o carimbo muda
   e o celular do visitante baixa a versão nova na hora, sem ficar preso no cache. */
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
const cache: Record<string, string> = {};
export function asset(nome: string): string {
  if (!cache[nome]) {
    try { cache[nome] = createHash('sha1').update(readFileSync(join(process.cwd(), 'public', 'assets', nome))).digest('hex').slice(0, 10); }
    catch { cache[nome] = String(Date.now()); }
  }
  return `/assets/${nome}?v=${cache[nome]}`;
}
