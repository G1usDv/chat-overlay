const defaults = {
  channel: 'diegoartow',
  maxMessages: 4,
  messageLifetime: 13000,
  fallbackColor: '#b751ff',
};

const params = new URLSearchParams(window.location.search);
const config = {
  channel: (params.get('channel') || defaults.channel).replace(/^#/, '').toLowerCase(),
  nick: (params.get('nick') || '').toLowerCase(),
  token: params.get('token') || '',
  demo: params.get('demo') === '1',
  maxMessages: Number(params.get('max')) || defaults.maxMessages,
  messageLifetime: Number(params.get('duration')) || defaults.messageLifetime,
};

const chatStack = document.querySelector('#chat-stack');
const connectionState = document.querySelector('#connection-state');
let socket;
let reconnectTimer;
const exitAnimationDuration = 820;

function contrastColor(hex) {
  const normalized = hex.replace('#', '');
  if (!/^[\da-f]{6}$/i.test(normalized)) return '#ffffff';

  const [r, g, b] = normalized.match(/.{2}/g).map((value) => Number.parseInt(value, 16));
  const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  return luminance > 0.63 ? '#14111b' : '#ffffff';
}

function sanitizeText(value) {
  return value.replace(/[\u0000-\u001f<>]/g, '').trim();
}

function createBadge(label) {
  const badge = document.createElement('span');
  badge.className = 'chat-card__badge';
  badge.textContent = label;
  return badge;
}

function badgesFor(tags) {
  const rawBadges = (tags.badges || '').split(',').map((badge) => badge.split('/')[0]);
  const supported = [
    ['broadcaster', '★'],
    ['moderator', '⚔'],
    ['vip', 'V'],
    ['subscriber', '✦'],
  ];
  return supported.filter(([key]) => rawBadges.includes(key)).map(([, label]) => label);
}

function addMessage({ name, text, color, badges = [] }) {
  const cleanName = sanitizeText(name).slice(0, 50);
  const cleanText = sanitizeText(text).slice(0, 500);
  if (!cleanName || !cleanText) return;

  const accent = /^#[\da-f]{6}$/i.test(color || '') ? color : defaults.fallbackColor;
  const card = document.createElement('article');
  card.className = 'chat-card';
  card.style.setProperty('--accent', accent);
  card.style.setProperty('--accent-text', contrastColor(accent));

  const nameBar = document.createElement('div');
  nameBar.className = 'chat-card__name';
  if (badges.length) {
    const badgeList = document.createElement('span');
    badgeList.className = 'chat-card__badges';
    badges.slice(0, 3).forEach((badge) => badgeList.append(createBadge(badge)));
    nameBar.append(badgeList);
  }

  const nameText = document.createElement('span');
  nameText.className = 'chat-card__name-text';
  nameText.textContent = cleanName;
  nameBar.append(nameText);

  const message = document.createElement('div');
  message.className = 'chat-card__message';
  const messageText = document.createElement('span');
  messageText.textContent = cleanText;
  message.append(messageText);
  card.append(nameBar, message);
  chatStack.append(card);

  // Keep the configured amount of visible cards. Cards being animated out still
  // remain in the DOM briefly, so counting every child here would repeatedly
  // select the same leaving card and lock the browser source on message five.
  const visibleCards = [...chatStack.children].filter((item) => !item.classList.contains('is-leaving'));
  while (visibleCards.length > config.maxMessages) removeCard(visibleCards.shift());
  window.setTimeout(() => removeCard(card), config.messageLifetime);
}

function removeCard(card) {
  if (!card || card.classList.contains('is-leaving')) return;
  card.classList.add('is-leaving');
  window.setTimeout(() => card.remove(), exitAnimationDuration);
}

function parseTags(rawTags = '') {
  return Object.fromEntries(
    rawTags.split(';').filter(Boolean).map((entry) => {
      const [key, ...rest] = entry.split('=');
      return [key, rest.join('=').replace(/\\s/g, ' ').replace(/\\:/g, ';').replace(/\\\\/g, '\\')];
    }),
  );
}

function parseIrcLine(line) {
  if (line.startsWith('PING')) {
    socket?.send(line.replace('PING', 'PONG'));
    return;
  }

  const match = line.match(/^(?:@([^ ]+) )?:([^!]+)![^ ]+ PRIVMSG #[^ ]+ :(.+)$/);
  if (!match) return;
  const [, rawTags, login, text] = match;
  const tags = parseTags(rawTags);
  addMessage({
    name: tags['display-name'] || login,
    text,
    color: tags.color,
    badges: badgesFor(tags),
  });
}

function showState(text) {
  if (!config.demo) return;
  connectionState.textContent = text;
  connectionState.hidden = !text;
}

function normalizeToken(value) {
  if (!value) return '';
  return value.startsWith('oauth:') ? value : `oauth:${value}`;
}

function connectToTwitch() {
  if (!config.token || !config.nick) return;
  socket = new WebSocket('wss://irc-ws.chat.twitch.tv:443');
  showState('Conectando ao chat…');

  socket.addEventListener('open', () => {
    socket.send(`PASS ${normalizeToken(config.token)}`);
    socket.send(`NICK ${config.nick}`);
    socket.send('CAP REQ :twitch.tv/tags twitch.tv/commands');
    socket.send(`JOIN #${config.channel}`);
    showState('Chat conectado');
  });

  socket.addEventListener('message', ({ data }) => data.split('\r\n').filter(Boolean).forEach(parseIrcLine));
  socket.addEventListener('error', () => showState('Não foi possível conectar ao chat'));
  socket.addEventListener('close', () => {
    showState('Reconectando…');
    window.clearTimeout(reconnectTimer);
    reconnectTimer = window.setTimeout(connectToTwitch, 5000);
  });
}

function startDemo() {
  const demoMessages = [
    { name: 'sircaaupudim', color: '#3478f6', text: 'ta animado pra essa bomba de jogo?' },
    { name: 'ka2ique', color: '#e6ac27', text: 'Hj é live com os amigos?' },
    { name: 'sh1gueki', color: '#e943a8', text: 'o setup ficou absurdo, mano!' },
    { name: 'giannvictor_', color: '#1aa36b', text: 'cheguei pra acompanhar a resenha' },
  ];
  demoMessages.forEach((message, index) => window.setTimeout(() => addMessage(message), index * 1100));
}

if (config.demo) startDemo();
else connectToTwitch();
