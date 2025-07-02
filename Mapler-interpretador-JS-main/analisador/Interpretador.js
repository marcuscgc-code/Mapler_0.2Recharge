// Adicione estas classes auxiliares no topo do arquivo
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
  constructor(declaracao, ambienteFechado) {
    this.declaracao = declaracao;
    this.ambienteFechado = ambienteFechado; // O ambiente onde a função foi declarada
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

// Substitua sua classe Interpretador inteira por esta
export class Interpretador {
  constructor(eventosService) {
    this.eventosService = eventosService;
    this.ambienteGlobal = new Ambiente();
    this.ambiente = this.ambienteGlobal;
  }

  interpretar(declaracoes) {
    try {
      for (const declaracao of declaracoes) {
        this.executarDeclaracao(declaracao);
      }
    } catch (erro) {
      if (erro instanceof Retorno) {
          // Um 'retorne' no escopo global não faz nada.
      } else {
        this.erro(erro.message);
      }
    }
  }

  executarBloco(declaracoes, ambiente) {
    const ambienteAnterior = this.ambiente;
    try {
      this.ambiente = ambiente;
      for (const declaracao of declaracoes) {
        this.executarDeclaracao(declaracao);
      }
    } finally {
      this.ambiente = ambienteAnterior; // Restaura o ambiente anterior
    }
  }

  _criarArrayMultidimensional(dimensoes) {
    if (dimensoes.length === 0) return null;
    const criar = (dims) => {
      if (dims.length === 1) return new Array(dims[0]).fill(null);
      const arr = new Array(dims[0]);
      for (let i = 0; i < arr.length; i++) {
        arr[i] = criar(dims.slice(1));
      }
      return arr;
    };
    return criar(dimensoes);
  }

  executarDeclaracao(declaracao) {
    if (!declaracao) return;

    switch (declaracao.tipo) {
      case "FuncaoDeclaracao":
        const funcao = new Funcao(declaracao, this.ambiente);
        this.ambiente.definir(declaracao.nome.lexema, funcao);
        break;

      case "Retorne":
        let valorRetorno = null;
        if (declaracao.valor !== null) {
            valorRetorno = this.avaliarExpressao(declaracao.valor);
        }
        throw new Retorno(valorRetorno);
        
      case "VarDeclaracoes":
        for (const variavel of declaracao.variaveis) {
          const valorInicial = this._criarArrayMultidimensional(variavel.dimensoes);
          this.ambiente.definir(variavel.nome.lexema, valorInicial);
        }
        break;

      case "Expressao":
        this.avaliarExpressao(declaracao.expressao);
        break;

      case "Escreva":
        const valores = declaracao.expressoes.map(expr => this.avaliarExpressao(expr));
        const linhaCompleta = valores.map(v => (v === null ? "nulo" : v)).join("");
        this.exibirSaida(linhaCompleta);
        break;

      case "Se":
        if (this.avaliarExpressao(declaracao.condicao)) {
            this.executarDeclaracao(declaracao.entao);
        } else if (declaracao.senao !== null) {
            this.executarDeclaracao(declaracao.senao);
        }
        break;
      
      case "Bloco":
          this.executarBloco(declaracao.declaracoes, new Ambiente(this.ambiente));
          break;

      case "Enquanto":
        while (this.avaliarExpressao(declaracao.condicao)) {
          this.executarDeclaracao(declaracao.corpo);
        }
        break;

      case "Para":
        // O escopo do 'para' cria um ambiente próprio
        const ambientePara = new Ambiente(this.ambiente);
        this.executarBloco([declaracao.inicializacao], ambientePara);
        while (this.avaliarExpressao(declaracao.condicao)) {
          this.executarBloco(declaracao.corpo.declaracoes, new Ambiente(ambientePara));
          this.avaliarExpressao(declaracao.incremento);
        }
        break;
      
      default:
        this.erro(`Declaração desconhecida: ${declaracao.tipo}`);
    }
  }

  avaliarExpressao(expr) {
    if (!expr) return null;

    switch (expr.tipo) {
      case "Chamada":
        const callee = this.avaliarExpressao(expr.callee);
        const argumentos = expr.argumentos.map(arg => this.avaliarExpressao(arg));

        if (!(callee instanceof Funcao)) {
            this.erro("Só é possível chamar funções.");
        }
        if (argumentos.length !== callee.declaracao.parametros.length) {
            this.erro(`Esperava ${callee.declaracao.parametros.length} argumentos, mas recebeu ${argumentos.length}.`);
        }
        
        // Funções usam o ambiente em que foram criadas (closure), não o ambiente da chamada
        const ambienteFuncao = new Ambiente(callee.ambienteFechado); 
        for (let i = 0; i < callee.declaracao.parametros.length; i++) {
            ambienteFuncao.definir(callee.declaracao.parametros[i].lexema, argumentos[i]);
        }

        try {
            this.executarBloco(callee.declaracao.corpo.declaracoes, ambienteFuncao);
        } catch(retorno) {
            if (retorno instanceof Retorno) {
                return retorno.valor;
            }
        }
        return null;

      case "Atribuicao": {
        const valor = this.avaliarExpressao(expr.valor);
        this.ambiente.atribuir(expr.nome, valor);
        return valor;
      }

      case "AtribuicaoArray": {
        let alvo = this.ambiente.obter(expr.nome);
        for (let i = 0; i < expr.indices.length - 1; i++) {
          const indice = this.avaliarExpressao(expr.indices[i]);
          alvo = alvo[indice];
        }
        const ultimoIndice = this.avaliarExpressao(expr.indices[expr.indices.length - 1]);
        const valorAtribuir = this.avaliarExpressao(expr.valor);
        alvo[ultimoIndice] = valorAtribuir;
        return valorAtribuir;
      }
      
      case "Variavel":
        return this.ambiente.obter(expr.nome);

      case "VariavelArray": {
        let alvo = this.ambiente.obter(expr.nome);
        for (let i = 0; i < expr.indices.length; i++) {
          const indice = this.avaliarExpressao(expr.indices[i]);
          alvo = alvo[indice];
        }
        return alvo;
      }
        
      case "Binario":
        const esquerda = this.avaliarExpressao(expr.esquerda);
        const direita = this.avaliarExpressao(expr.direita);
        return this.avaliarOperacaoBinaria(expr.operador.tipo, esquerda, direita);
        
      case "Literal":
        return expr.valor;

      case "ExpParentizada":
        return this.avaliarExpressao(expr.grupo.expressao);

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
      default: this.erro(`Operador binário não implementado: ${operadorTipo}`);
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