import * as Decl from './declaracao.js';
import * as Expr from './expressao.js';
import { TiposToken } from './tiposToken.js';

export class AnalisadorSintatico {
  constructor(eventosService) {
    this.eventosService = eventosService;
    this.tokens = [];
    this.index = 0;
  }
  // O Parse que vai gerar a AST arvore completa -- incluir variaveis, corpo e fim
  parse(tokens) {
  this.tokens = tokens;
  this.index = 0;

  try {
    // Caso comece com 'modulo' - estrutura completa
    if (this.isTokenTypeIgualA(TiposToken.TIPO_MODULO)) {
      return this.parseModulo();
    }
    
    // Caso seja um programa simples (sem módulo)
    return this.parseProgramaSimples();
    
  } catch (erro) {
    this.eventosService.notificar('ERRO', erro);
    return null;
  }
}
//23/06
parseModulo() {
  const nome = this.consumirToken(TiposToken.IDENTIFICADOR, 'Esperado nome do módulo');
  const declaracoes = [];
  
  // Seção de variáveis (opcional)
  if (this.checar(TiposToken.VARIAVEIS)) {
    this.avancar(); // Consome 'variaveis'
    
    while (!this.isFim() && !this.checar(TiposToken.INICIO)) {
      declaracoes.push(this.declaracaoVariaveis());
    }
  }

  this.consumirToken(TiposToken.INICIO, 'Esperado "inicio"');

  // Corpo do módulo
  while (!this.isFim() && !this.checar(TiposToken.FIM)) {
    const decl = this.declaracao();
    if (decl !== null) declaracoes.push(decl);
  }

  // Fechamento do módulo - modificado para aceitar apenas "fim"
  this.consumirToken(TiposToken.FIM, 'Esperado "fim"');
  
  // Remove a verificação de "modulo" após o "fim"
  // Ponto e vírgula final (opcional)
  if (this.checar(TiposToken.PONTO_VIRGULA)) {
    this.avancar();
  }

  return new Decl.Modulo(nome.linha, nome, new Decl.Bloco(nome.linha, declaracoes));
}

parseProgramaSimples() {
  const declaracoes = [];
  
  while (!this.isFim()) {
    // Trata declaração de variáveis soltas
    if (this.checar(TiposToken.VARIAVEIS)) {
      this.avancar();
      while (!this.isFim() && !this.checar(TiposToken.INICIO) && !this.checar(TiposToken.FIM)) {
        declaracoes.push(this.declaracaoVariaveis());
      }
      continue;
    }
    
    const decl = this.declaracao();
    if (decl !== null) declaracoes.push(decl);
  }
  
  // Cria um módulo implícito para o programa simples
  return new Decl.Modulo(1, { lexema: 'principal', linha: 1 }, new Decl.Bloco(1, declaracoes));
}

// Métodos auxiliares (mantidos da sua implementação original)
isFim() {
  return this.espiar().tipo === TiposToken.EOF;
}

espiar() {
  return this.tokens[this.index];
}

anterior() {
  return this.tokens[this.index - 1];
}

avancar() {
  console.log(`[Parser] Consumindo: ${this.anterior()?.tipo} ('${this.anterior()?.lexema}'), Próximo será: ${this.espiar().tipo} ('${this.espiar().lexema}')`);

  if (!this.isFim()) this.index++;
  return this.anterior();
}

checar(tipo) {
  if (this.isFim()) return false;
  return this.espiar().tipo === tipo;
}

  isTokenTypeIgualA(...tipos) {
    for (const tipo of tipos) {
      if (this.checar(tipo)) {
        this.avancar();
        return true;
      }
    }
    return false;
  }

  consumirToken(tipo, mensagem) {
    if (this.checar(tipo)) return this.avancar();
    throw this.erro(this.espiar(), mensagem);
  }

  erro(token, mensagem) {
    console.error(`[Linha ${token.linha}] Erro de sintaxe: ${mensagem}`);
    throw new Error(mensagem); // Força quebra da execução
  }
  

  // ---------- Regras ----------
  //23/06
// Em sintatico.js
declaracaoVariaveis() {
  const nomes = [];

  do {
    const nome = this.consumirToken(TiposToken.IDENTIFICADOR, 'Esperado nome da variável.');
    
    const dimensoes = []; // MODIFICADO: Inicia um array para as dimensões
    if (this.checar(TiposToken.ESQ_COLCHETE)) {
      this.avancar(); // consome [
      do { // Loop para ler múltiplas dimensões separadas por vírgula
        const valor = this.consumirToken(TiposToken.INTEIRO, 'Esperado tamanho inteiro da dimensão.');
        dimensoes.push(valor.literal);
      } while(this.isTokenTypeIgualA(TiposToken.VIRGULA));
      
      this.consumirToken(TiposToken.DIR_COLCHETE, 'Esperado "]" após a(s) dimensão(ões).');
    }

    nomes.push({ nome, dimensoes }); // MODIFICADO: salva o array de dimensões
  } while (this.isTokenTypeIgualA(TiposToken.VIRGULA));

  this.consumirToken(TiposToken.DOIS_PONTOS, 'Esperado ":" após o(s) nome(s)');
  const tipo = this.tipoDado();
  this.consumirToken(TiposToken.PONTO_VIRGULA, 'Esperado ";" após declaração.');

  const variaveis = nomes.map(entry => 
    // MODIFICADO: Passa o array de dimensões para o construtor
    new Decl.Var(entry.nome.linha, entry.nome, tipo, entry.dimensoes)
  );

  return new Decl.VarDeclaracoes(nomes[0].nome.linha, variaveis);
}
  
  




  
//23/06
  tipoDado() {
    if (
      this.isTokenTypeIgualA(
        TiposToken.TIPO_INTEIRO,
        TiposToken.TIPO_CADEIA,
        TiposToken.TIPO_CARACTERE,
        TiposToken.TIPO_LOGICO,
        TiposToken.TIPO_REAL,
        TiposToken.TIPO_MODULO,
        TiposToken.TIPO_VETOR
      )
    ) {
      return this.anterior();
    }
    throw this.erro(this.espiar(), 'Tipo inválido.');
  }


// -------------------------------------
// Declarações principais (corpo)
// -------------------------------------

declaracao() {
    try {
      console.log('Analisando token:', this.espiar());
      if (this.isTokenTypeIgualA(TiposToken.SE)) return this.seDeclaracao();
      if (this.isTokenTypeIgualA(TiposToken.PARA)) return this.paraDeclaracao();
      if (this.isTokenTypeIgualA(TiposToken.ENQUANTO)) return this.enquantoDeclaracao();
      if (this.isTokenTypeIgualA(TiposToken.REPITA)) return this.repitaDeclaracao();
      if (this.isTokenTypeIgualA(TiposToken.ESCREVER)) return this.escreverDeclaracao();
      if (this.isTokenTypeIgualA(TiposToken.LER)) return this.lerDeclaracao();
  
      return this.expressaoDeclaracao();
    } catch (err) {
      this.sincronizar();
      return null;
    }
  }
  
  bloco() {
    const declaracoes = [];
  
    while (
      !this.checar(TiposToken.FIM) &&
      !this.checar(TiposToken.SENAO) &&
      !this.checar(TiposToken.ATE) &&
      !this.isFim()
    ) {
      if (this.checar(TiposToken.VARIAVEIS)) {
        this.avancar(); // consome 'variaveis'
      
        while (this.checar(TiposToken.IDENTIFICADOR)) {
          const declaracao = this.declaracaoVariaveis();
          declaracoes.push(declaracao);
        }
        
        continue;
      }      
  
      const declaracao = this.declaracao();
      if (declaracao !== null) {
        declaracoes.push(declaracao);
      }
    }
  
    return declaracoes;
  }
  
  
  
  escreverDeclaracao() {
    const expressoes = [];
    do {
      expressoes.push(this.expressao());
    } while (this.isTokenTypeIgualA(TiposToken.VIRGULA));
    this.consumirToken(TiposToken.PONTO_VIRGULA, 'Esperado ";"');
    return new Decl.Escreva(this.anterior().linha, expressoes);
  }
  
  lerDeclaracao() {
    const expressao = this.ou();
    let retorno;
  
    if (expressao.tipo === 'VariavelArray') {
      const nome = expressao.nome;
      const index = expressao.index;
      retorno = new Decl.Ler(nome.linha, new Expr.AtribuicaoArray(nome.linha, nome, index, null));
    } else if (expressao.tipo === 'Variavel') {
      const nome = expressao.nome;
      retorno = new Decl.Ler(nome.linha, new Expr.Atribuicao(nome.linha, nome, null));
    } else {
      this.erro(this.anterior(), 'Esperado uma variável');
    }
  
    this.consumirToken(TiposToken.PONTO_VIRGULA, 'Esperado ";"');
    return retorno;
  }
  
  expressaoDeclaracao() {
    const expressao = this.expressao();
    this.consumirToken(TiposToken.PONTO_VIRGULA, 'Esperado ";"');
  
    // Se for só um identificador, pode ser chamada de módulo
    if (expressao.tipo === 'Variavel') {
      return new Decl.ChamadaModulo(expressao.linha, expressao.nome);
    }
  
    // Se for atribuição, ou expressão binária, ou qualquer outra, retorna normal
    return new Decl.Expressao(expressao.linha, expressao);
  }
  
//   ---------------------------------------
// EXPRESSOES ATRIBUIR, SOMAR, OU
// ---------------------------------------------
  expressao() {
    return this.atribuicao();
  }
  
  atribuicao() {
    const expr = this.ou();
    console.log("Expr no início de atribuição:", expr);
  
    if (this.isTokenTypeIgualA(TiposToken.ATRIBUICAO)) {
      const operador = this.anterior();
      const valor = this.atribuicao();
  
      if (expr.tipo === 'Variavel') {
        return new Expr.Atribuicao(expr.linha, expr.nome, valor);
      }
  
      if (expr.tipo === 'VariavelArray') {
        return new Expr.AtribuicaoArray(expr.linha, expr.nome, expr.indices, valor);
      }
  
      this.erro(operador, 'Atribuição inválida.');
    }
  
    return expr;
  }
  
  ou() {
    let expr = this.e();
  
    while (this.isTokenTypeIgualA(TiposToken.OU)) {
      const operador = this.anterior();
      const direita = this.e();
      expr = new Expr.Logico(operador.linha, expr, operador, direita);
    }
  
    return expr;
  }
  
  e() {
    let expr = this.igualdade();
  
    while (this.isTokenTypeIgualA(TiposToken.E)) {
      const operador = this.anterior();
      const direita = this.igualdade();
      expr = new Expr.Logico(operador.linha, expr, operador, direita);
    }
  
    return expr;
  }
  
  igualdade() {
    let expr = this.comparacao();
  
    while (this.isTokenTypeIgualA(TiposToken.IGUAL, TiposToken.DIFERENTE)) {
      const operador = this.anterior();
      const direita = this.comparacao();
      expr = new Expr.Binario(operador.linha, expr, operador, direita);
    }
  
    return expr;
  }
  
  comparacao() {
    let expr = this.adicao();
  
    while (
      this.isTokenTypeIgualA(
        TiposToken.MAIOR_QUE,
        TiposToken.MAIOR_IGUAL,
        TiposToken.MENOR_QUE,
        TiposToken.MENOR_IGUAL
      )
    ) {
      const operador = this.anterior();
      const direita = this.adicao();
      expr = new Expr.Binario(operador.linha, expr, operador, direita);
    }
  
    return expr;
  }
  
  adicao() {
    let expr = this.multiplicacao();
  
    while (this.isTokenTypeIgualA(TiposToken.MAIS, TiposToken.MENOS)) {
      const operador = this.anterior();
      const direita = this.multiplicacao();
      expr = new Expr.Binario(operador.linha, expr, operador, direita);
    }
  
    return expr;
  }
  
  multiplicacao() {
    let expr = this.unario();
  
    while (
      this.isTokenTypeIgualA(
        TiposToken.ASTERISCO,
        TiposToken.BARRA,
        TiposToken.RESTO,
        TiposToken.POTENCIA
      )
    ) {
      const operador = this.anterior();
      const direita = this.unario();
      expr = new Expr.Binario(operador.linha, expr, operador, direita);
    }
  
    return expr;
  }
  
  unario() {
    if (this.isTokenTypeIgualA(TiposToken.NAO, TiposToken.MENOS)) {
      const operador = this.anterior();
      const direita = this.unario();
      return new Expr.Unario(operador.linha, operador, direita);
    }
  
    return this.primario();
  }
  
  primario() {
    if (this.isTokenTypeIgualA(TiposToken.IDENTIFICADOR)) {
      const nome = this.anterior();
      console.log("Reconheceu variavel:", nome.lexema);
    
      // Verifica se é uma variável com índice (array)
      if (this.isTokenTypeIgualA(TiposToken.ESQ_COLCHETE)) {
        const indices = []; //Inicia com um array para os indices
        do{
          indices.push(this.ou());
        }while(this.isTokenTypeIgualA(TiposToken.VIRGULA));
        this.consumirToken(TiposToken.DIR_COLCHETE, 'Esperado "]"');
        return new Expr.VariavelArray(nome.linha, nome, indices);
      }
    
      return new Expr.Variavel(nome.linha, nome);
    }
      
  
    if (this.isTokenTypeIgualA(TiposToken.VERDADEIRO))
      return new Expr.Literal(this.anterior().linha, true, this.anterior());
  
    if (this.isTokenTypeIgualA(TiposToken.FALSO))
      return new Expr.Literal(this.anterior().linha, false, this.anterior());
  
    if (
      this.isTokenTypeIgualA(
        TiposToken.INTEIRO,
        TiposToken.REAL,
        TiposToken.CADEIA,
        TiposToken.CARACTERE
      )
    ) {
      const token = this.anterior();
      return new Expr.Literal(token.linha, token.literal, token);
    }
  
    if (this.isTokenTypeIgualA(TiposToken.ESQ_PARENTESES)) {
      const expr = this.expressao();
      this.consumirToken(TiposToken.DIR_PARENTESES, 'Esperado ")"');
      return new Expr.ExpParentizada(this.anterior().linha, new Expr.Grupo(this.anterior().linha, expr));
    }
  
    throw this.erro(this.espiar(), 'Esperado expressão.');
  }
  
// --------------------------------------------------------------------------
//   CONTROLE DE FLUXO(SE , ENQUANTO, PARA, REPITA)
//   ----------------------------------------------------------
seDeclaracao() {
    const condicao = this.ou();
    const inicio = this.consumirToken(TiposToken.ENTAO, 'Esperado "entao"');
    const entaoBloco = new Decl.Bloco(inicio.linha, this.bloco());
  
    let senaoBloco = null;
    if (this.isTokenTypeIgualA(TiposToken.SENAO)) {
      senaoBloco = new Decl.Bloco(this.anterior().linha, this.bloco());
    }
  
    this.consumirToken(TiposToken.FIM, 'Esperado "fim se"');
    this.consumirToken(TiposToken.SE, 'Esperado "fim se"');
    this.consumirToken(TiposToken.PONTO_VIRGULA, 'Esperado ";"');
  
    return new Decl.Se(inicio.linha, condicao, entaoBloco, senaoBloco);
  }
  
  enquantoDeclaracao() {
    const condicao = this.ou();
    const faca = this.consumirToken(TiposToken.FACA, 'Esperado "faca"');
    const corpo = new Decl.Bloco(faca.linha, this.bloco());
  
    this.consumirToken(TiposToken.FIM, 'Esperado "fim enquanto"');
    this.consumirToken(TiposToken.ENQUANTO, 'Esperado "fim enquanto"');
    this.consumirToken(TiposToken.PONTO_VIRGULA, 'Esperado ";"');
  
    return new Decl.Enquanto(faca.linha, condicao, corpo);
  }
  //23/06
  // Substitua a função inteira em sintatico.js
paraDeclaracao() {
  const identificador = this.consumirToken(TiposToken.IDENTIFICADOR, 'Esperado nome da variável de controle do laço PARA.');
  this.consumirToken(TiposToken.DE, 'Esperado "de" após o nome da variável.');
  const de = this.adicao();

  const linha = this.consumirToken(TiposToken.ATE, 'Esperado "ate" para definir o fim do laço.').linha;
  const ate = this.adicao();

  let passo = null;
  // Verifica se a cláusula PASSO existe. Se não, o padrão será 1.
  if (this.isTokenTypeIgualA(TiposToken.PASSO)) {
    passo = this.adicao();
  } else {
    // Cria um nó literal com o valor 1 para ser o passo padrão.
    passo = new Expr.Literal(linha, 1, { tipo: TiposToken.INTEIRO, literal: 1, linha });
  }

  this.consumirToken(TiposToken.FACA, 'Esperado "faca" para iniciar o bloco do laço.');
  const corpo = new Decl.Bloco(identificador.linha, this.bloco());

  // --- O restante do código transforma o "para" em uma estrutura que o interpretador já entende ---
  const varRef = new Expr.Variavel(identificador.linha, identificador);
  const inicial = new Expr.Atribuicao(identificador.linha, identificador, de);
  const condicao = new Expr.Binario(identificador.linha, varRef, {
    tipo: TiposToken.MENOR_IGUAL,
    lexema: '<=',
  }, ate);
  const incremento = new Expr.Atribuicao(
    identificador.linha,
    identificador,
    new Expr.Binario(identificador.linha, varRef, {
      tipo: TiposToken.MAIS,
      lexema: '+',
    }, passo)
  );

  this.consumirToken(TiposToken.FIM, 'Esperado "fim para" para fechar o laço.');
  this.consumirToken(TiposToken.PARA, 'Esperado "fim para" para fechar o laço.');
  this.consumirToken(TiposToken.PONTO_VIRGULA, 'Esperado ";" após "fim para".');

  return new Decl.Para(identificador.linha, inicial, condicao, incremento, corpo);
}
  repitaDeclaracao() {
    const inicio = this.anterior();
    const corpo = new Decl.Bloco(inicio.linha, this.bloco());
  
    this.consumirToken(TiposToken.ATE, 'Esperado "ate"');
    const condicao = this.ou();
    this.consumirToken(TiposToken.PONTO_VIRGULA, 'Esperado ";"');
  
    return new Decl.Repita(inicio.linha, corpo, condicao);
  }
  sincronizar() {
    this.avancar();
  
    while (!this.isFim()) {
      if (this.anterior().tipo === TiposToken.PONTO_VIRGULA) return;
  
      switch (this.espiar().tipo) {
        case TiposToken.VARIAVEIS:
        case TiposToken.INICIO:
        case TiposToken.FIM:
        case TiposToken.ENQUANTO:
        case TiposToken.PARA:
        case TiposToken.SE:
        case TiposToken.LER:
        case TiposToken.ESCREVER:
        case TiposToken.REPITA:
          return;
      }
  
      this.avancar();
    }
  }

  // Saber se o codigo em portugol está viavel, onde inicia e termina
  // responsavel por reconhcer os blocos do tipo Nome...Fim modulo
  // declaracaoModulo() {
  //   this.consumirToken(TiposToken.TIPO_MODULO, 'Esperado "modulo"');
  //   const nome = this.consumirToken(TiposToken.IDENTIFICADOR, 'Esperado nome do módulo');
  //   const corpo = new Decl.Bloco(nome.linha, this.bloco());
  
  //   this.consumirToken(TiposToken.FIM, 'Esperado "fim modulo"');
  //   this.consumirToken(TiposToken.TIPO_MODULO, 'Esperado "fim modulo"');
  //   this.consumirToken(TiposToken.PONTO_VIRGULA, 'Esperado ";"');
  
  //   return new Decl.Modulo(nome.linha, nome, corpo);
  // }
  // usado quando voce chama um modullo pelo nome ex meuModulo
  chamadaModulo(nome) {
    return new Decl.ChamadaModulo(nome.linha, nome);
  }
  
}