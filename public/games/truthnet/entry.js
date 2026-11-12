import { createDeckRun, loadDeck } from './core.js';

const path = location.pathname.replace(/\/$/, '');
const error = document.getElementById('game-error');

if (path === '/apps/assumezero/ukraine') {
  document.documentElement.lang = 'uk';
  document.title = 'Перевірмо разом · AssumeZero';
  document.body.dataset.edition = 'ukraine';
  // Promise chain, not top-level await: TLA raises the parse floor to Safari 15
  // and a parse failure here would break the UK game too, not just this branch.
  import('./ukraine.js')
    .then(({ mount }) => mount(document.getElementById('game')))
    .catch(cause => {
      console.error(cause);
      error.textContent = 'Не вдалося відкрити гру. Оновіть сторінку, щоб спробувати ще раз.';
      error.hidden = false;
    });
} else if (['/games/truthnet', '/games/truthnet/index.html'].includes(path)) {
  document.getElementById('game').append(document.getElementById('uk-game').content.cloneNode(true));
  window.TruthNet = { createDeckRun, loadDeck };
  const play = document.querySelector('.start .play');
  play.disabled = true;
  const script = document.createElement('script');
  script.src = '/games/truthnet/uk-feed.js';
  script.onload = () => { play.disabled = false; };
  script.onerror = () => {
    document.querySelector('.start p').textContent = 'Could not load the game. Refresh to try again.';
  };
  document.head.append(script);
} else {
  error.textContent = 'This TruthNet edition is unavailable.';
  error.hidden = false;
}
