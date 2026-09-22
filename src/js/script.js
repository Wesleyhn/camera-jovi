document.addEventListener('DOMContentLoaded', () => {
    // Elementos fixos da barra de ações e estado compartilhado da galeria.
    const barraAcoes = document.getElementById('barra-acoes');
    const contadorSelecao = document.getElementById('contador-selecao');
    const btnCancelar = document.getElementById('btn-cancelar');
    const btnApagar = document.getElementById('btn-apagar');
    const btnCompartilhar = document.getElementById('btn-compartilhar');
    const btnMover = document.getElementById('btn-mover');

    let modoSelecao = false;
    let fotosSelecionadas = new Set();
    let pressTimer = null;

    // Dentro do popup da câmera, "voltar" fecha o popup em vez de navegar.
    const voltarCamera = document.getElementById('voltar-camera');
    if (voltarCamera && window.parent !== window) {
        voltarCamera.addEventListener('click', (event) => {
            event.preventDefault();
            window.parent.postMessage(
                { tipo: 'jovi-fechar-galeria' },
                window.location.origin,
            );
        });
    }

    // -----------------------------------------------------------------------
    // Imagens e identificação dos itens
    // -----------------------------------------------------------------------

    // O mesmo ID identifica cópias da foto na galeria principal e nos álbuns.
    function atribuirIdsUnicos() {
        document.querySelectorAll('.foto-item').forEach((fotoItem, indice) => {
            if (!fotoItem.dataset.idFoto) {
                fotoItem.dataset.idFoto = `foto-original-${Date.now()}-${indice}-${Math.random().toString(16).slice(2, 8)}`;
            }
        });
    }

    // -----------------------------------------------------------------------
    // Seleção de fotos
    // -----------------------------------------------------------------------

    function formatarContador(total) {
        return `${total} selecionada${total === 1 ? '' : 's'}`;
    }

    function atualizarContadorSelecao() {
        const total = fotosSelecionadas.size;
        contadorSelecao.textContent = formatarContador(total);

        if (total === 0) {
            cancelarModoSelecao();
            return;
        }

        barraAcoes.classList.add('barra-ativa');
    }

    function iniciarModoSelecao() {
        modoSelecao = true;
        barraAcoes.classList.add('barra-ativa');
    }

    function cancelarModoSelecao() {
        modoSelecao = false;
        fotosSelecionadas.forEach((foto) => foto.classList.remove('selecionada'));
        fotosSelecionadas.clear();
        barraAcoes.classList.remove('barra-ativa');
        contadorSelecao.textContent = '0 selecionadas';
    }

    // Mantém o Set e a classe visual sincronizados para um item específico.
    function toggleSelecao(fotoItem) {
        if (!fotoItem) return;

        if (fotosSelecionadas.has(fotoItem)) {
            fotosSelecionadas.delete(fotoItem);
            fotoItem.classList.remove('selecionada');
        } else {
            fotosSelecionadas.add(fotoItem);
            fotoItem.classList.add('selecionada');
        }

        atualizarContadorSelecao();
    }

    // -----------------------------------------------------------------------
    // Contadores e eventos das miniaturas
    // -----------------------------------------------------------------------

    function atualizarContagemAlbum(album) {
        if (!album) return;

        const totalNoAlbum = album.querySelectorAll('.grade-fotos .foto-item').length;
        const contagemTexto = album.querySelector('.contagem-album');
        const contagemDescricao = album.querySelector('.contagem-itens');

        if (contagemTexto) {
            contagemTexto.textContent = totalNoAlbum;
        }

        if (contagemDescricao) {
            contagemDescricao.textContent = `${totalNoAlbum} itens neste álbum.`;
        }
    }

    function atualizarContagemTotal() {
        const totalFotos = document.querySelectorAll('#grade-fotos-recentes .foto-item').length;
        const textoContagem = document.querySelector('.painel-fotos .contagem-itens');

        if (textoContagem) {
            textoContagem.textContent = `Você possui ${totalFotos} itens.`;
        }

        document.querySelectorAll('.cartao-album').forEach((album) => {
            atualizarContagemAlbum(album);
        });
    }

    function bindFotoEvents() {
        document.querySelectorAll('.foto-miniatura').forEach((label) => {
            if (label.dataset.bound === 'true') return;
            label.dataset.bound = 'true';

            label.addEventListener('click', (event) => {
                if (!modoSelecao) return;

                event.preventDefault();
                event.stopPropagation();
                toggleSelecao(label.closest('.foto-item'));
            });

            label.addEventListener('pointerdown', (event) => {
                if (modoSelecao || (event.pointerType === 'mouse' && event.button !== 0)) return;

                clearTimeout(pressTimer);
                pressTimer = setTimeout(() => {
                    const fotoItem = label.closest('.foto-item');
                    if (!fotoItem) return;

                    iniciarModoSelecao();
                    toggleSelecao(fotoItem);
                }, 450);
            });

            ['pointerup', 'pointerleave', 'pointercancel'].forEach((tipo) => {
                label.addEventListener(tipo, () => {
                    clearTimeout(pressTimer);
                });
            });
        });
    }

    // Retorna a foto aberta no visor quando não existe uma seleção múltipla.
    function obterFotoAtiva() {
        const inputAtivo = document.querySelector('.visor-input:checked');
        return inputAtivo ? inputAtivo.closest('.foto-item') : null;
    }

    let inicioGestoVisor = null;
    let ignorarCliqueDoGesto = false;

    function navegarPeloVisor(itemAtual, direcao) {
        const gradeAtual = itemAtual?.closest('.grade-fotos');
        if (!gradeAtual) return;

        const itens = Array.from(gradeAtual.children).filter((item) =>
            item.classList.contains('foto-item') && item.querySelector('.visor-input')
        );
        const indiceAtual = itens.indexOf(itemAtual);
        const proximoIndice = indiceAtual + direcao;

        if (indiceAtual < 0 || proximoIndice < 0 || proximoIndice >= itens.length) return;

        const inputAtual = itemAtual.querySelector('.visor-input');
        const proximoInput = itens[proximoIndice].querySelector('.visor-input');

        inputAtual.checked = false;
        proximoInput.checked = true;
    }

    document.addEventListener('pointerdown', (event) => {
        const visor = event.target.closest('.visor-foto');
        if (!visor || (event.pointerType === 'mouse' && event.button !== 0)) return;

        inicioGestoVisor = {
            x: event.clientX,
            y: event.clientY,
            visor,
        };
    });

    document.addEventListener('pointerup', (event) => {
        if (!inicioGestoVisor) return;

        const deslocamentoX = event.clientX - inicioGestoVisor.x;
        const deslocamentoY = event.clientY - inicioGestoVisor.y;
        const distanciaMinima = 50;
        const eHorizontal = Math.abs(deslocamentoX) >= distanciaMinima &&
            Math.abs(deslocamentoX) > Math.abs(deslocamentoY);

        if (eHorizontal) {
            event.preventDefault();
            navegarPeloVisor(
                inicioGestoVisor.visor.closest('.foto-item'),
                deslocamentoX < 0 ? 1 : -1
            );
            ignorarCliqueDoGesto = true;
            window.setTimeout(() => {
                ignorarCliqueDoGesto = false;
            }, 400);
        }

        inicioGestoVisor = null;
    });

    document.addEventListener('click', (event) => {
        if (!ignorarCliqueDoGesto) return;

        event.preventDefault();
        event.stopPropagation();
        ignorarCliqueDoGesto = false;
    }, true);

    function obterFotosParaAcao() {
        if (fotosSelecionadas.size > 0) {
            return Array.from(fotosSelecionadas);
        }

        const fotoAtiva = obterFotoAtiva();
        return fotoAtiva ? [fotoAtiva] : [];
    }

    // Adiciona o botão de exclusão ao visor de cada foto sem duplicá-lo.
    function inicializarBotoesVisualizacao() {
        document.querySelectorAll('.visor-foto').forEach((visor) => {
            if (visor.querySelector('.botao-apagar-destaque')) return;

            const fotoItem = visor.closest('.foto-item');
            const checkboxRelacionado = fotoItem ? fotoItem.querySelector('input[type="checkbox"]') : null;
            const botaoApagar = document.createElement('button');
            botaoApagar.type = 'button';
            botaoApagar.className = 'botao-apagar-destaque';
            botaoApagar.textContent = 'Apagar';
            botaoApagar.setAttribute('aria-label', 'Apagar foto em destaque');
            botaoApagar.dataset.alvo = checkboxRelacionado ? checkboxRelacionado.id : '';
            visor.appendChild(botaoApagar);
        });
    }

    // Remove todas as representações da mesma foto usando o ID compartilhado.
    function removerFotoDaGaleria(fotoItem) {
        if (!fotoItem) return;

        const idFoto = fotoItem.dataset.idFoto || '';
        const inputId = fotoItem.querySelector('input')?.id || '';

        document.querySelectorAll('.foto-item').forEach((item) => {
            const mesmoId = idFoto && item.dataset.idFoto === idFoto;
            const mesmoInput = inputId && item.querySelector('input')?.id === inputId;

            if (!mesmoId && !mesmoInput) return;

            const input = item.querySelector('input');
            if (input) {
                input.checked = false;
            }

            if (fotosSelecionadas.has(item)) {
                fotosSelecionadas.delete(item);
            }

            item.classList.remove('selecionada');
            item.remove();
        });

        document.querySelectorAll('.cartao-album').forEach((album) => {
            atualizarContagemAlbum(album);
        });

        atualizarContagemTotal();
        atualizarContadorSelecao();
    }

    // -----------------------------------------------------------------------
    // Ações da barra: cancelar, apagar e compartilhar
    // -----------------------------------------------------------------------

    btnCancelar.addEventListener('click', cancelarModoSelecao);

    btnApagar.addEventListener('click', () => {
        const fotos = obterFotosParaAcao();

        if (!fotos.length) {
            alert('Selecione pelo menos uma foto para apagar.');
            return;
        }

        const mensagem = fotos.length === 1
            ? 'Tem certeza que deseja apagar esta foto?'
            : `Tem certeza que deseja apagar ${fotos.length} foto(s)?`;

        if (confirm(mensagem)) {
            fotos.forEach((foto) => removerFotoDaGaleria(foto));
            cancelarModoSelecao();
        }
    });

    document.addEventListener('click', (event) => {
        const botaoApagarDestaque = event.target.closest('.botao-apagar-destaque');
        if (!botaoApagarDestaque) return;

        event.preventDefault();
        event.stopPropagation();

        const fotoItem = botaoApagarDestaque.closest('.foto-item');
        if (!fotoItem) return;

        if (confirm('Tem certeza que deseja apagar esta foto?')) {
            removerFotoDaGaleria(fotoItem);
        }
    });

    btnCompartilhar.addEventListener('click', async () => {
        const fotos = obterFotosParaAcao();
        const urls = fotos
            .map((foto) => {
                const img = foto.querySelector('img');
                if (!img) return '';
                return img.dataset.srcOriginal || img.src || '';
            })
            .filter((url) => url && !url.startsWith('data:'));

        // Sem uma URL original, compartilha a própria página da galeria.
        if (!urls.length) {
            const fallbackUrl = window.location.href;
            if (!fallbackUrl) {
                alert('Selecione pelo menos uma foto para compartilhar.');
                return;
            }

            if (navigator.share) {
                try {
                    await navigator.share({
                        title: 'Fotos da JOVI',
                        text: 'Dá uma olhada nesta foto!',
                        url: fallbackUrl
                    });
                } catch (error) {
                    console.log('Compartilhamento cancelado ou falhou', error);
                }
            } else {
                try {
                    await navigator.clipboard.writeText(fallbackUrl);
                    alert('Link da galeria copiado para a área de transferência.');
                } catch (error) {
                    alert(`Link para compartilhar:\n${fallbackUrl}`);
                }
            }
            return;
        }

        const texto = fotos.length > 1 ? 'Dá uma olhada nestas fotos!' : 'Dá uma olhada nesta foto!';

        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Fotos da JOVI',
                    text: texto,
                    url: urls[0]
                });
            } catch (error) {
                console.log('Compartilhamento cancelado ou falhou', error);
            }
        } else {
            try {
                await navigator.clipboard.writeText(urls.join('\n'));
                alert('Links copiados para a área de transferência.');
            } catch (error) {
                alert(`Links para compartilhar:\n${urls.join('\n')}`);
            }
        }

        cancelarModoSelecao();
    });

    // -----------------------------------------------------------------------
    // Álbuns e pastas
    // -----------------------------------------------------------------------

    function criarNovaPasta(nomePasta) {
        const nome = (nomePasta || '').trim();

        if (!nome) return null;

        const slug = nome
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '') || 'nova-pasta';

        const idAlbum = `album-${slug}`;
        const albumExistente = document.getElementById(idAlbum);

        if (albumExistente) {
            return { album: albumExistente, nome, criado: false };
        }

        const listaAlbuns = document.getElementById('lista-albuns');
        const fotoCapa = Array.from(fotosSelecionadas)[0]?.querySelector('img')?.src || 'https://picsum.photos/seed/default-album/400/500';
        const novoAlbum = document.createElement('li');
        novoAlbum.className = 'cartao-album';
        novoAlbum.id = idAlbum;
        novoAlbum.innerHTML = `
            <a href="#${idAlbum}" class="album-capa" aria-label="Abrir álbum ${nome}">
                <img src="${fotoCapa}" alt="Álbum ${nome}" loading="lazy" decoding="async">
                <span class="sombra-album" aria-hidden="true"></span>
                <span class="texto-album">
                    <strong class="nome-album">${nome}</strong>
                    <span class="contagem-album">0</span>
                </span>
            </a>
            <div class="album-conteudo">
                <header class="cabecalho-tela flex items-center gap-3 px-5 pt-7 pb-4 sm:px-8">
                    <a href="#" class="botao-voltar flex h-8 w-8 flex-shrink-0 items-center justify-center" aria-label="Fechar álbum">
                        <svg width="22" height="18" viewBox="0 0 22 18" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                            <path d="M0.6 9.7c-.4-.4-.4-1 0-1.4L7.9.6c.4-.4 1.1-.4 1.5 0 .4.4.4 1.1 0 1.5L4.4 7H20c.6 0 1 .4 1 1s-.4 1-1 1H4.4l5 4.9c.4.4.4 1.1 0 1.5-.4.4-1.1.4-1.5 0L.6 9.7z"/>
                        </svg>
                    </a>
                    <h1 class="titulo-tela text-lg font-bold sm:text-xl">${nome}</h1>
                </header>
                <ul class="grade-fotos grid grid-cols-4 gap-[3px]"></ul>
                <p class="contagem-itens px-5 pt-4 pb-8 text-sm sm:px-8">0 itens neste álbum.</p>
            </div>
        `;

        listaAlbuns.appendChild(novoAlbum);
        return { album: novoAlbum, nome, criado: true };
    }

    function moverFotosParaAlbum(albumId) {
        const albumDestino = document.getElementById(albumId);
        if (!albumDestino) return;

        const gradeDestino = albumDestino.querySelector('.grade-fotos');
        if (!gradeDestino) return;

        // A ação copia as fotos para o álbum e preserva as versões originais.
        Array.from(fotosSelecionadas).forEach((foto) => {
            const idFoto = foto.dataset.idFoto || `foto-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
            foto.dataset.idFoto = idFoto;

            if (gradeDestino.querySelector(`.foto-item[data-id-foto="${idFoto}"]`)) {
                return;
            }

            const fotoClon = foto.cloneNode(true);
            const inputAntigo = fotoClon.querySelector('input');
            const labelVisor = fotoClon.querySelector('.visor-foto');
            const labelMini = fotoClon.querySelector('.foto-miniatura');
            // Cada clone precisa de IDs próprios para não quebrar os labels e o visor.
            const novoId = inputAntigo ? `${inputAntigo.id}-${albumId}` : `${Date.now()}-${albumId}`;

            if (inputAntigo) inputAntigo.id = novoId;
            if (labelVisor) labelVisor.setAttribute('for', novoId);
            if (labelMini) labelMini.setAttribute('for', novoId);

            fotoClon.dataset.idFoto = idFoto;
            fotoClon.classList.remove('selecionada');
            gradeDestino.appendChild(fotoClon);
        });

        atualizarContagemTotal();
        atualizarContagemAlbum(albumDestino);
        bindFotoEvents();
        cancelarModoSelecao();
        fecharModalPastas();
        alert(`Fotos copiadas para a pasta "${albumDestino.querySelector('.nome-album')?.textContent || 'pasta'}"!`);
    }

    function fecharModalPastas() {
        const modal = document.getElementById('modal-pastas-selecao');
        if (modal) modal.remove();
    }

    // Monta o modal dinamicamente para listar pastas existentes ou criar uma nova.
    function abrirModalPastas() {
        const fotosParaMover = Array.from(fotosSelecionadas);
        if (!fotosParaMover.length) {
            alert('Selecione pelo menos uma foto para mover.');
            return;
        }

        const modalExistente = document.getElementById('modal-pastas-selecao');
        if (modalExistente) {
            modalExistente.remove();
        }

        const modal = document.createElement('div');
        modal.id = 'modal-pastas-selecao';
        modal.style.position = 'fixed';
        modal.style.inset = '0';
        modal.style.background = 'rgba(0,0,0,0.7)';
        modal.style.display = 'flex';
        modal.style.alignItems = 'center';
        modal.style.justifyContent = 'center';
        modal.style.zIndex = '9999';
        modal.style.padding = '20px';

        const painel = document.createElement('div');
        painel.style.width = 'min(420px, 100%)';
        painel.style.background = '#1c1c1e';
        painel.style.borderRadius = '16px';
        painel.style.padding = '20px';
        painel.style.color = '#fff';
        painel.style.boxShadow = '0 20px 50px rgba(0,0,0,0.45)';

        const titulo = document.createElement('h3');
        titulo.textContent = 'Escolha uma pasta';
        titulo.style.margin = '0 0 16px';
        titulo.style.fontSize = '22px';

        const lista = document.createElement('div');
        lista.style.display = 'grid';
        lista.style.gap = '10px';

        const pastas = Array.from(document.querySelectorAll('#lista-albuns .cartao-album'));

        if (!pastas.length) {
            const vazio = document.createElement('p');
            vazio.textContent = 'Nenhuma pasta criada ainda.';
            vazio.style.color = '#d4d4d8';
            lista.appendChild(vazio);
        } else {
            pastas.forEach((album) => {
                const nome = album.querySelector('.nome-album')?.textContent || 'Pasta';
                const botao = document.createElement('button');
                botao.type = 'button';
                botao.textContent = nome;
                botao.style.padding = '12px 14px';
                botao.style.borderRadius = '10px';
                botao.style.border = '1px solid rgba(255,255,255,0.1)';
                botao.style.background = '#2a2a2d';
                botao.style.color = '#fff';
                botao.style.textAlign = 'left';
                botao.style.cursor = 'pointer';
                botao.addEventListener('click', () => moverFotosParaAlbum(album.id));
                lista.appendChild(botao);
            });
        }

        const form = document.createElement('form');
        form.style.marginTop = '18px';
        form.style.display = 'grid';
        form.style.gap = '10px';

        const input = document.createElement('input');
        input.type = 'text';
        input.placeholder = 'Criar nova pasta';
        input.style.padding = '12px 14px';
        input.style.borderRadius = '10px';
        input.style.border = '1px solid rgba(255,255,255,0.15)';
        input.style.background = '#111';
        input.style.color = '#fff';

        const botaoCriar = document.createElement('button');
        botaoCriar.type = 'submit';
        botaoCriar.textContent = 'Criar e mover';
        botaoCriar.style.padding = '12px';
        botaoCriar.style.border = 'none';
        botaoCriar.style.borderRadius = '10px';
        botaoCriar.style.background = '#40afff';
        botaoCriar.style.color = '#fff';
        botaoCriar.style.cursor = 'pointer';

        form.appendChild(input);
        form.appendChild(botaoCriar);
        form.addEventListener('submit', (event) => {
            event.preventDefault();
            const nomeNovaPasta = input.value.trim();

            if (!nomeNovaPasta) {
                alert('Digite um nome para a pasta.');
                return;
            }

            const resultado = criarNovaPasta(nomeNovaPasta);
            if (!resultado || !resultado.album) {
                alert('Não foi possível criar a pasta.');
                return;
            }

            moverFotosParaAlbum(resultado.album.id);
        });

        const fechar = document.createElement('button');
        fechar.type = 'button';
        fechar.textContent = 'Fechar';
        fechar.style.marginTop = '18px';
        fechar.style.padding = '10px';
        fechar.style.border = '1px solid rgba(255,255,255,0.15)';
        fechar.style.borderRadius = '10px';
        fechar.style.background = 'transparent';
        fechar.style.color = '#fff';
        fechar.style.cursor = 'pointer';
        fechar.addEventListener('click', fecharModalPastas);

        painel.appendChild(titulo);
        painel.appendChild(lista);
        painel.appendChild(form);
        painel.appendChild(fechar);
        modal.appendChild(painel);

        modal.addEventListener('click', (event) => {
            if (event.target === modal) {
                fecharModalPastas();
            }
        });

        document.body.appendChild(modal);
        input.focus();
    }

    // -----------------------------------------------------------------------
    // Eventos globais e inicialização
    // -----------------------------------------------------------------------

    btnMover.addEventListener('click', abrirModalPastas);

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && modoSelecao) {
            cancelarModoSelecao();
        }
    });

    atribuirIdsUnicos();
    inicializarBotoesVisualizacao();
    bindFotoEvents();
    atualizarContagemTotal();
    contadorSelecao.textContent = '0 selecionadas';
});

/* Recebe as capturas do index.html e adiciona-as à galeria incorporada. */
window.addEventListener('message', (event) => {
    if (event.data?.tipo !== 'jovi-atualizar-galeria') return;

    const grade = document.getElementById('grade-fotos-recentes');
    if (!grade) return;

    const midias = Array.isArray(event.data.midias) ? event.data.midias : [];
    const existentes = new Set(
        Array.from(grade.querySelectorAll('[data-jovi-midia]')).map((item) => item.dataset.joviMidia)
    );

    midias.forEach((midia, indice) => {
        const id = `captura-${indice}`;
        if (!midia?.url || existentes.has(id)) return;

        const item = document.createElement('li');
        item.className = 'foto-item';
        item.dataset.joviMidia = id;

        const inputId = `${id}-input`;
        const input = document.createElement('input');
        input.type = 'checkbox';
        input.id = inputId;
        input.className = 'visor-input';

        const miniatura = document.createElement('label');
        miniatura.htmlFor = inputId;
        miniatura.className = 'foto-miniatura';

        const visor = document.createElement('label');
        visor.htmlFor = inputId;
        visor.className = 'visor-foto';
        visor.setAttribute('aria-label', 'Fechar mídia');

        const fechar = document.createElement('span');
        fechar.className = 'botao-fechar-visor';
        fechar.setAttribute('aria-hidden', 'true');
        fechar.textContent = '×';

        const criarElementoMidia = (emFoco) => {
            const elemento = document.createElement(midia.tipo === 'video' ? 'video' : 'img');
            elemento.src = midia.url;
            elemento.alt = `Mídia capturada ${indice + 1}`;

            if (midia.tipo === 'video') {
                elemento.muted = true;
                elemento.playsInline = true;
                elemento.controls = emFoco;
            } else if (!emFoco) {
                elemento.loading = 'lazy';
            }

            return elemento;
        };

        miniatura.appendChild(criarElementoMidia(false));
        visor.appendChild(fechar);
        visor.appendChild(criarElementoMidia(true));
        item.append(input, miniatura, visor);
        grade.prepend(item);
    });

    const contador = document.querySelector('.painel-fotos .contagem-itens');
    if (contador) {
        contador.textContent = `Você possui ${grade.children.length} itens.`;
    }
});