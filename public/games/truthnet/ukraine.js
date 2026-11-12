import { createDeckRun, loadDeck } from './core.js';

const conclusions = {
  supported: 'Докази підтверджують',
  contradicted: 'Докази кажуть інше',
  unresolved: 'Поки не знаємо',
};
const postCount = new Intl.PluralRules('uk');
const postForms = { one: 'допис', few: 'дописи', many: 'дописів', other: 'допису' };
const cardSymbols = {
  snow: '❄️', chess: '♟️', cat: '🐈', museum: '🏛️', poster: '🎨', seed: '🌱',
  score: '⚽', craft: '✂️', bird: '🐦', advert: '✏️', books: '📚', drawing: '🖍️',
  puzzle: '🧩', music: '🥁', frog: '🐸', board: '🎲',
};
const choiceSymbols = { supported: '✓', contradicted: '≠', unresolved: '?' };
const sessionSymbols = { first: '🔎', second: '🧩', more: '✨' };

const html = value => String(value).replace(/[&<>"']/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[char]);

function validateDeck(deck) {
  if (deck.editionId !== 'ukraine' || deck.locale !== 'uk-UA' || deck.schemaVersion !== 1 || deck.engineCompatibility !== 1) {
    throw new Error('Incompatible Ukrainian TruthNet deck');
  }

  const sessionIds = new Set();
  const cardIds = new Set();
  if (!Array.isArray(deck.sessions) || !deck.sessions.length) throw new Error('No Ukrainian sessions');
  for (const session of deck.sessions) {
    if (!session.id || sessionIds.has(session.id) || !session.title || !session.description ||
        !['practice', 'assessment'].includes(session.kind) || !session.cards?.length) {
      throw new Error(`Invalid session: ${session.id}`);
    }
    sessionIds.add(session.id);
    for (const card of session.cards) {
      if (!card.id || cardIds.has(card.id) || !card.claim || !card.author || !card.topic || !card.feedback ||
          !Object.hasOwn(conclusions, card.finalConclusion) || !card.evidence?.length || !Array.isArray(card.decisiveEvidenceIds)) {
        throw new Error(`Invalid card: ${card.id}`);
      }
      cardIds.add(card.id);
      if (card.imageAlt !== undefined && (session.kind !== 'practice' ||
          !/^[a-z0-9-]+$/.test(card.id) || typeof card.imageAlt !== 'string' || !card.imageAlt.trim())) {
        throw new Error(`Invalid illustration on card: ${card.id}`);
      }
      const evidenceIds = new Set();
      for (const evidence of card.evidence) {
        if (!evidence.id || evidenceIds.has(evidence.id) || !evidence.label || !evidence.excerpt || typeof evidence.relevant !== 'boolean') {
          throw new Error(`Invalid evidence on card: ${card.id}`);
        }
        evidenceIds.add(evidence.id);
      }
      if ((card.finalConclusion === 'unresolved') !== (card.decisiveEvidenceIds.length === 0) ||
          card.decisiveEvidenceIds.some(id => !card.evidence.some(item => item.id === id && item.relevant))) {
        throw new Error(`Invalid conclusion on card: ${card.id}`);
      }
    }
  }
  if (!deck.repair?.claim || !deck.repair.evidence || !deck.repair.feedback || !deck.repair.options?.[deck.repair.answer]) {
    throw new Error('Invalid repair activity');
  }
}

export async function mount(root) {
  const deck = await loadDeck('/games/truthnet/cards-uk-UA.json');
  validateDeck(deck);
  const sessions = new Map(deck.sessions.map(session => [session.id, session]));

  root.innerHTML = `
    <header class="ua-top"><div class="ua-wrap ua-topline">
      <a class="ua-brand" href="/apps/assumezero/ukraine"><span aria-hidden="true">◉</span> AssumeZero</a>
      <span class="ua-review">Чернетка для дорослих</span>
    </div></header>
    <main class="ua-wrap ua-main" id="ua-screen"></main>
    <dialog class="ua-dialog" id="ua-help" aria-labelledby="ua-help-title">
      <div class="ua-pause" aria-hidden="true">Ⅱ</div>
      <h2 id="ua-help-title">Можна зробити перерву</h2>
      <p>Можеш показати допис дорослому, якому довіряєш. Або повернися, пропусти допис чи заверши вправу.</p>
      <form method="dialog" class="ua-actions">
        <button class="ua-primary" autofocus>Повернутися</button>
        <button type="button" data-action="help-skip">Пропустити допис</button>
        <button type="button" data-action="help-stop" class="ua-quiet">Завершити</button>
      </form>
    </dialog>`;

  const screen = document.getElementById('ua-screen');
  const dialog = document.getElementById('ua-help');
  let session = null;
  let run = null;
  let mode = 'home';
  let viewed = new Set();
  let checkOpen = false;
  let choice = null;
  let firstChoice = null;
  let reason = null;
  let repaired = null;
  let responses = [];

  function button(label, action, value = '', className = '') {
    return `<button type="button" data-action="${action}" data-value="${html(value)}" class="${className}">${html(label)}</button>`;
  }

  function show(markup, focusSelector = 'h1') {
    screen.innerHTML = markup;
    if (focusSelector) screen.querySelector(focusSelector)?.focus();
  }

  function showHome(focus = true) {
    mode = 'home';
    session = null;
    run = null;
    responses = [];
    const sessionButton = item => `
      <button class="ua-session" type="button" data-action="start" data-value="${html(item.id)}">
        ${sessionSymbols[item.id] ? `<span class="ua-session-symbol" aria-hidden="true">${sessionSymbols[item.id]}</span>` : ''}
        <span><strong>${html(item.title)}</strong><small>${html(item.description)}</small></span>
        <span class="ua-session-end">${item.cards.length} ${postForms[postCount.select(item.cards.length)]} <span aria-hidden="true">→</span></span>
      </button>`;

    show(`
      <section class="ua-hero">
        <div class="ua-intro"><h1 tabindex="-1">Перевірмо <br>разом<span>.</span></h1>
          <p>Розглянь допис, знайди підказки й виріши, що вже відомо.</p>
          <p class="ua-subtle">Усі дописи вигадані для практики.</p>
        </div>
        <div class="ua-hero-note" aria-hidden="true">
          <div class="ua-paper ua-paper-back"></div>
          <div class="ua-paper ua-paper-front"><span class="ua-paper-label">Допис</span>
            <strong>«Це фото зробили сьогодні!»</strong>
            <span class="ua-paper-evidence"><span>↳</span> Де з’явилося фото вперше?</span>
          </div>
        </div>
      </section>
      <section class="ua-session-list" aria-labelledby="ua-session-heading">
        <h2 id="ua-session-heading">Обери вправу</h2>
        ${deck.sessions.filter(item => item.kind === 'practice').map(sessionButton).join('')}
      </section>
      <details class="ua-adults">
        <summary>Для дорослих · огляд форм</summary>
        <p>Форми містять різні приклади. Підсумок показує кількість відповідей і пропусків.</p>
        ${deck.sessions.filter(item => item.kind === 'assessment').map(sessionButton).join('')}
      </details>`, focus ? 'h1' : '');
  }

  function showCard(focusSelector = 'h1') {
    mode = 'card';
    const card = run.current;
    const assessment = session.kind === 'assessment';
    const symbol = cardSymbols[card.id];
    const visual = !assessment && (card.imageAlt
      ? `<img class="ua-card-image" src="/img/assumezero/ukraine/${html(card.id)}.webp" alt="${html(card.imageAlt)}" width="1200" height="640">`
      : symbol ? `<div class="ua-card-symbol" data-scene="${run.index % 3}" aria-hidden="true">${symbol}</div>` : '');
    const orderedEvidence = run.index % 2 === 0 ? card.evidence : [...card.evidence].reverse();
    const evidence = checkOpen ? `
      <section class="ua-check" aria-labelledby="ua-check-heading">
        <h2 id="ua-check-heading" tabindex="-1">Матеріали для перевірки</h2>
        <div class="ua-evidence">${orderedEvidence.map(item => `
          <article>${viewed.has(item.id)
            ? `<h3 tabindex="-1" data-source="${html(item.id)}">${html(item.label)}</h3><p>${html(item.excerpt)}</p>`
            : button(item.label, 'evidence', item.id)}
          </article>`).join('')}</div>
      </section>` : '';

    let response = '';
    if (!assessment && choice) {
      const decisive = card.decisiveEvidenceIds.length > 0 && card.decisiveEvidenceIds.every(id => viewed.has(id));
      const warranted = decisive ? card.finalConclusion : 'unresolved';
      const viewedRelevant = card.evidence.some(item => item.relevant && viewed.has(item.id));
      const message = decisive || (card.finalConclusion === 'unresolved' && viewedRelevant)
        ? card.feedback
        : 'Поки що матеріалів замало для певної відповіді. Можна перевірити ще одне джерело.';
      response = `<section class="ua-feedback" tabindex="-1" id="ua-feedback">
        <h2>${choice === warranted ? 'Це обґрунтована відповідь' : 'Погляньмо на докази ще раз'}</h2>
        <p>${html(message)}</p>
        ${firstChoice === 'unresolved' && choice !== firstChoice && choice === warranted && decisive
          ? '<p>Ти уточнив або уточнила відповідь після перевірки.</p>' : ''}
        ${viewed.size > 0 ? `<fieldset><legend>Яка підказка допомагає перевірити допис?</legend>
          ${orderedEvidence.filter(item => viewed.has(item.id)).map(item => `
            <button type="button" data-action="reason" data-value="${html(item.id)}" aria-pressed="${reason === item.id}">${html(item.label)}</button>`).join('')}
          ${reason ? `<p role="status">${card.evidence.find(item => item.id === reason).relevant
            ? 'Ця підказка стосується твердження в дописі.'
            : 'Ця підказка цікава, але не відповідає на запитання про допис.'}</p>` : ''}
        </fieldset>` : ''}
      </section>`;
    }

    show(`
      <div class="ua-gamebar"><div><p>${html(session.title)} · ${run.index + 1} / ${run.length}</p>
        <div class="ua-steps" aria-hidden="true">${Array.from({ length: run.length }, (_, index) => `<span data-step="${index < run.index ? 'done' : index === run.index ? 'current' : 'next'}"></span>`).join('')}</div></div>
        ${button('Завершити', 'stop', '', 'ua-quiet')}
      </div>
      <div class="ua-game-grid">
        <article class="ua-post"><header><span class="ua-avatar" aria-hidden="true">${html(card.author.charAt(0))}</span>
          <div><strong>${html(card.author)}</strong><small>Вигаданий допис</small></div></header>${visual}
          <h1 tabindex="-1">${html(card.claim)}</h1></article>
        <section class="ua-decisions">
          <div class="ua-actions ua-tools">
            <button class="ua-check-button" type="button" data-action="check" aria-expanded="${checkOpen}"><span aria-hidden="true">🔎</span> ${checkOpen ? 'Згорнути підказки' : 'Перевірити джерело'}</button>
            ${button('Попросити дорослого', 'help')}
          </div>
          ${evidence}
          <h2>Що ми знаємо?</h2>
          <div class="ua-actions ua-choices">
            ${Object.entries(conclusions).map(([value, label]) => `<button type="button" data-action="choose" data-value="${value}" aria-pressed="${choice === value}"><span aria-hidden="true">${choiceSymbols[value]}</span>${label}</button>`).join('')}
          </div>
          ${response}
          <div class="ua-actions ua-nav">
            ${button('Пропустити', 'skip', '', 'ua-quiet')}
            ${choice ? button('Далі →', 'next', '', 'ua-primary') : ''}
          </div>
        </section>
      </div>`, focusSelector);
  }

  function clearCard() {
    viewed = new Set();
    checkOpen = false;
    choice = null;
    firstChoice = null;
    reason = null;
  }

  function showSummary() {
    mode = 'summary';
    const answered = responses.filter(Boolean).length;
    const skipped = responses.length - answered;
    const remaining = run.length - responses.length;
    const assessment = session.kind === 'assessment';
    const allDone = remaining === 0;
    show(`<section class="ua-result">
      <h1 tabindex="-1">${allDone ? 'Вправу завершено' : 'Можна відпочити'}</h1>
      <p>${assessment ? 'Дякуємо за відповіді.' : 'Можна перевіряти, змінювати думку й просити допомоги.'}</p>
      <dl><div><dt>Відповіді</dt><dd>${answered}</dd></div><div><dt>Пропущено</dt><dd>${skipped}</dd></div><div><dt>Залишилося</dt><dd>${remaining}</dd></div></dl>
      <div class="ua-actions">${button('До вправ', 'home', '', 'ua-primary')}
        ${!assessment && allDone ? button('Уточнити допис', 'repair') : ''}</div>
    </section>`);
  }

  function showRepair(focusSelector = 'h1') {
    mode = 'repair';
    const activity = deck.repair;
    show(`<section class="ua-result ua-repair">
      <h1 tabindex="-1">Уточни допис</h1>
      <p>«${html(activity.claim)}»</p>
      <p class="ua-repair-source">${html(activity.evidence)}</p>
      <h2>Який підпис точніший?</h2>
      <div class="ua-actions ua-choices">${activity.options.map((option, index) => `<button type="button" data-action="repair-choice" data-value="${index}" aria-pressed="${repaired === index}">${html(option)}</button>`).join('')}</div>
      ${repaired !== null ? `<p class="ua-feedback" id="ua-repair-feedback" tabindex="-1">${repaired === activity.answer ? 'Саме так. ' : 'Зіставмо підпис із записом. '}${html(activity.feedback)}</p>` : ''}
      ${button('До вправ', 'home', '', 'ua-primary')}
    </section>`, focusSelector);
  }

  root.addEventListener('click', event => {
    const control = event.target.closest('button[data-action]');
    if (!control) return;
    const { action: requestedAction, value } = control.dataset;
    const action = requestedAction.replace(/^help-/, '');
    if (action !== requestedAction) dialog.close();
    if (action === 'start' && mode === 'home' && sessions.has(value)) {
      session = sessions.get(value);
      run = createDeckRun(session.cards);
      responses = [];
      clearCard();
      showCard();
    } else if (action === 'home') {
      showHome();
    } else if (action === 'repair' && mode === 'summary') {
      repaired = null;
      showRepair();
    } else if (action === 'repair-choice' && mode === 'repair') {
      repaired = Number(value);
      showRepair('#ua-repair-feedback');
    } else if (mode === 'card') {
      switch (action) {
        case 'help': dialog.showModal(); break;
        case 'stop': showSummary(); break;
        case 'check':
          checkOpen = !checkOpen;
          showCard(checkOpen ? '#ua-check-heading' : '[data-action="check"]');
          break;
        case 'evidence':
          viewed.add(value);
          showCard(`[data-source="${CSS.escape(value)}"]`);
          break;
        case 'choose':
          firstChoice ??= value;
          choice = value;
          showCard(session.kind === 'assessment' ? '[data-action="next"]' : '#ua-feedback');
          break;
        case 'reason':
          reason = value;
          showCard(`[data-action="reason"][data-value="${CSS.escape(value)}"]`);
          break;
        case 'next':
        case 'skip':
          if (action === 'next' && !choice) break;
          responses.push(action === 'skip' ? null : choice);
          run.advance();
          clearCard();
          if (run.current) showCard();
          else showSummary();
          break;
      }
    }
  });

  window.render_game_to_text = () => JSON.stringify({
    mode, session: session?.id ?? null, step: mode === 'card' ? run.index + 1 : null,
    total: run?.length ?? null, card: mode === 'card' ? run.current.id : null,
    checkOpen, evidenceViewed: [...viewed], choice, helpOpen: dialog.open,
    answered: responses.filter(Boolean).length, skipped: responses.filter(item => item === null).length,
  });
  showHome(false);
}
