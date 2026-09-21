/* ELEMENTOS */

const video = document.getElementById('webcam');

const canvas = document.getElementById('photo-canvas');

const previewImage = document.getElementById('preview-image');

const status = document.getElementById('status');

const btnIniciar = document.getElementById('btn-iniciar');

const btnFoto = document.getElementById('btn-foto');

const btnGravar = document.getElementById('btn-gravar');

const btnTorch = document.getElementById('btn-torch');

const btnMudar = document.getElementById('btn-alternar');

const botoesFiltro = document.querySelectorAll('.btn-filtro');

const contador = document.getElementById('contador-temporizador');

const controleZoom = document.getElementById('controle-zoom');

const valorZoom = document.getElementById('valor-zoom');

const brilho = document.getElementById('controle-brilho');

const contraste = document.getElementById('controle-contraste');

const saturacao = document.getElementById('controle-saturacao');

const brilhoValor = document.getElementById('brilho-valor');

const contrasteValor = document.getElementById('contraste-valor');

const saturacaoValor = document.getElementById('saturacao-valor');

/* VARIÁVEIS */

let stream = null;

let gravador = null;

let partesVideo = [];

let cameraAtual = 'environment';

let filtroAtual = 'normal';

/* TAMANHO DO VÍDEO (iOS costuma ignorar w-full/h-full em <video> com
   srcObject até receber um tamanho explícito em pixels) */

function redimensionarVideo() {
  if (!video) return;

  const largura = window.visualViewport?.width || window.innerWidth;
  const altura = window.visualViewport?.height || window.innerHeight;

  video.style.width = `${largura}px`;
  video.style.height = `${altura}px`;
}

window.addEventListener('resize', redimensionarVideo);
window.addEventListener('orientationchange', () => {
  setTimeout(redimensionarVideo, 300);
});

if (video) {
  video.addEventListener('loadedmetadata', redimensionarVideo);
}

redimensionarVideo();

/* STATUS */

function mudarStatus(texto) {
  if (status) {
    status.textContent = texto;
  }
}

/* VERIFICAR SUPORTE */

function verificarSuporte() {
  if (!navigator.mediaDevices) {
    mudarStatus(' Este navegador não permite acesso à câmera.');

    return false;
  }

  if (!navigator.mediaDevices.getUserMedia) {
    mudarStatus(' getUserMedia não é suportado.');

    return false;
  }

  return true;
}

/* INICIAR CÂMERA */

async function iniciarCamera() {
  if (!video) {
    return;
  }

  if (!verificarSuporte()) {
    return;
  }

  /* Verificação HTTPS */

  if (
    location.protocol !== 'https:' &&
    location.hostname !== 'localhost' &&
    location.hostname !== '127.0.0.1'
  ) {
    mudarStatus(' A câmera precisa de HTTPS. Abra o site usando https://');

    alert(
      'Por segurança, o navegador do celular bloqueia a câmera em páginas sem HTTPS.',
    );

    return;
  }

  /* Parar câmera anterior */

  if (stream) {
    stream.getTracks().forEach((track) => track.stop());

    stream = null;
  }

  mudarStatus(' solicitando permissão da câmera...');

  try {
    const constraints = {
      video: {
        facingMode: {
          ideal: cameraAtual,
        },

        width: {
          ideal: 1280,
        },

        height: {
          ideal: 720,
        },
      },

      audio: false,
    };

    stream = await navigator.mediaDevices.getUserMedia(constraints);

    video.srcObject = stream;

    await video.play();

    redimensionarVideo();

    if (btnFoto) btnFoto.disabled = false;

    if (btnGravar) btnGravar.disabled = false;

    if (btnMudar) btnMudar.disabled = false;

    mudarStatus(' câmera ligada');

    verificarFlash();

    verificarZoom();

    if (typeof atualizarOpcoesZoom === 'function') {
      atualizarOpcoesZoom();
    }

    try {
      const audioStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      /*
  Junta o áudio ao vídeo.
*/

      audioStream.getAudioTracks().forEach((track) => {
        stream.addTrack(track);
      });
    } catch (audioError) {
      console.warn('Microfone não autorizado:', audioError);

      mudarStatus(' Câmera ligada. Microfone não autorizado.');
    }
  } catch (erro) {
    console.error('Erro da câmera:', erro);

    if (erro.name === 'NotAllowedError') {
      mudarStatus(' Permissão da câmera negada.');

      alert(
        'Acesso à câmera foi negado. Toque no cadeado/permissões do navegador e permita o uso da câmera.',
      );
    } else if (erro.name === 'NotFoundError') {
      mudarStatus(' Nenhuma câmera encontrada.');
    } else if (erro.name === 'NotReadableError') {
      mudarStatus(' A Câmera está sendo usada por outro aplicativo.');

      alert(
        'Feche outros aplicativos que possam estar usando a câmera e tente novamente.',
      );
    } else if (erro.name === 'SecurityError') {
      mudarStatus(' Acesso bloqueado por segurança.');
    } else {
      mudarStatus(' Erro: ' + erro.name);

      alert('Não foi possível ligar a câmera.\n\nErro: ' + erro.name);
    }
  }
}

/* FOTO */

async function tirarFoto() {
  if (!stream) {
    alert('Ligue a câmera primeiro.');

    return;
  }

  const segundos =
    typeof temporizadorSegundos === 'number' ? temporizadorSegundos : 0;

  if (segundos > 0) {
    await executarTemporizador(segundos);
  }

  canvas.width = video.videoWidth;

  canvas.height = video.videoHeight;

  const contexto = canvas.getContext('2d');

  contexto.filter = obterFiltroCanvas();

  contexto.drawImage(video, 0, 0, canvas.width, canvas.height);

  contexto.filter = 'none';

  const foto = canvas.toDataURL('image/png');

  criarFoto(foto);
}

/* CRIAR FOTO */

function criarFoto(url) {
  if (previewImage) {
    previewImage.src = url;
  }
}

/* TEMPORIZADOR */

function executarTemporizador(segundos) {
  return new Promise((resolve) => {
    let restante = segundos;

    if (contador) contador.textContent = restante;

    const intervalo = setInterval(() => {
      restante--;

      if (restante <= 0) {
        clearInterval(intervalo);

        if (contador) contador.textContent = '';

        resolve();
      } else {
        if (contador) contador.textContent = restante;
      }
    }, 1000);
  });
}

/* GRAVAÇÃO */

function gravarVideo() {
  if (!stream) {
    alert('Ligue a câmera primeiro.');

    return;
  }

  if (gravador && gravador.state === 'recording') {
    gravador.stop();

    if (shutterBtn) shutterBtn.classList.remove('is-recording');

    return;
  }

  partesVideo = [];

  let opcoes = {};

  if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')) {
    opcoes.mimeType = 'video/webm;codecs=vp9,opus';
  } else if (MediaRecorder.isTypeSupported('video/webm')) {
    opcoes.mimeType = 'video/webm';
  }

  try {
    gravador = new MediaRecorder(stream, opcoes);
  } catch (erro) {
    alert('Este celular não suporta gravação de vídeo neste formato.');

    return;
  }

  gravador.ondataavailable = (evento) => {
    if (evento.data && evento.data.size > 0) {
      partesVideo.push(evento.data);
    }
  };

  gravador.onstop = () => {
    const blob = new Blob(partesVideo, {
      type: gravador.mimeType || 'video/webm',
    });

    const url = URL.createObjectURL(blob);

    criarVideo(url);
  };

  gravador.start();

  if (shutterBtn) shutterBtn.classList.add('is-recording');
}

/* CRIAR VÍDEO */

function criarVideo(url) {
  if (previewImage && video.videoWidth && video.videoHeight) {
    canvas.width = video.videoWidth;

    canvas.height = video.videoHeight;

    canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);

    previewImage.src = canvas.toDataURL('image/png');
  }

  window.ultimoVideoGravado = url;
}

/* FLASH */

async function ativarFlash() {
  if (!stream) return;

  const track = stream.getVideoTracks()[0];

  if (!track.getCapabilities) {
    alert('Controle de flash não suportado.');

    return;
  }

  const capabilities = track.getCapabilities();

  if (!capabilities.torch) {
    alert('a lanterna não está disponível nesta câmera.');

    return;
  }

  const atual = track.getSettings();

  try {
    await track.applyConstraints({
      advanced: [
        {
          torch: !atual.torch,
        },
      ],
    });
  } catch (erro) {
    console.error(erro);

    alert('Não foi possível controlar a lanterna.');
  }
}

/* VERIFICAR FLASH */

function verificarFlash() {
  if (!stream || !btnTorch) return;

  const track = stream.getVideoTracks()[0];

  if (!track.getCapabilities) {
    btnTorch.classList.add('opacity-40', 'pointer-events-none');

    return;
  }

  const capabilities = track.getCapabilities();

  btnTorch.classList.toggle('opacity-40', !capabilities.torch);

  btnTorch.classList.toggle('pointer-events-none', !capabilities.torch);
}

/* ALTERNAR CÂMERA */

async function mudarCamera() {
  cameraAtual = cameraAtual === 'user' ? 'environment' : 'user';

  await iniciarCamera();
}

/* ZOOM */

function verificarZoom() {
  if (!stream || !controleZoom) return;

  const track = stream.getVideoTracks()[0];

  if (!track.getCapabilities) {
    return;
  }

  const capabilities = track.getCapabilities();

  if (capabilities.zoom) {
    controleZoom.min = capabilities.zoom.min;

    controleZoom.max = capabilities.zoom.max;

    controleZoom.step = capabilities.zoom.step || 0.1;

    controleZoom.value = capabilities.zoom.min;
  }

  atualizarZoom();
}

/* TEXTO ZOOM */

function atualizarZoom() {
  if (!valorZoom || !controleZoom) return;

  valorZoom.textContent = Number(controleZoom.value).toFixed(1) + 'x';
}

/* ZOOM DIGITAL */

function aplicarZoomDigital() {
  if (!video || !controleZoom) return;

  video.style.transform = `scale(${controleZoom.value})`;
}

/* ZOOM (botões 0,5x/1x/2x/5x) */

async function definirZoom(valorZoom) {
  if (!video) return;

  if (!stream) {
    video.style.transform = `scale(${valorZoom})`;

    return;
  }

  const track = stream.getVideoTracks()[0];

  if (!track || !track.getCapabilities) {
    video.style.transform = `scale(${valorZoom})`;

    return;
  }

  const capabilities = track.getCapabilities();

  if (!capabilities.zoom) {
    video.style.transform = `scale(${valorZoom})`;

    return;
  }

  const valor = Math.min(
    Math.max(valorZoom, capabilities.zoom.min),
    capabilities.zoom.max,
  );

  try {
    await track.applyConstraints({
      advanced: [
        {
          zoom: valor,
        },
      ],
    });

    video.style.transform = 'none';
  } catch (erro) {
    console.error(erro);

    video.style.transform = `scale(${valorZoom})`;
  }
}

/* FILTROS */

function montarFiltro() {
  const brilhoValorAtual = brilho ? Number(brilho.value || 100) : 100;
  const contrasteValorAtual = contraste ? Number(contraste.value || 100) : 100;
  const saturacaoValorAtual = saturacao ? Number(saturacao.value || 100) : 100;

  return `
brightness(${brilhoValorAtual}%)
contrast(${contrasteValorAtual}%)
saturate(${saturacaoValorAtual}%)
`;
}

function aplicarFiltro(filtro) {
  filtroAtual = filtro;

  if (video) {
    if (filtro === 'normal') {
      video.style.filter = montarFiltro();
    } else {
      video.style.filter = `${filtro} ${montarFiltro()}`;
    }
  }

  botoesFiltro.forEach((botao) => {
    botao.classList.remove('ativo');

    if (botao.dataset.filtro === filtro) {
      botao.classList.add('ativo');
    }
  });
}

function obterFiltroCanvas() {
  if (filtroAtual === 'normal') {
    return montarFiltro();
  }

  return `
${filtroAtual}
${montarFiltro()}
`;
}

/* CICLO DE FILTROS (botão único "Filtros") */

const filtrosDisponiveis = [
  'normal',
  'grayscale(100%)',
  'sepia(100%)',
  'invert(100%)',
];

function alternarFiltro() {
  const indiceAtual = filtrosDisponiveis.indexOf(filtroAtual);

  const proximoIndice = (indiceAtual + 1) % filtrosDisponiveis.length;

  aplicarFiltro(filtrosDisponiveis[proximoIndice]);
}

/* AJUSTES */

if (brilho) {
  brilho.addEventListener('input', () => {
    if (brilhoValor) brilhoValor.textContent = brilho.value;

    aplicarFiltro(filtroAtual);
  });
}

if (contraste) {
  contraste.addEventListener('input', () => {
    if (contrasteValor) contrasteValor.textContent = contraste.value;

    aplicarFiltro(filtroAtual);
  });
}

if (saturacao) {
  saturacao.addEventListener('input', () => {
    if (saturacaoValor) saturacaoValor.textContent = saturacao.value;

    aplicarFiltro(filtroAtual);
  });
}

/* EVENTOS */

if (btnIniciar) btnIniciar.addEventListener('click', iniciarCamera);

if (btnFoto) {
  btnFoto.addEventListener('click', () => {
    const modo =
      typeof getCameraMode === 'function' ? getCameraMode() : 'foto';

    if (modo === 'video' || modo === 'cinematic') {
      gravarVideo();
    } else {
      tirarFoto();
    }
  });
}

if (btnGravar) btnGravar.addEventListener('click', gravarVideo);

if (btnTorch) btnTorch.addEventListener('click', ativarFlash);

if (btnMudar) btnMudar.addEventListener('click', mudarCamera);

if (controleZoom) {
  controleZoom.addEventListener('input', async () => {
    atualizarZoom();

    if (!stream) return;

    const track = stream.getVideoTracks()[0];

    if (!track.getCapabilities) {
      aplicarZoomDigital();

      return;
    }

    const capabilities = track.getCapabilities();

    if (capabilities.zoom) {
      try {
        await track.applyConstraints({
          advanced: [
            {
              zoom: Number(controleZoom.value),
            },
          ],
        });
      } catch {
        aplicarZoomDigital();
      }
    } else {
      aplicarZoomDigital();
    }
  });
}

/* INICIALIZAÇÃO */

aplicarFiltro('normal');

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    iniciarCamera();
  });
} else {
  iniciarCamera();
}

verificarSuporte();
