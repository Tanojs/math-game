import { HELP_BTN } from '../../app/howto.js';
import { $, hit } from '../../core/dom.js';
import { LEVELS, type Level } from '../../core/html.js';
import type { Cleanup, Mount } from '../../core/types.js';
import { best } from '../../app/records.js';
import { makeQuestion, pointsFor, type Choice, type MathId, type Question } from './logic.js';

let lastLevel: Level = 1;

export const mountMath: Mount = (id, el, info) => {
  const gid = id as MathId;
  let off: Cleanup | null = null;

  const menu = (): void => {
    off?.();
    off = null;
    info('');
    el.innerHTML =
      '<div class=modes>' + LEVELS.map((n, i) => `<button class="b mode" data-m=${i}>${n}</button>`).join('') + '</div><div class=arow>' + HELP_BTN + '</div>';
    el.onclick = (e) => {
      const b = hit(e, '[data-m]');
      if (b) {
        lastLevel = Number(b.dataset.m) as Level;
        off = run(lastLevel);
      }
    };
  };

  const run = (d: Level): Cleanup => {
    let t = 60, s = 0, streak = 0, ok = 0, n = 0, buf = '';
    let q: Question | null = null;
    let iv = 0, ft = 0, last = 0;
    let over = false, lock = false;

    el.innerHTML =
      '<div class="tm"><i id=mb></i></div><div id=mq class=box></div><div id=ma class=ans></div>' +
      '<div id=mt class=hide><div id=md class=disp></div><div id=mp class=pad></div></div><div class=arow>' + HELP_BTN + '</div>';
    $('#mp').innerHTML = [1, 2, 3, 4, 5, 6, 7, 8, 9, '⌫', 0, '✓'].map((x) => `<button class=b data-k="${x}">${x}</button>`).join('');

    const draw = (): void => {
      $('#mb').style.width = Math.max(0, (t / 60) * 100) + '%';
      info(`Skor ${s}${streak > 1 ? ' · ×' + streak : ''} · ${LEVELS[d]}`);
    };

    const next = (): void => {
      const cur = (q = makeQuestion(gid, d));
      buf = '';
      const m = $('#mq');
      m.className = 'box';
      m.textContent = cur.q;
      const typed = cur.answer !== undefined;
      $('#mt').classList.toggle('hide', !typed);
      $('#ma').classList.toggle('hide', typed);
      if (typed) $('#md').textContent = '';
      else {
        const ch = cur.choices as Choice[];
        $('#ma').className = 'ans' + (ch.length === 3 ? ' t3' : '');
        $('#ma').innerHTML = ch.map((o, i) => `<button class=b data-i=${i}>${o.l}</button>`).join('');
      }
    };

    const end = (): void => {
      over = true;
      clearInterval(iv);
      clearTimeout(ft);
      const bs = best(id + d, s);
      el.innerHTML = `<div class=res><p>Waktu habis</p><h1>${s}</h1><p>${ok}/${n} benar · terbaik ${bs}</p><button class=cta id=re>Main lagi</button><button class="cta alt" id=lv>Ganti level</button><div class=arow>${HELP_BTN}</div></div>`;
    };

    const answer = (correct: boolean): void => {
      if (lock || over) return;
      n++;
      const m = $('#mq');
      if (correct) {
        ok++;
        streak++;
        s += pointsFor(streak);
        m.className = 'box ok';
      } else {
        streak = 0;
        t -= 3;
        m.className = 'box bad';
      }
      draw();
      if (t <= 0) return end();
      lock = true;
      ft = window.setTimeout(() => {
        lock = false;
        if (over) return;
        if (correct) next();
        else {
          // Salah: soal tetap sama, kotak kembali kuning
          m.className = 'box';
          buf = '';
          if (q?.answer !== undefined) $('#md').textContent = '';
        }
      }, correct ? 160 : 420);
    };

    const key = (x: string): void => {
      if (lock || over || !q || q.answer === undefined) return;
      const goal = q.answer;
      if (x === '⌫') buf = buf.slice(0, -1);
      else if (x === '✓') {
        if (!buf) return;
        $('#md').textContent = buf;
        return answer(+buf === goal);
      } else if (buf.length < 5) {
        buf += x;
        $('#md').textContent = buf;
        if (buf.length >= String(goal).length) return answer(+buf === goal);
      }
      $('#md').textContent = buf;
    };

    el.onclick = (e) => {
      const b = hit(e, 'button');
      if (!b) return;
      if (b.id === 're') {
        off?.();
        off = run(d);
        return;
      }
      if (b.id === 'lv') return menu();
    };
    // Jawaban & keypad diproses saat jari menyentuh (pointerdown) supaya ketukan cepat/tumpang tindih tidak hilang.
    el.onpointerdown = (e) => {
      if (e.button !== 0) return;
      const b = hit(e, 'button');
      if (!b || !q || over || lock) return;
      if (b.dataset.i !== undefined) answer(((q.choices as Choice[])[+b.dataset.i] as Choice).ok);
      else if (b.dataset.k !== undefined) key(b.dataset.k);
    };

    const onKey = (e: KeyboardEvent): void => {
      if (!q || over || lock) return;
      if (q.answer !== undefined) {
        if (/^\d$/.test(e.key)) key(e.key);
        else if (e.key === 'Backspace') key('⌫');
        else if (e.key === 'Enter') key('✓');
      } else if (/^[1-4]$/.test(e.key)) {
        const c = (q.choices as Choice[])[+e.key - 1];
        if (c) answer(c.ok);
      }
    };
    addEventListener('keydown', onKey);

    next();
    draw();
    last = performance.now();
    iv = window.setInterval(() => {
      const now = performance.now();
      t -= (now - last) / 1000;
      last = now;
      if (t <= 0) end();
      else draw();
    }, 100);

    return () => {
      clearInterval(iv);
      clearTimeout(ft);
      removeEventListener('keydown', onKey);
    };
  };

  menu();
  return () => off?.();
};
