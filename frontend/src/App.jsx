import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

const API_URL = 'https://relatorios-pra-fju.onrender.com';

function App() {
  const [jovens, setJovens] = useState([]);
  const [abaAtiva, setAbaAtiva] = useState('relatorio');
  
  const [tipoDia, setTipoDia] = useState('QUARTA');
  const [dataRelatorio, setDataRelatorio] = useState(new Date().toISOString().split('T')[0]);
  const [presencas, setPresencas] = useState({}); 

  const [temaEncontro, setTemaEncontro] = useState('');
  const [batismoAguas, setBatismoAguas] = useState('Nao');
  const [batismoEspirito, setBatismoEspirito] = useState('Nao');
  const [liderAusente, setLiderAusente] = useState('Nao');
  const [qtdObreiros, setQtdObreiros] = useState('0');
  const [abordagemInterna, setAbordagemInterna] = useState('0');
  const [abordagemExterna, setAbordagemExterna] = useState('0');
  const [visitasSemana, setVisitasSemana] = useState('0');
  const [realizouEvg, setRealizouEvg] = useState('Sim');
  const [mensagensLigacoes, setMensagensLigacoes] = useState('0');
  const [jovensLimpeza, setJovensLimpeza] = useState('0');
  const [produtosLimpeza, setProdutosLimpeza] = useState('0');
  const [folhasOficio, setFolhasOficio] = useState('0');

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
    setTimeout(() => {
      setMensagemToast('');
    }, 3000);
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
    if (!novoNome) return alert('Digite o nome do jovem!');
    try {
      await axios.post(`${API_URL}/jovens`, {
        nome: novoNome,
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
    }
  };

  const handleTogglePresenca = (jovemId, status) => {
    setPresencas(prev => ({
      ...prev,
      [jovemId]: prev[jovemId] === status ? null : status
    }));
  };

  const salvarRelatorio = async () => {
    const listaPresencas = Object.entries(presencas)
      .filter(([_, status]) => status !== null)
      .map(([jovemId, status]) => ({ jovem_id: parseInt(jovemId), status }));

    if (listaPresencas.length === 0) {
      return alert('Marque pelo menos um jovem presente!');
    }

    try {
      await axios.post(`${API_URL}/relatorios`, {
        data: dataRelatorio,
        tipo_dia: tipoDia,
        presencas: listaPresencas
      });
      mostrarAviso('Relatório salvo no Banco de Dados!');
    } catch (error) {
      console.error('Erro ao salvar relatório:', error);
    }
  };

  // Ordena os jovens firmes colocando Valentina e Giuli sempre no topo
  const firmes = jovens
    .filter(j => j.categoria && j.categoria.toLowerCase().includes('firme') && !j.categoria.toLowerCase().includes('nao'))
    .sort((a, b) => {
      const nomeA = a.nome.toLowerCase();
      const nomeB = b.nome.toLowerCase();
      if (nomeA.includes('valentina')) return -1;
      if (nomeB.includes('valentina')) return 1;
      if (nomeA.includes('giuli')) return -1;
      if (nomeB.includes('giuli')) return 1;
      return nomeA.localeCompare(nomeB);
    });

  const naoFirmes = jovens.filter(j => j.categoria && (j.categoria.toLowerCase().includes('nao') || j.categoria.toLowerCase().includes('não')));

  const totalFirmes = Object.entries(presencas).filter(([id, status]) => {
    const j = jovens.find(item => item.id === parseInt(id));
    return j && j.categoria && j.categoria.toLowerCase().includes('firme') && !j.categoria.toLowerCase().includes('nao') && status;
  }).length;

  const totalNovosPresenca = Object.entries(presencas).filter(([_, status]) => status === 'Novo').length;
  const totalAfastadosPresenca = Object.entries(presencas).filter(([_, status]) => status === 'Afastado').length;
  const totalRetornando = Object.entries(presencas).filter(([_, status]) => status === 'Retornando').length;
  const totalFirmesExtra = Object.entries(presencas).filter(([id, status]) => {
    const j = jovens.find(item => item.id === parseInt(id));
    return j && j.categoria && (j.categoria.toLowerCase().includes('nao') || j.categoria.toLowerCase().includes('não')) && status === 'Firme';
  }).length;

  // Totais combinados para o relatório
  const totalFirmesGeral = totalFirmes + totalFirmesExtra;
  const totalNovosGeral = totalNovosPresenca;
  const totalAfastadosGeral = totalAfastadosPresenca;
  const totalTribo = totalNovosGeral + totalAfastadosGeral + totalRetornando + totalFirmesGeral + parseInt(qtdObreiros || 0);

  const gerarTextoRelatorio = () => {
    if (tipoDia === 'DOMINGO') {
      return (
        "🟢DOMINGO\n" +
        "Data: " + dataRelatorio + "\n\n" +
        "Tribo de Manassés\n" +
        "🕚Horário: 09h30\n" +
        "🤍Qt de novos: " + totalNovosGeral + "\n" +
        "🤍Qt de afastados: " + totalAfastadosGeral + "\n" +
        "🤍Qt de firmes: " + totalFirmesGeral + "\n" +
        "🤍 Qt de Obr: " + qtdObreiros + "\n" +
        "✅Qt total: " + (totalNovosGeral + totalAfastadosGeral + totalFirmesGeral + parseInt(qtdObreiros || 0)) + "\n\n" +
        "🌐Qtde total o dia todo: " + (totalNovosGeral + totalAfastadosGeral + totalFirmesGeral + parseInt(qtdObreiros || 0)) + "\n\n" +
        "-Alguém se batizou nas águas? " + batismoAguas + "\n" +
        "-Alguém foi batizado no Espírito Santo? " + batismoEspirito + "\n" +
        "- Líder/auxiliar ausente? " + liderAusente
      );
    } 
    else if (tipoDia === 'SABADO') {
      return (
        "Encontro jovem " + (temaEncontro ? "*" + temaEncontro + "*" : "*tema*") + ":\n\n" +
        "🔻Tribo de Manassés\n\n" +
        "▫️Novos: " + totalNovosGeral + "\n" +
        "▫️Afastados: " + totalAfastadosGeral + "\n" +
        "▫️Retornando: " + totalRetornando + "\n" +
        "▫️Firmes: " + totalFirmesGeral + "\n" +
        "▫️Obreiros: " + qtdObreiros + "\n" +
        "▫️Ab. Interna: " + abordagemInterna + "\n" +
        "▫️Ab. Externa: " + abordagemExterna + "\n" +
        "▫️Total da tribo: " + totalTribo + "\n\n" +
        "🔰 Visitas da semana: " + visitasSemana + "\n" +
        "🗣️ A tribo realizou evg? " + realizouEvg + "\n" +
        "📲 Qt. de mensagens/ligações: " + mensagensLigacoes + "\n" +
        "🪣 Qt. de jovens na limpeza: " + jovensLimpeza + "\n" +
        "🧹 Qt. de produtos de limpeza trazidos na semana: " + produtosLimpeza + "\n" +
        "🎞️ Qt. de folhas de ofício trazidas na semana: " + folhasOficio
      );
    } 
    else if (tipoDia === 'QUARTA') {
      return (
        "QUARTA-FEIRA / Escola da fé 🤓\n\n" +
        "🗓️ Data: " + dataRelatorio + "\n" +
        "📍 Tribo de Manassés\n" +
        "📍 Líder: Valentina\n" +
        "📍 Auxiliar: Giuli\n\n" +
        "📍 Qt de jovens na reunião das 19h\n\n" +
        "- Jovens novos: " + totalNovosGeral + "\n" +
        "- Jovens Afastados: " + totalAfastadosGeral + "\n" +
        "- Jovens firmes: " + totalFirmesGeral + "\n\n" +
        "Total: " + (totalNovosGeral + totalAfastadosGeral + totalFirmesGeral) + "\n" +
        "____________\n" +
        "Total de jovens em todos os horários: " + (totalNovosGeral + totalAfastadosGeral + totalFirmesGeral)
      );
    } 
    else {
      return (
        "ALGO A MAIS\n\n" +
        "🗓️ Data: " + dataRelatorio + "\n\n" +
        "📍 Tribo de Manassés\n" +
        "📍 Líder: Valentina\n\n" +
        "📍 Qt. total: " + (totalNovosGeral + totalAfastadosGeral + totalFirmesGeral) + "\n\n" +
        "- Qt. de novos: " + totalNovosGeral + "\n" +
        "- Qt. de afastados: " + totalAfastadosGeral + "\n" +
        "- Qt. de firmes: " + totalFirmesGeral
      );
    }
  };

  const copiarRelatorio = () => {
    const texto = gerarTextoRelatorio();
    navigator.clipboard.writeText(texto).then(() => {
      mostrarAviso('✨ Relatório copiado! Pronto para o WhatsApp.');
    }).catch(err => {
      console.error('Erro ao copiar:', err);
    });
  };

  return (
    <div className="notranslate" translate="no" style={{ padding: '15px', maxWidth: '850px', margin: '0 auto' }}>
      {mensagemToast && (
        <div className="toast-notification">
          {mensagemToast}
        </div>
      )}

      <header style={{ textAlign: 'center' }}>
        <h1>TRIBO DE MANASSÉS</h1>
        <p style={{ color: '#d4a338', fontFamily: 'Cinzel, serif', letterSpacing: '2px', marginTop: 0 }}>
          SISTEMA DE RELATÓRIOS FJU
        </p>
      </header>

      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '25px', gap: '15px' }}>
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
              <label style={{ display: 'block', marginBottom: '5px', color: '#e2b044' }}><strong>Data:</strong></label>
              <input type="date" value={dataRelatorio} onChange={e => setDataRelatorio(e.target.value)} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', color: '#e2b044' }}><strong>Reunião:</strong></label>
              <select value={tipoDia} onChange={e => setTipoDia(e.target.value)}>
                <option value="SEGUNDA">Segunda-feira (Algo a Mais)</option>
                <option value="QUARTA">Quarta-feira (Escola da Fé)</option>
                <option value="SABADO">Sábado (Encontro Jovem)</option>
                <option value="DOMINGO">Domingo (Reunião)</option>
              </select>
            </div>
          </div>

          {(tipoDia === 'SABADO' || tipoDia === 'DOMINGO') && (
            <div style={{ background: 'rgba(15, 35, 61, 0.7)', padding: '15px', borderRadius: '8px', marginBottom: '25px', border: '1px solid #b8861e' }}>
              <h4 style={{ margin: '0 0 15px 0' }}>Informações Especiais ({tipoDia === 'SABADO' ? 'Encontro Jovem' : 'Domingo'}):</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                {tipoDia === 'SABADO' && (
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ display: 'block', marginBottom: '3px', fontSize: '13px' }}>Tema do Encontro Jovem:</label>
                    <input type="text" value={temaEncontro} onChange={e => setTemaEncontro(e.target.value)} placeholder="Ex: A Escolha Certa" style={{ width: '100%' }} />
                  </div>
                )}
                <div>
                  <label style={{ display: 'block', marginBottom: '3px', fontSize: '13px' }}>Qtd de Obreiros:</label>
                  <input type="number" value={qtdObreiros} onChange={e => setQtdObreiros(e.target.value)} style={{ width: '100%' }} />
                </div>
                {tipoDia === 'SABADO' && (
                  <>
                    <div>
                      <label style={{ display: 'block', marginBottom: '3px', fontSize: '13px' }}>Abordagem Interna:</label>
                      <input type="number" value={abordagemInterna} onChange={e => setAbordagemInterna(e.target.value)} style={{ width: '100%' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '3px', fontSize: '13px' }}>Abordagem Externa:</label>
                      <input type="number" value={abordagemExterna} onChange={e => setAbordagemExterna(e.target.value)} style={{ width: '100%' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '3px', fontSize: '13px' }}>Visitas da Semana:</label>
                      <input type="number" value={visitasSemana} onChange={e => setVisitasSemana(e.target.value)} style={{ width: '100%' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '3px', fontSize: '13px' }}>Mensagens / Ligações:</label>
                      <input type="number" value={mensagensLigacoes} onChange={e => setMensagensLigacoes(e.target.value)} style={{ width: '100%' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '3px', fontSize: '13px' }}>Jovens na Limpeza:</label>
                      <input type="number" value={jovensLimpeza} onChange={e => setJovensLimpeza(e.target.value)} style={{ width: '100%' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '3px', fontSize: '13px' }}>Produtos de Limpeza:</label>
                      <input type="number" value={produtosLimpeza} onChange={e => setProdutosLimpeza(e.target.value)} style={{ width: '100%' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '3px', fontSize: '13px' }}>Folhas de Ofício:</label>
                      <input type="number" value={folhasOficio} onChange={e => setFolhasOficio(e.target.value)} style={{ width: '100%' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '3px', fontSize: '13px' }}>Realizou EVG?</label>
                      <select value={realizouEvg} onChange={e => setRealizouEvg(e.target.value)} style={{ width: '100%' }}>
                        <option value="Sim">Sim</option>
                        <option value="Não">Não</option>
                      </select>
                    </div>
                  </>
                )}
                {tipoDia === 'DOMINGO' && (
                  <>
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
                  </>
                )}
              </div>
            </div>
          )}

          <h3>⭐ Jovens Firmes ({firmes.length})</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '10px', marginBottom: '25px' }}>
            {firmes.map(j => (
              <div key={j.id} style={{ background: '#0e233d', padding: '10px', borderRadius: '6px', border: '1px solid #1e3a5f' }}>
                <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input 
                    type="checkbox" 
                    checked={!!presencas[j.id]} 
                    onChange={() => handleTogglePresenca(j.id, 'Presente')}
                    style={{ width: '18px', height: '18px', accentColor: '#d4a338' }}
                  />
                  <span><strong>{j.nome}</strong> {j.telefone && <small style={{ color: '#a0aec0', display: 'block' }}>{j.telefone}</small>}</span>
                </label>
              </div>
            ))}
          </div>

          <h3>📌 Não Firmes ({naoFirmes.length})</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '25px' }}>
            {naoFirmes.map(j => {
              const statusAtual = presencas[j.id];
              return (
                <div key={j.id} style={{ background: '#0e233d', padding: '12px', borderRadius: '6px', border: '1px solid #1e3a5f', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                  <span><strong>{j.nome}</strong> {j.telefone && <small style={{ color: '#a0aec0', marginLeft: '8px' }}>({j.telefone})</small>}</span>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    <button 
                      onClick={() => handleTogglePresenca(j.id, 'Afastado')}
                      className={`btn-status ${statusAtual === 'Afastado' ? 'btn-status-afastado' : 'btn-status-inactive'}`}
                    >
                      {statusAtual === 'Afastado' ? '[X] Afastado' : '[  ] Afastado'}
                    </button>
                    <button 
                      onClick={() => handleTogglePresenca(j.id, 'Novo')}
                      className={`btn-status ${statusAtual === 'Novo' ? 'btn-status-retornando' : 'btn-status-inactive'}`}
                    >
                      {statusAtual === 'Novo' ? '[X] Novo' : '[  ] Novo'}
                    </button>
                    <button 
                      onClick={() => handleTogglePresenca(j.id, 'Firme')}
                      className={`btn-status ${statusAtual === 'Firme' ? 'btn-status-afastado' : 'btn-status-inactive'}`}
                      style={statusAtual === 'Firme' ? { background: '#f3c660', color: '#050e18' } : {}}
                    >
                      {statusAtual === 'Firme' ? '[X] Firme' : '[  ] Firme'}
                    </button>
                    {tipoDia === 'SABADO' && (
                      <button 
                        onClick={() => handleTogglePresenca(j.id, 'Retornando')}
                        className={`btn-status ${statusAtual === 'Retornando' ? 'btn-status-retornando' : 'btn-status-inactive'}`}
                      >
                        {statusAtual === 'Retornando' ? '[X] Retornando' : '[  ] Retornando'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <hr style={{ borderColor: '#b8861e', margin: '30px 0', opacity: 0.4 }} />

          <div style={{ background: '#091728', padding: '20px', borderRadius: '8px', border: '1px solid #c89528' }}>
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
                📋 Copiar Relatório
              </button>
              <button 
                onClick={salvarRelatorio}
                style={{ flex: 1, padding: '14px', fontSize: '1rem', background: '#28a745', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontFamily: 'Cinzel, serif' }}
              >
                💾 Salvar no Banco
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="main-card">
          <h2>Cadastrar Novo Jovem</h2>
          <form onSubmit={handleCadastrarJovem} style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '450px', marginBottom: '30px' }}>
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
              <option value="Nao Firme">Não Firme (Afastado/Retornando)</option>
              <option value="Novo">Novo (Primeira vez)</option>
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

          <h3>Lista de Jovens Cadastrados ({jovens.length})</h3>
          <ul style={{ paddingLeft: '20px', color: '#e2e8f0' }}>
            {jovens.map(j => (
              <li key={j.id} style={{ marginBottom: '8px' }}>
                <strong style={{ color: '#e2b044' }}>{j.nome}</strong> <em>({j.categoria})</em> - {j.telefone || 'Sem telefone'} {j.notas && `| Obs: ${j.notas}`}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default App;