class Ambiente {
  constructor(enclosing = null) {
    this.valores = new Map();
    this.enclosing = enclosing;
  }

  definir(nome, valor) {
    this.valores.set(nome, valor);
  }

  obter(nomeToken) {
    if (this.valores.has(nomeToken.lexema)) {
      return this.valores.get(nomeToken.lexema);
    }

    if (this.enclosing !== null) {
      return this.enclosing.obter(nomeToken);
    }

    throw new Error(`Variável não definida '${nomeToken.lexema}'.`);
  }

  atribuir(nomeToken, valor) {
    if (this.valores.has(nomeToken.lexema)) {
      this.valores.set(nomeToken.lexema, valor);
      return;
    }

    if (this.enclosing !== null) {
      this.enclosing.atribuir(nomeToken, valor);
      return;
    }

    throw new Error(`Variável não definida '${nomeToken.lexema}'.`);
  }
}

class Funcao {
  constructor(declaracao) {
    this.declaracao = declaracao;
  }

  toString() {
    return `<funcao ${this.declaracao.nome.lexema}>`;
  }
}

class Retorno {
    constructor(valor) {
        this.valor = valor;
    }
}


export class Interpretador {
  constructor(eventosService) {
    this.eventosService = eventosService;
    this.variaveis = new Map();
  }

  interpretar(ast) {
    this.variaveis.clear();
    try {
      if (ast.tipo === "Modulo") {
        for (const comando of ast.corpo.declaracoes) {
          this.executarDeclaracao(comando);
        }
      } else {
        this.erro("AST inválida: tipo de raiz desconhecido");
      }
    } catch (erro) {
      this.erro(erro.message);
    }
  }

  _criarArrayMultidimensional(dimensoes) {
    if (dimensoes.length === 0) {
      return null; // Para variáveis simples
    }

    const criar = (dims) => {
      if (dims.length === 1) {
        return new Array(dims[0]).fill(null);
      }
      const tamanho = dims[0];
      const subDims = dims.slice(1);
      const arr = new Array(tamanho);
      for (let i = 0; i < tamanho; i++) {
        arr[i] = criar(subDims);
      }
      return arr;
    };

    return criar(dimensoes);
  }

  executarDeclaracao(declaracao) {
    if (!declaracao) return;

    switch (declaracao.tipo) {
      case "VarDeclaracoes":
        for (const variavel of declaracao.variaveis) {
          const valorInicial = this._criarArrayMultidimensional(variavel.dimensoes);
          this.variaveis.set(variavel.nome.lexema, valorInicial);
        }
        break;

      case "Expressao":
        this.avaliarExpressao(declaracao.expressao);
        break;

      case "Escreva":
        const valores = declaracao.expressoes.map(expr => {
            const valorAvaliado = this.avaliarExpressao(expr);
            // Converte null e undefined para uma representação em string para exibição
            if (valorAvaliado === null) return "nulo";
            if (valorAvaliado === undefined) return "indefinido";
            return valorAvaliado;
        });
        const linhaCompleta = valores.join("");
        this.exibirSaida(linhaCompleta);
        break;

      case "Se":
        this.executarSe(declaracao);
        break;

      case "Bloco":
        for (const cmd of declaracao.declaracoes) {
          this.executarDeclaracao(cmd);
        }
        break;

      case "Enquanto":
        this.executarEnquanto(declaracao);
        break;

      case "Para":
        this.executarPara(declaracao);
        break;

      case "Repita":
        this.executarRepita(declaracao);
        break;

      case "Ler":
        this.executarLeitura(declaracao.atribuicao);
        break;

      default:
        this.erro(`Declaração desconhecida: ${declaracao.tipo}`);
    }
  }

  executarPara(decl) {
    this.avaliarExpressao(decl.inicializacao);
    while (this.avaliarExpressao(decl.condicao)) {
      this.executarDeclaracao(decl.corpo); // Delega a execução do bloco
      this.avaliarExpressao(decl.incremento);
    }
  }
  
  executarSe(decl) {
    const condicao = this.avaliarExpressao(decl.condicao);
    const bloco = condicao ? decl.entao : decl.senao;
    if (bloco && bloco.declaracoes) {
      this.executarDeclaracao(bloco);
    }
  }

  //Adicao 02/07 método faltando em portugol
   executarEnquanto(decl) {
    while (this.avaliarExpressao(decl.condicao)) {
      this.executarDeclaracao(decl.corpo);
    }
  }

  avaliarExpressao(expr) {
    if (!expr) return null;

    switch (expr.tipo) {
      case "ExpParentizada":
        return this.avaliarExpressao(expr.grupo.expressao);

      case "Literal":
        return expr.valor;

      case "Variavel":
        return this.variaveis.get(expr.nome.lexema);

      case "VariavelArray": {
        let alvo = this.variaveis.get(expr.nome.lexema);
        if (!Array.isArray(alvo)) {
          this.erro(`Variável '${expr.nome.lexema}' não é um vetor ou matriz.`);
        }

        for (let i = 0; i < expr.indices.length; i++) {
          const indice = this.avaliarExpressao(expr.indices[i]);
          if (!Array.isArray(alvo) || indice < 0 || indice >= alvo.length) {
            this.erro(`Índice [${indice}] fora dos limites para a variável '${expr.nome.lexema}'.`);
          }
          alvo = alvo[indice];
        }
        return alvo;
      }

      case "Atribuicao":
        const valor = this.avaliarExpressao(expr.valor);
        this.variaveis.set(expr.nome.lexema, valor);
        return valor;

      case "AtribuicaoArray": {
        let alvo = this.variaveis.get(expr.nome.lexema);
        if (!Array.isArray(alvo)) {
          this.erro(`Variável '${expr.nome.lexema}' não é um vetor ou matriz.`);
        }

        for (let i = 0; i < expr.indices.length - 1; i++) {
          const indice = this.avaliarExpressao(expr.indices[i]);
          if (!Array.isArray(alvo) || indice < 0 || indice >= alvo.length) {
            this.erro(`Índice [${indice}] fora dos limites para a variável '${expr.nome.lexema}'.`);
          }
          alvo = alvo[indice];
        }

        const ultimoIndice = this.avaliarExpressao(expr.indices[expr.indices.length - 1]);
        if (!Array.isArray(alvo) || ultimoIndice < 0 || ultimoIndice >= alvo.length) {
          this.erro(`Índice final [${ultimoIndice}] fora dos limites para '${expr.nome.lexema}'.`);
        }
        
        const valorAtribuir = this.avaliarExpressao(expr.valor);
        alvo[ultimoIndice] = valorAtribuir;
        return valorAtribuir;
      }

      case "Binario":
        const esquerda = this.avaliarExpressao(expr.esquerda);
        const direita = this.avaliarExpressao(expr.direita);
        return this.avaliarOperacaoBinaria(expr.operador.tipo, esquerda, direita);

      default:
        this.erro(`Expressão desconhecida: ${expr.tipo}`);
    }
  }
  
  avaliarOperacaoBinaria(operadorTipo, esquerda, direita) {
    switch (operadorTipo) {
      case "MAIS": return esquerda + direita;
      case "MENOS": return esquerda - direita;
      case "ASTERISCO": return esquerda * direita;
      case "BARRA": return esquerda / direita;
      case "IGUAL": return esquerda == direita;
      case "DIFERENTE": return esquerda != direita;
      case "MAIOR_QUE": return esquerda > direita;
      case "MENOR_QUE": return esquerda < direita;
      case "MAIOR_IGUAL": return esquerda >= direita;
      case "MENOR_IGUAL": return esquerda <= direita;
      default:
        this.erro(`Operador binário não implementado: ${operadorTipo}`);
    }
  }

  exibirSaida(valor) {
    if (this.eventosService) {
      this.eventosService.notificar("ESCREVER", valor);
    } else {
      console.log(valor);
    }
  }

  erro(mensagem) {
    console.error("Erro de execução:", mensagem);
    if (this.eventosService) {
      this.eventosService.notificar("ERRO", mensagem);
    }
    throw new Error(mensagem);
  }
}