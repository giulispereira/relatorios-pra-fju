import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

const API_URL = window.location.hostname === 'localhost'
  ? 'http://localhost:5000'
  : 'https://relatorios-pra-fju.onrender.com';

function App() {
  const [jovens, setJovens] = useState([]);
  const [abaAtiva, setAbaAtiva] = useState('relatorio');
  const [tipoDia, setTipoDia] = useState('QUARTA');
  const [dataRelatorio, setDataRelatorio] = useState(new Date().toISOString().split('T')[0]);
  const [presencas, setPresencas] = useState({});

  // Campos extras de Sábado
  const [temaEncontro, setTemaEncontro] = useState('');
  const [abordagemInterna, setAbordagemInterna] = useState('0');
  const [abordagemExterna, setAbordagemExterna] = useState('20');
  const [visitasSemana, setVisitasSemana] = useState('0');
  const [realizouEvg, setRealizouEvg] = useState('Sim');
  const [mensagensLigacoes, setMensagensLigacoes] = useState('0');
  const [jovensLimpeza, setJovensLimpeza] = useState('0');
  const [produtosLimpeza, setProdutosLimpeza] = useState('0');
  const [folhasOficio, setFolhasOficio] = useState('0');

  // Campos extras de Domingo
  const [batismoAguas, setBatismoAguas] = useState('Não');
  const [batismoEspirito, setBatismoEspirito] = useState('Não');
  const [liderAusente, setLiderAusente] = useState('Não');

  // Cadastro de jovens
  const [mensagemToast, setMensagemToast] = useState('');
  const [novoNome, setNovoNome] = useState('');
  const [novoTelefone, setNovoTelefone] = useState('');
  const [novaCategoria, setNovaCategoria] = useState('Firme');
  const [novasNotas, setNovasNotas] = useState('');

  useEffect(() => {
    carregarJovens();
  }, []);

  const mostrarAviso = (msg) => {
    setMensagemToast(msg);
    setTimeout(() => setMensagemToast(''), 3000);
  };

  const carregarJovens = async () => {
    try {
      const response = await axios.get(`${API_URL}/jovens`);
      setJovens(response.data);
    } catch (error) {
      console.error('Erro ao carregar jovens:', error);
    }
  };

  const handleCadastrarJovem = async (e) => {
    e.preventDefault();
    if (!novoNome.trim()) return alert('Digite o nome do jovem!');
    try {
      await axios.post(`${API_URL}/jovens`, {
        nome: novoNome.trim(),
        telefone: novoTelefone,
        categoria: novaCategoria,
        notas: novasNotas
      });
      setNovoNome('');
      setNovoTelefone('');
      setNovasNotas('');
      carregarJovens();
      mostrarAviso('Jovem cadastrado com sucesso!');
    } catch (error) {
      console.error('Erro ao cadastrar jovem:', error);
      alert('Erro ao cadastrar jovem.');
    }
  };

  const deletarJovem = async (id, nome) => {
    if (!window.confirm(`Deseja realmente remover "${nome}" do sistema?`)) return;
    try {
      await axios.delete(`${API_URL}/jovens/${id}`);
      carregarJovens();
      mostrarAviso('Jovem removido com sucesso!');
    } catch (error) {
      console.error('Erro ao deletar jovem:', error);
      alert('Erro ao excluir o jovem.');
    }
  };

  // Marca/desmarca presença ou alterna horário (PRINCIPAL / OUTRO)
  const handleSetStatus = (jovemId, status, horario = 'PRINCIPAL') => {
    setPresencas(prev => {
      const atual = prev[jovemId];
      if (atual && atual.status === status && atual.horario === horario) {
        const copia = { ...prev };
        delete copia[jovemId];
        return copia;
      }
      return {
        ...prev,
        [jovemId]: { status, horario }
      };
    });
  };

  // Altera apenas o horário se o jovem já estiver marcado, ou marca com status padrão
  const handleMudarHorario = (jovemId, novoHorario, statusPadrao = 'Afastado') => {
    setPresencas(prev => {
      const atual = prev[jovemId];
      return {
        ...prev,
        [jovemId]: {
          status: atual ? atual.status : statusPadrao,
          horario: novoHorario
        }
      };
    });
  };

  const isQuartaOuDomingo = tipoDia === 'QUARTA' || tipoDia === 'DOMINGO';
  const permiteRetornando = tipoDia === 'SABADO' || tipoDia === 'PADRAO_NOMES';

  // Ordenação deixando a Líder Eduarda e a Auxiliar Valentina no topo de suas listas
  const ordenarLiderancaPrimeiro = (a, b) => {
    const nomeA = a.nome.toLowerCase();
    const nomeB = b.nome.toLowerCase();
    if (nomeA.includes('eduarda') || nomeA.includes('valentina')) return -1;
    if (nomeB.includes('eduarda') || nomeB.includes('valentina')) return 1;
    return nomeA.localeCompare(nomeB);
  };

  // Separação das listas por categoria cadastrada
  const obreiros = jovens
    .filter(j => j.categoria && j.categoria.toLowerCase().includes('obreiro'))
    .sort(ordenarLiderancaPrimeiro);

  const firmes = jovens
    .filter(j => {
      const cat = (j.categoria || '').toLowerCase();
      return cat.includes('firme') && !cat.includes('nao') && !cat.includes('não') && !cat.includes('obreiro');
    })
    .sort(ordenarLiderancaPrimeiro);

  const naoFirmes = jovens
    .filter(j => {
      const cat = (j.categoria || '').toLowerCase();
      return !cat.includes('obreiro') && (cat.includes('nao') || cat.includes('não') || cat.includes('novo'));
    })
    .sort((a, b) => a.nome.localeCompare(b.nome));

  // --- CÁLCULOS DOS RELATÓRIOS ---

  // 1. Obreiros
  const obreirosPresentes = Object.entries(presencas).filter(([id]) => {
    const j = jovens.find(item => item.id === parseInt(id));
    return j && (j.categoria || '').toLowerCase().includes('obreiro');
  });
  const totalObreirosPrincipal = obreirosPresentes.filter(([_, d]) => d.horario === 'PRINCIPAL').length;
  const totalObreirosGeral = obreirosPresentes.length;

  // 2. Firmes (cadastrados como Firmes)
  const firmesBasePresentes = Object.entries(presencas).filter(([id]) => {
    const j = jovens.find(item => item.id === parseInt(id));
    const cat = (j?.categoria || '').toLowerCase();
    return j && cat.includes('firme') && !cat.includes('nao') && !cat.includes('não') && !cat.includes('obreiro');
  });
  const totalFirmesBasePrincipal = firmesBasePresentes.filter(([_, d]) => d.horario === 'PRINCIPAL').length;
  const totalFirmesBaseGeral = firmesBasePresentes.length;

  // 3. Não Firmes marcados com status específico no dia
  const naoFirmesFirmePresentes = Object.entries(presencas).filter(([id, d]) => {
    const j = jovens.find(item => item.id === parseInt(id));
    const cat = (j?.categoria || '').toLowerCase();
    return j && !cat.includes('obreiro') && (cat.includes('nao') || cat.includes('não') || cat.includes('novo')) && d.status === 'Firme';
  });
  const totalNaoFirmesFirmePrincipal = naoFirmesFirmePresentes.filter(([_, d]) => d.horario === 'PRINCIPAL').length;
  const totalNaoFirmesFirmeGeral = naoFirmesFirmePresentes.length;

  const totalNovosPrincipal = Object.entries(presencas).filter(([_, d]) => d.status === 'Novo' && d.horario === 'PRINCIPAL').length;
  const totalNovosGeral = Object.entries(presencas).filter(([_, d]) => d.status === 'Novo').length;

  const totalAfastadosPrincipal = Object.entries(presencas).filter(([_, d]) => d.status === 'Afastado' && d.horario === 'PRINCIPAL').length;
  const totalAfastadosGeral = Object.entries(presencas).filter(([_, d]) => d.status === 'Afastado').length;

  const totalRetornandoGeral = Object.entries(presencas).filter(([_, d]) => d.status === 'Retornando').length;

  // Consolidação de Firmes (com e sem Obreiros)
  const firmesSemObreirosPrincipal = totalFirmesBasePrincipal + totalNaoFirmesFirmePrincipal;
  const firmesComObreirosPrincipal = firmesSemObreirosPrincipal + totalObreirosPrincipal;
  const firmesSemObreirosGeral = totalFirmesBaseGeral + totalNaoFirmesFirmeGeral;
  const firmesComObreirosGeral = firmesSemObreirosGeral + totalObreirosGeral;

  // Totais das reuniões
  const totalDomingoPrincipal = totalNovosPrincipal + totalAfastadosPrincipal + firmesSemObreirosPrincipal + totalObreirosPrincipal;
  const totalQuartaPrincipal = totalNovosPrincipal + totalAfastadosPrincipal + firmesComObreirosPrincipal;
  const totalSegundaGeral = totalNovosGeral + totalAfastadosGeral + firmesComObreirosGeral;
  const totalSabadoTribo = totalNovosGeral + totalAfastadosGeral + totalRetornandoGeral + firmesSemObreirosGeral + totalObreirosGeral;
  const totalGeralDia = Object.keys(presencas).length;

  // Formata data YYYY-MM-DD para DD/MM/AA
  const formatarDataBR = (isoDate) => {
    if (!isoDate) return '00/00/26';
    const [ano, mes, dia] = isoDate.split('-');
    return `${dia}/${mes}/${ano.slice(-2)}`;
  };

  // --- GERADOR DE TEXTO DO RELATÓRIO ---
  const gerarTextoRelatorio = () => {
    const dataFormatada = formatarDataBR(dataRelatorio);

    if (tipoDia === 'PADRAO_NOMES') {
      const listaFirmesNomes = [];
      const listaAfastadosNomes = [];
      const listaNovosNomes = [];
      const listaRetornandoNomes = [];
      const listaObreirosNomes = [];

      Object.entries(presencas).forEach(([id, dados]) => {
        const j = jovens.find(item => item.id === parseInt(id));
        if (!j) return;
        const cat = (j.categoria || '').toLowerCase();

        if (cat.includes('obreiro')) {
          listaObreirosNomes.push(j.nome);
        } else if (dados.status === 'Afastado') {
          listaAfastadosNomes.push(j.nome);
        } else if (dados.status === 'Novo') {
          listaNovosNomes.push(j.nome);
        } else if (dados.status === 'Retornando') {
          listaRetornandoNomes.push(j.nome);
        } else {
          listaFirmesNomes.push(j.nome);
        }
      });

      return (
        `Firmes: ${listaFirmesNomes.join(', ')}\n` +
        `Afastados: ${listaAfastadosNomes.join(', ')}\n` +
        `Novos: ${listaNovosNomes.join(', ')}\n` +
        `Retornando: ${listaRetornandoNomes.join(', ')}\n` +
        `Obreiros: ${listaObreirosNomes.join(', ')}`
      );
    }

    if (tipoDia === 'DOMINGO') {
      return (
        `🟢DOMINGO\n` +
        `Data: ${dataFormatada}\n` +
        `Tribo de Manassés\n` +
        `🕚Horário: 09h30\n` +
        `🤍Qt de novos: ${totalNovosPrincipal}\n` +
        `🤍Qt de afastados: ${totalAfastadosPrincipal}\n` +
        `🤍Qt de firmes: ${firmesSemObreirosPrincipal}\n` +
        `🤍 Qt de Obr: ${totalObreirosPrincipal}\n` +
        `✅Qt total: ${totalDomingoPrincipal}\n\n` +
        `🌐Qtde total o dia todo: ${totalGeralDia}\n\n` +
        `-Alguém se batizou nas águas? ${batismoAguas}\n` +
        `-Alguém foi batizado no Espírito Santo? ${batismoEspirito}\n` +
        `- Líder/auxiliar ausente? ${liderAusente}`
      );
    }

    if (tipoDia === 'SABADO') {
      return (
        `Encontro jovem ${temaEncontro ? `*${temaEncontro}*` : ''}:\n\n` +
        `🔻Tribo de Manassés\n` +
        `▫️Novos: ${totalNovosGeral}\n` +
        `▫️Afastados: ${totalAfastadosGeral}\n` +
        `▫️Retornando: ${totalRetornandoGeral}\n` +
        `▫️Firmes: ${firmesSemObreirosGeral}\n` +
        `▫️Obreiros: ${totalObreirosGeral}\n` +
        `▫️Ab. Interna: ${abordagemInterna}\n` +
        `▫️Ab. Externa: ${abordagemExterna}\n` +
        `▫️Total da tribo: ${totalSabadoTribo}\n\n` +
        `🔰 Visitas da semana: ${visitasSemana}\n` +
        `🗣️ A tribo realizou evg? ${realizouEvg}\n` +
        `📲 Qt. de mensagens/ligações: ${mensagensLigacoes}\n` +
        `🪣 Qt. de jovens na limpeza: ${jovensLimpeza}\n` +
        `🧹 Qt. de produtos de limpeza trazidos na semana: ${produtosLimpeza}\n` +
        `🎞️ Qt. de folhas de ofício trazidas na semana: ${folhasOficio}`
      );
    }

    if (tipoDia === 'QUARTA') {
      return (
        `QUARTA-FEIRA/Escola da fé 🤓🙏🏽\n\n` +
        `🗓️Data: ${dataFormatada}\n` +
        `📍 Tribo de Manassés\n` +
        `📍 Líder: Eduarda\n` +
        `📍 Auxiliar: Valentina\n\n` +
        `📍 Qt de jovens na reunião das 19h\n\n` +
        `- Jovens novos: ${totalNovosPrincipal}\n` +
        `- Jovens firmes: ${firmesComObreirosPrincipal}\n` +
        `- Jovens Afastados: ${totalAfastadosPrincipal}\n\n` +
        `Total: ${totalQuartaPrincipal}\n` +
        `____________\n` +
        `Total de jovens em todos os horários: ${totalGeralDia}`
      );
    }

    // SEGUNDA (ALGO A MAIS) - Líder Eduarda e Obreiros entram na contagem de Firmes
    return (
      `ALGO A MAIS\n\n` +
      `🗓️ Data: ${dataFormatada}\n` +
      `📍Tribo de Manassés\n` +
      `📍 Líder: Eduarda\n` +
      `📍Qt. total: ${totalSegundaGeral}\n\n` +
      `- Qt. de novos: ${totalNovosGeral}\n` +
      `- Qt. de afastados: ${totalAfastadosGeral}\n` +
      `- Qt. de firmes: ${firmesComObreirosGeral}`
    );
  };

  const copiarRelatorio = () => {
    const texto = gerarTextoRelatorio();
    navigator.clipboard.writeText(texto).then(() => {
      mostrarAviso('Relatório copiado! Pronto para o WhatsApp.');
    }).catch(err => console.error('Erro ao copiar:', err));
  };

  return (
    <div style={{ padding: '15px', maxWidth: '900px', margin: '0 auto' }}>
      {mensagemToast && <div className="toast-notification">{mensagemToast}</div>}

      <header style={{ textAlign: 'center' }}>
        <h1>TRIBO DE MANASSÉS</h1>
        <p style={{ color: '#d4a338', fontFamily: 'Cinzel, serif', letterSpacing: '2px', marginTop: 0 }}>
          SISTEMA DE RELATÓRIOS FJU
        </p>
      </header>

      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '25px', gap: '15px', flexWrap: 'wrap' }}>
        <button
          onClick={() => setAbaAtiva('relatorio')}
          className={`tab-button ${abaAtiva === 'relatorio' ? 'active' : ''}`}
        >
          Check-list Diário
        </button>
        <button
          onClick={() => setAbaAtiva('jovens')}
          className={`tab-button ${abaAtiva === 'jovens' ? 'active' : ''}`}
        >
          Gerenciar Jovens
        </button>
      </div>

      {abaAtiva === 'relatorio' ? (
        <div className="main-card">
          <h2>Relatório do Dia</h2>

          <div style={{ display: 'flex', gap: '20px', marginBottom: '25px', flexWrap: 'wrap' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px' }}><strong>Data:</strong></label>
              <input
                type="date"
                value={dataRelatorio}
                onChange={e => setDataRelatorio(e.target.value)}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px' }}><strong>Reunião:</strong></label>
              <select value={tipoDia} onChange={e => setTipoDia(e.target.value)}>
                <option value="SEGUNDA">Segunda-feira (Algo a Mais)</option>
                <option value="QUARTA">Quarta-feira (Escola da Fé)</option>
                <option value="SABADO">Sábado (Encontro Jovem)</option>
                <option value="DOMINGO">Domingo (Reunião)</option>
                <option value="PADRAO_NOMES">Relatório Padrão (Lista por Nomes)</option>
              </select>
            </div>
          </div>

          {/* INFORMAÇÕES EXTRAS DE SÁBADO */}
          {tipoDia === 'SABADO' && (
            <div style={{ background: 'rgba(15, 35, 61, 0.7)', padding: '15px', borderRadius: '18px', marginBottom: '25px', border: '1px solid #b8861e' }}>
              <h4 style={{ margin: '0 0 15px 0' }}>Informações do Encontro Jovem:</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', marginBottom: '3px', fontSize: '13px' }}>Tema do Encontro:</label>
                  <input
                    type="text"
                    value={temaEncontro}
                    onChange={e => setTemaEncontro(e.target.value)}
                    placeholder="Ex: A Escolha Certa"
                    style={{ width: '100%', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '3px', fontSize: '13px' }}>Abordagem Interna:</label>
                  <input type="number" value={abordagemInterna} onChange={e => setAbordagemInterna(e.target.value)} style={{ width: '100%', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '3px', fontSize: '13px' }}>Abordagem Externa:</label>
                  <input type="number" value={abordagemExterna} onChange={e => setAbordagemExterna(e.target.value)} style={{ width: '100%', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '3px', fontSize: '13px' }}>Visitas da Semana:</label>
                  <input type="number" value={visitasSemana} onChange={e => setVisitasSemana(e.target.value)} style={{ width: '100%', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '3px', fontSize: '13px' }}>Realizou EVG?</label>
                  <select value={realizouEvg} onChange={e => setRealizouEvg(e.target.value)} style={{ width: '100%' }}>
                    <option value="Sim">Sim</option>
                    <option value="Não">Não</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '3px', fontSize: '13px' }}>Mensagens / Ligações:</label>
                  <input type="number" value={mensagensLigacoes} onChange={e => setMensagensLigacoes(e.target.value)} style={{ width: '100%', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '3px', fontSize: '13px' }}>Jovens na Limpeza:</label>
                  <input type="number" value={jovensLimpeza} onChange={e => setJovensLimpeza(e.target.value)} style={{ width: '100%', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '3px', fontSize: '13px' }}>Produtos de Limpeza:</label>
                  <input type="number" value={produtosLimpeza} onChange={e => setProdutosLimpeza(e.target.value)} style={{ width: '100%', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '3px', fontSize: '13px' }}>Folhas de Ofício:</label>
                  <input type="number" value={folhasOficio} onChange={e => setFolhasOficio(e.target.value)} style={{ width: '100%', boxSizing: 'border-box' }} />
                </div>
              </div>
            </div>
          )}

          {/* INFORMAÇÕES EXTRAS DE DOMINGO */}
          {tipoDia === 'DOMINGO' && (
            <div style={{ background: 'rgba(15, 35, 61, 0.7)', padding: '15px', borderRadius: '18px', marginBottom: '25px', border: '1px solid #b8861e' }}>
              <h4 style={{ margin: '0 0 15px 0' }}>Informações de Domingo:</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '3px', fontSize: '13px' }}>Batismo nas Águas?</label>
                  <select value={batismoAguas} onChange={e => setBatismoAguas(e.target.value)} style={{ width: '100%' }}>
                    <option value="Não">Não</option>
                    <option value="Sim">Sim</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '3px', fontSize: '13px' }}>Batismo no Espírito Santo?</label>
                  <select value={batismoEspirito} onChange={e => setBatismoEspirito(e.target.value)} style={{ width: '100%' }}>
                    <option value="Não">Não</option>
                    <option value="Sim">Sim</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '3px', fontSize: '13px' }}>Líder/Auxiliar Ausente?</label>
                  <select value={liderAusente} onChange={e => setLiderAusente(e.target.value)} style={{ width: '100%' }}>
                    <option value="Não">Não</option>
                    <option value="Sim">Sim</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* SEÇÃO: OBREIROS */}
          {obreiros.length > 0 && (
            <>
              <h3>OBREIROS ({obreiros.length})</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: '30px' }}>
                {obreiros.map(j => {
                  const marcacao = presencas[j.id];
                  return (
                    <div
                      key={j.id}
                      className="jovem-card"
                      style={{
                        background: '#0a1d33',
                        padding: '10px 12px',
                        borderRadius: '18px',
                        border: '1px solid #1e3a5f',
                        textAlign: 'left'
                      }}
                    >
                      <strong style={{ display: 'block', fontSize: '0.95rem', color: '#f3c660', marginBottom: '6px' }}>
                        {j.nome}
                      </strong>
                      {isQuartaOuDomingo ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '11px' }}>
                          <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <input
                              type="checkbox"
                              checked={marcacao?.horario === 'PRINCIPAL'}
                              onChange={() => handleSetStatus(j.id, 'Obreiro', 'PRINCIPAL')}
                            /> Reunião Principal
                          </label>
                          <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <input
                              type="checkbox"
                              checked={marcacao?.horario === 'OUTRO'}
                              onChange={() => handleSetStatus(j.id, 'Obreiro', 'OUTRO')}
                            /> Outro
                          </label>
                        </div>
                      ) : (
                        <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
                          <input
                            type="checkbox"
                            checked={!!marcacao}
                            onChange={() => handleSetStatus(j.id, 'Obreiro', 'PRINCIPAL')}
                          /> Marcar Presença
                        </label>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* SEÇÃO: JOVENS FIRMES */}
          <h3>JOVENS FIRMES ({firmes.length})</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: '30px' }}>
            {firmes.map(j => {
              const marcacao = presencas[j.id];
              return (
                <div
                  key={j.id}
                  className="jovem-card"
                  style={{
                    background: '#0a1d33',
                    padding: '10px 12px',
                    borderRadius: '18px',
                    border: '1px solid #1e3a5f',
                    textAlign: 'left'
                  }}
                >
                  <strong style={{ display: 'block', fontSize: '0.95rem', color: '#f3c660', marginBottom: '6px' }}>
                    {j.nome}
                  </strong>
                  {isQuartaOuDomingo ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '11px' }}>
                      <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <input
                          type="checkbox"
                          checked={marcacao?.horario === 'PRINCIPAL'}
                          onChange={() => handleSetStatus(j.id, 'Presente', 'PRINCIPAL')}
                        /> Reunião Principal
                      </label>
                      <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <input
                          type="checkbox"
                          checked={marcacao?.horario === 'OUTRO'}
                          onChange={() => handleSetStatus(j.id, 'Presente', 'OUTRO')}
                        /> Outro
                      </label>
                    </div>
                  ) : (
                    <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
                      <input
                        type="checkbox"
                        checked={!!marcacao}
                        onChange={() => handleSetStatus(j.id, 'Presente', 'PRINCIPAL')}
                      /> Marcar Presença
                    </label>
                  )}
                </div>
              );
            })}
          </div>

          {/* SEÇÃO: NÃO FIRMES */}
          <h3>NÃO FIRMES ({naoFirmes.length})</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '25px' }}>
            {naoFirmes.map(j => {
              const marcacao = presencas[j.id];
              const horarioAtual = marcacao?.horario || 'PRINCIPAL';

              return (
                <div
                  key={j.id}
                  className="jovem-card"
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '10px',
                    textAlign: 'left',
                    background: '#0a1d33',
                    padding: '12px 14px',
                    borderRadius: '18px',
                    border: '1px solid #1e3a5f'
                  }}
                >
                  <div>
                    <strong style={{ fontSize: '1rem', color: '#f3c660' }}>{j.nome}</strong>
                    {isQuartaOuDomingo && (
                      <div style={{ display: 'flex', gap: '10px', fontSize: '12px', marginTop: '4px' }}>
                        <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <input
                            type="radio"
                            name={`horario_${j.id}`}
                            checked={horarioAtual === 'PRINCIPAL'}
                            onChange={() => handleMudarHorario(j.id, 'PRINCIPAL')}
                          /> Reunião Principal
                        </label>
                        <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <input
                            type="radio"
                            name={`horario_${j.id}`}
                            checked={horarioAtual === 'OUTRO'}
                            onChange={() => handleMudarHorario(j.id, 'OUTRO')}
                          /> Outro
                        </label>
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <button
                      onClick={() => handleSetStatus(j.id, 'Afastado', horarioAtual)}
                      className={`btn-status ${marcacao?.status === 'Afastado' ? 'btn-status-afastado' : 'btn-status-inactive'}`}
                    >
                      {marcacao?.status === 'Afastado' ? '[X] Afastado' : '[ ] Afastado'}
                    </button>

                    <button
                      onClick={() => handleSetStatus(j.id, 'Novo', horarioAtual)}
                      className={`btn-status ${marcacao?.status === 'Novo' ? 'btn-status-retornando' : 'btn-status-inactive'}`}
                    >
                      {marcacao?.status === 'Novo' ? '[X] Novo' : '[ ] Novo'}
                    </button>

                    {permiteRetornando && (
                      <button
                        onClick={() => handleSetStatus(j.id, 'Retornando', horarioAtual)}
                        className={`btn-status ${marcacao?.status === 'Retornando' ? 'btn-status-retornando' : 'btn-status-inactive'}`}
                      >
                        {marcacao?.status === 'Retornando' ? '[X] Retornando' : '[ ] Retornando'}
                      </button>
                    )}

                    <button
                      onClick={() => handleSetStatus(j.id, 'Firme', horarioAtual)}
                      className={`btn-status ${marcacao?.status === 'Firme' ? 'btn-status-afastado' : 'btn-status-inactive'}`}
                      style={marcacao?.status === 'Firme' ? { background: '#f3c660', color: '#050e18' } : {}}
                    >
                      {marcacao?.status === 'Firme' ? '[X] Firme' : '[ ] Firme'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <hr style={{ borderColor: '#b8861e', margin: '30px 0', opacity: 0.4 }} />

          <div style={{ background: '#091728', padding: '20px', borderRadius: '18px', border: '1px solid #c89528' }}>
            <h3 style={{ marginTop: 0 }}>Relatório Pronto:</h3>
            <pre className="whatsapp-box" style={{ whiteSpace: 'pre-wrap' }}>
              {gerarTextoRelatorio()}
            </pre>
            <div style={{ display: 'flex', gap: '10px', marginTop: '15px', flexWrap: 'wrap' }}>
              <button
                onClick={copiarRelatorio}
                className="tab-button active"
                style={{ flex: 1, padding: '14px', fontSize: '1rem' }}
              >
                Copiar Relatório
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="main-card">
          <h2>Cadastrar Novo Jovem</h2>
          <form onSubmit={handleCadastrarJovem} style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '450px', margin: '0 auto 30px auto' }}>
            <input
              type="text"
              placeholder="Nome Completo"
              value={novoNome}
              onChange={e => setNovoNome(e.target.value)}
              required
            />
            <input
              type="text"
              placeholder="Telefone (WhatsApp)"
              value={novoTelefone}
              onChange={e => setNovoTelefone(e.target.value)}
            />
            <select value={novaCategoria} onChange={e => setNovaCategoria(e.target.value)}>
              <option value="Firme">Firme</option>
              <option value="Nao Firme">Não Firme (Afastado/Retornando/Novo)</option>
              <option value="Obreiro">Obreiro</option>
            </select>
            <textarea
              placeholder="Observações sobre o jovem..."
              value={novasNotas}
              onChange={e => setNovasNotas(e.target.value)}
              rows="3"
            />
            <button type="submit" className="tab-button active" style={{ padding: '10px' }}>
              Adicionar Jovem
            </button>
          </form>

          <h3 style={{ color: '#e2b044' }}>Lista de Jovens Cadastrados ({jovens.length})</h3>
          <ul style={{ paddingLeft: 0, listStyle: 'none', color: '#e2e8f0' }}>
            {jovens.map(j => (
              <li
                key={j.id}
                style={{
                  marginBottom: '10px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: '#0a1d33',
                  padding: '12px 16px',
                  borderRadius: '16px',
                  border: '1px solid #1e3a5f',
                  textAlign: 'left'
                }}
              >
                <div>
                  <strong style={{ color: '#e2b044' }}>{j.nome}</strong>{' '}
                  <em>({j.categoria})</em>{' '}
                  {j.notas && `| Obs: ${j.notas}`}
                </div>
                <button
                  onClick={() => deletarJovem(j.id, j.nome)}
                  style={{
                    background: '#d9534f',
                    color: '#fff',
                    border: 'none',
                    padding: '6px 12px',
                    borderRadius: '14px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}
                >
                  Excluir
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default App;