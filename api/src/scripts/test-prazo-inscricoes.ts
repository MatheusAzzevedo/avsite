/**
 * Explicação do Arquivo [test-prazo-inscricoes.ts]
 *
 * Confere a regra do prazo de inscrições. Rodar: npm run test:prazo
 */

import assert from 'node:assert/strict';
import { inscricoesEncerradas } from '../utils/prazo-inscricoes';

const fim = new Date('2026-02-10T12:00:00.000Z');

assert.equal(inscricoesEncerradas(null), false, 'sem data nunca encerra');
assert.equal(inscricoesEncerradas(fim, new Date('2026-02-10T02:00:00.000Z')), false, '09/02 23:00 em Brasília ainda aberto');
assert.equal(inscricoesEncerradas(fim, new Date('2026-02-11T02:59:00.000Z')), false, '10/02 23:59 em Brasília ainda aberto');
assert.equal(inscricoesEncerradas(fim, new Date('2026-02-11T03:00:00.000Z')), true, '11/02 00:00 em Brasília encerrado');

console.log('prazo-inscricoes: ok');
