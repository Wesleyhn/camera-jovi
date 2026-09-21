const preloader = document.getElementById('preloader');
window.setTimeout(() => {
  preloader.classList.add('preloader-hide');
  preloader.addEventListener('transitionend', () => preloader.remove(), {
    once: true,
  });
}, 1400);

const bar = document.querySelector('[data-control="camera"]');

const state = {
  flash: false,
  colors: false,
  macro: false,
  abertura: false,
  exposicao: false,
  filtros: false,
  menuOpen: false,
};

function render() {
  bar.querySelectorAll('li[data-control]').forEach((item) => {
    const key = item.dataset.control;
    if (key === 'menu') return;
    item.classList.toggle('is-active', state[key]);
  });

  bar.querySelectorAll('[data-group="extra"]').forEach((item) => {
    item.classList.toggle('hidden', !state.menuOpen);
  });

  bar
    .querySelector('[data-control="menu-open"]')
    .classList.toggle('hidden', state.menuOpen);
  bar
    .querySelector('[data-control="menu-close"]')
    .classList.toggle('hidden', !state.menuOpen);
}

bar.addEventListener('click', (event) => {
  const button = event.target.closest('button');
  if (!button) return;

  const action = button.dataset.control;
  if (action === 'menu-open' || action === 'menu-close') {
    state.menuOpen = action === 'menu-open';
    render();
    return;
  }

  const key = button.closest('li').dataset.control;
  state[key] = !state[key];
  render();

  if (key === 'filtros' && typeof alternarFiltro === 'function') {
    alternarFiltro();
  }
});

const zoomBar = document.querySelector('[data-control="zoom"]');
zoomBar.addEventListener('click', (event) => {
  const target = event.target.closest('span');
  if (!target) return;

  zoomBar
    .querySelectorAll('span')
    .forEach((item) => item.classList.remove('zoom-ativo'));
  target.classList.add('zoom-ativo');

  if (typeof definirZoom === 'function') {
    definirZoom(Number(target.dataset.zoom));
  }
});

const shutterIcon = document.getElementById('shutter-icon');
const shutterBtn = document.getElementById('shutter-btn');
const recordModes = ['video', 'cinematic'];

function getCameraMode() {
  return document.querySelector('[data-active]')?.dataset.mode || 'foto';
}

function updateShutter(mode) {
  const isRecordMode = recordModes.includes(mode);
  shutterIcon.src = isRecordMode
    ? './src/assets/icons/Ellipse-vid.svg'
    : './src/assets/icons/Ellipse-cam.svg';
  shutterBtn.setAttribute(
    'aria-label',
    isRecordMode ? 'Gravar vídeo' : 'Tirar foto',
  );
}

const modesBar = document.getElementById('camera-modes');
modesBar.addEventListener('click', (event) => {
  const target = event.target.closest('p');
  if (!target) return;

  modesBar.querySelectorAll('p').forEach((item) => {
    item.classList.remove('text-destaque');
    item.removeAttribute('data-active');
  });
  target.classList.add('text-destaque');
  target.setAttribute('data-active', '');
  target.scrollIntoView({
    behavior: 'smooth',
    inline: 'center',
    block: 'nearest',
  });
  updateShutter(target.dataset.mode);
});

render();
const activeMode = document.querySelector('[data-active]');
activeMode?.scrollIntoView({ behavior: 'auto', inline: 'center' });
updateShutter(activeMode?.dataset.mode);
