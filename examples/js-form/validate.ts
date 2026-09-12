import { validate } from 'prohibited-word';

const input = document.querySelector('input#username');
const err = document.querySelector('p#error');
input?.addEventListener('input', (e) => {
  const v = (e.target as HTMLInputElement).value;
  const r = validate(v, { categories: ['sexual', 'sara', 'violence', 'kasar'] });
  (err as HTMLElement).textContent = r.isValid ? '' : `Kata tidak pantas: ${r.found.map((f) => f.word).join(', ')}`;
});
