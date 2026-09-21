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
  grade: false,
  temporizador: false,
  exposicao: false,
  filtros: false,
  menuOpen: false,
};

let temporizadorSegundos = 0;
let temporizadorSubmenuAberto = false;
let exposicaoSubmenuAberto = false;
let filtrosSubmenuAberto = false;
let colorsSubmenuAberto = false;

function render() {
  bar.querySelectorAll('li[data-control]').forEach((item) => {
    const key = item.dataset.control;
    if (key === 'menu') return;
    item.classList.toggle('is-active', Boolean(state[key]));
  });

  const gradeOverlay = document.getElementById('grade-camera');
  if (gradeOverlay) {
    gradeOverlay.classList.toggle('hidden', !state.grade);
  }

  const temporizadorMenu = document.getElementById('temporizador-opcoes');
  if (temporizadorMenu) {
    temporizadorMenu.classList.toggle('hidden', !temporizadorSubmenuAberto);
  }

  const exposicaoMenu = document.getElementById('exposicao-opcoes');
  if (exposicaoMenu) {
    exposicaoMenu.classList.toggle('hidden', !exposicaoSubmenuAberto);
  }

  const filtrosMenu = document.getElementById('filtros-opcoes');
  if (filtrosMenu) {
    filtrosMenu.classList.toggle('hidden', !filtrosSubmenuAberto);
  }

  const colorsMenu = document.getElementById('colors-opcoes');
  if (colorsMenu) {
    colorsMenu.classList.toggle('hidden', !colorsSubmenuAberto);
  }

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

  if (key === 'temporizador') {
    temporizadorSubmenuAberto = !temporizadorSubmenuAberto;
    exposicaoSubmenuAberto = false;
    filtrosSubmenuAberto = false;
    colorsSubmenuAberto = false;
    render();
    return;
  }

  if (key === 'exposicao') {
    exposicaoSubmenuAberto = !exposicaoSubmenuAberto;
    temporizadorSubmenuAberto = false;
    filtrosSubmenuAberto = false;
    colorsSubmenuAberto = false;
    state.exposicao = exposicaoSubmenuAberto;
    render();
    return;
  }

  if (key === 'filtros') {
    filtrosSubmenuAberto = !filtrosSubmenuAberto;
    temporizadorSubmenuAberto = false;
    exposicaoSubmenuAberto = false;
    colorsSubmenuAberto = false;
    state.filtros = filtrosSubmenuAberto;
    render();
    return;
  }

  if (key === 'colors') {
    colorsSubmenuAberto = !colorsSubmenuAberto;
    temporizadorSubmenuAberto = false;
    exposicaoSubmenuAberto = false;
    filtrosSubmenuAberto = false;
    state.colors = colorsSubmenuAberto;
    render();
    return;
  }

  state[key] = !state[key];
  render();
});

const temporizadorMenu = document.getElementById('temporizador-opcoes');
temporizadorMenu.addEventListener('click', (event) => {
  const opcao = event.target.closest('li');
  if (!opcao) return;

  temporizadorSegundos = Number(opcao.dataset.segundos);
  state.temporizador = temporizadorSegundos > 0;

  temporizadorMenu
    .querySelectorAll('li')
    .forEach((item) => item.classList.remove('text-destaque'));
  opcao.classList.add('text-destaque');

  render();
});

const filtrosMenu = document.getElementById('filtros-opcoes');
filtrosMenu.addEventListener('click', (event) => {
  const opcao = event.target.closest('li');
  if (!opcao) return;

  if (typeof aplicarFiltro === 'function') {
    aplicarFiltro(opcao.dataset.filtro);
  }

  filtrosMenu
    .querySelectorAll('li')
    .forEach((item) => item.classList.remove('text-destaque'));
  opcao.classList.add('text-destaque');

  render();
});

document.addEventListener('click', (event) => {
  let precisaRenderizar = false;

  if (
    temporizadorSubmenuAberto &&
    !event.target.closest('#temporizador-opcoes') &&
    !event.target.closest('[data-control="temporizador"]')
  ) {
    temporizadorSubmenuAberto = false;
    precisaRenderizar = true;
  }

  if (
    exposicaoSubmenuAberto &&
    !event.target.closest('#exposicao-opcoes') &&
    !event.target.closest('[data-control="exposicao"]')
  ) {
    exposicaoSubmenuAberto = false;
    state.exposicao = false;
    precisaRenderizar = true;
  }

  if (
    filtrosSubmenuAberto &&
    !event.target.closest('#filtros-opcoes') &&
    !event.target.closest('[data-control="filtros"]')
  ) {
    filtrosSubmenuAberto = false;
    state.filtros = false;
    precisaRenderizar = true;
  }

  if (
    colorsSubmenuAberto &&
    !event.target.closest('#colors-opcoes') &&
    !event.target.closest('[data-control="colors"]')
  ) {
    colorsSubmenuAberto = false;
    state.colors = false;
    precisaRenderizar = true;
  }

  if (precisaRenderizar) render();
});

const controleTemperatura = document.getElementById('controle-temperatura');
const temperaturaOverlay = document.getElementById('temperatura-overlay');

function atualizarTemperatura() {
  if (!controleTemperatura || !temperaturaOverlay) return;

  const valor = Number(controleTemperatura.value);
  const intensidade = Math.min(Math.abs(valor) / 50, 1);

  temperaturaOverlay.style.backgroundColor = valor >= 0 ? '#ff9633' : '#3399ff';
  temperaturaOverlay.style.opacity = (intensidade * 0.35).toFixed(2);
}

if (controleTemperatura) {
  controleTemperatura.addEventListener('input', atualizarTemperatura);
}

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

function atualizarOpcoesZoom() {
  const cameraFrontal = typeof cameraAtual !== 'undefined' && cameraAtual === 'user';

  const zoomMin = zoomBar.querySelector('[data-zoom="0.5"]');
  const zoomMax = zoomBar.querySelector('[data-zoom="5"]');
  if (zoomMin) zoomMin.classList.toggle('hidden', cameraFrontal);
  if (zoomMax) zoomMax.classList.toggle('hidden', cameraFrontal);

  if (!cameraFrontal) return;

  const ativo = zoomBar.querySelector('.zoom-ativo');
  if (ativo && (ativo.dataset.zoom === '0.5' || ativo.dataset.zoom === '5')) {
    zoomBar
      .querySelectorAll('span')
      .forEach((item) => item.classList.remove('zoom-ativo'));

    const zoomUm = zoomBar.querySelector('[data-zoom="1"]');
    if (zoomUm) zoomUm.classList.add('zoom-ativo');

    if (typeof definirZoom === 'function') definirZoom(1);
  }
}

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

function ativarModo(target, { rolar = true } = {}) {
  modesBar.querySelectorAll('p').forEach((item) => {
    item.classList.remove('text-destaque');
    item.removeAttribute('data-active');
  });
  target.classList.add('text-destaque');
  target.setAttribute('data-active', '');

  if (rolar) {
    target.scrollIntoView({
      behavior: 'smooth',
      inline: 'center',
      block: 'nearest',
    });
  }

  updateShutter(target.dataset.mode);
}

modesBar.addEventListener('click', (event) => {
  const target = event.target.closest('p');
  if (!target) return;

  ativarModo(target);
});

let modosScrollTimeout = null;
modesBar.addEventListener('scroll', () => {
  clearTimeout(modosScrollTimeout);

  modosScrollTimeout = setTimeout(() => {
    const centroBar =
      modesBar.getBoundingClientRect().left + modesBar.clientWidth / 2;

    let maisProximo = null;
    let menorDistancia = Infinity;

    modesBar.querySelectorAll('p').forEach((item) => {
      const rect = item.getBoundingClientRect();
      const centroItem = rect.left + rect.width / 2;
      const distancia = Math.abs(centroItem - centroBar);

      if (distancia < menorDistancia) {
        menorDistancia = distancia;
        maisProximo = item;
      }
    });

    if (maisProximo && !maisProximo.hasAttribute('data-active')) {
      ativarModo(maisProximo, { rolar: false });
    }
  }, 120);
});

render();
const activeMode = document.querySelector('[data-active]');
activeMode?.scrollIntoView({ behavior: 'auto', inline: 'center' });
updateShutter(activeMode?.dataset.mode);
