// lancé par le test « local » de NeoDex : César, cassage de Vigenère, aller-retour AES et empreinte SHA-256
module.exports = async ({ pj, sleep }) => {
  const type = (id, v) => pj(`(() => { const f = document.getElementById(${JSON.stringify(id)}); f.value = ${JSON.stringify(v)}; f.dispatchEvent(new Event('input')); })(), 0`);
  const pick = m => pj(`document.querySelector('[data-m=${m}]').click(), 0`), dir = d => pj(`document.querySelector('[data-dir="${d}"]').click(), 0`);
  const out = () => pj(`document.getElementById('ci_out').textContent`);
  await sleep(500); await pick('caesar'); await dir(1); await sleep(200);
  await pj(`(() => { const f = document.querySelector('.ciRow input[type=number]'); f.value = 3; f.dispatchEvent(new Event('input')); })(), 0`);
  await type('ci_in', 'Bonjour'); await sleep(200);
  if (await out() !== 'Erqmrxu') throw new Error('César 3 : ' + await out());
  const long = "Il était une fois, dans un petit village au bord de la mer, une jeune fille qui aimait regarder les bateaux rentrer au port chaque soir. Son père était pêcheur et partait avant l'aube pour revenir quand le soleil se couchait derrière les falaises.";
  await pick('vigenere'); await dir(1); await sleep(200); await type('ci_key', 'PHARE'); await type('ci_in', long); await sleep(200);
  const secret = await out(); await dir(-1); await sleep(200); await type('ci_in', secret); await pj(`document.getElementById('ci_crack').click(), 0`); await sleep(400);
  const key = await pj(`document.getElementById('ci_key').value`);
  if (key !== 'PHARE') throw new Error('Vigenère cassé avec la clé ' + key);
  await pick('aes'); await dir(1); await sleep(200); await type('ci_pass', 'test-neodex'); await type('ci_in', 'message secret'); await sleep(1500);
  const enc = await out(); await dir(-1); await sleep(200); await type('ci_pass', 'test-neodex'); await type('ci_in', enc); await sleep(1500);
  if (await out() !== 'message secret') throw new Error('AES aller-retour : ' + await out());
  await pick('sha'); await sleep(200); await type('ci_in', 'abc'); await sleep(400);
  if (await out() !== 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad') throw new Error('SHA-256 de abc : ' + await out());
  await pick('vigenere'); await dir(1); await sleep(200); await type('ci_key', 'PHARE'); await type('ci_in', long); await sleep(300); await pj(`document.getElementById('ci_out').scrollIntoView({block: 'center'}), 0`); await sleep(300);
  return 'César, cassage de Vigenère, AES et SHA-256 ok';
};
