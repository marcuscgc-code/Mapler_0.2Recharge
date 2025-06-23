import { AnalisadorLexico } from './lexico.js';
import { AnalisadorSintatico } from './sintatico.js';
import { EventosService } from './eventosService.js';
import { Interpretador } from './interpretador.js';




const eventosService = new EventosService((tipo, mensagem) => {
  const consoleDiv = document.getElementById('saidaConsole');
  if (tipo === "ESCREVER") {
    consoleDiv.innerHTML += mensagem + "<br>";
  } else if (tipo === "ERRO") {
    alert("Erro: " + mensagem);
  }
});

const lexico = new AnalisadorLexico(eventosService);
const sintatico = new AnalisadorSintatico(eventosService);

// Função de interpretar
window.interpretar = function interpretar() {
  window.astGerado = null; // limpa AST anterior

  const editor = document.getElementById('codigoPortugol');
  const saida = document.getElementById('saida');
  const consoleDiv = document.getElementById('saidaConsole');

  saida.textContent = '';
  consoleDiv.innerHTML = '';

  try {
    const tokens = lexico.scanTokens(editor.value);
    const ast = sintatico.parse(tokens);
    console.log("AST:", ast);

    window.astGerado = ast;
    saida.textContent = JSON.stringify(ast, null, 2);
  } catch (e) {
    saida.textContent = `Erro inesperado: ${e.message}`;
  }
};

// Botão interpretar
document.getElementById('interpretarBtn').addEventListener('click', () => {
  window.interpretar();
});

// Botão executar
document.getElementById('executarBtn').addEventListener('click', () => {
  if (!window.astGerado) {
    alert('AST não gerada! Primeiro clique em Interpretar.');
    return;
  }

  document.getElementById('saidaConsole').innerHTML = '';

  // 🔧 Cria nova instância sempre ao clicar no botão
  const interpretador = new Interpretador(eventosService);
  interpretador.interpretar(window.astGerado);
});
