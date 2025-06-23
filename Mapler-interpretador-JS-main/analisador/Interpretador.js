export class Interpretador {
  constructor(eventosService) {
    this.eventosService = eventosService;
    this.variaveis = new Map();
  }

  interpretar(ast) {
    this.variaveis.clear(); // ✅ Corrigido aqui
    try {
      if (ast.tipo === "Programa") {
        for (const comando of ast.corpo) {
          this.executarDeclaracao(comando);
        }
      } else if (ast.tipo === "Modulo") {
        for (const comando of ast.corpo.declaracoes) {
          this.executarDeclaracao(comando);
        }
      } else {
        this.erro("AST inválido: tipo desconhecido");
      }
    } catch (erro) {
      this.erro(erro.message);
    }
  }

  executarDeclaracao(declaracao) {
    if (!declaracao) return;

    switch (declaracao.tipo) {
      //23/06
      case "VarDeclaracoes":
    for (const variavel of declaracao.variaveis) {
        if (variavel.tamanho !== undefined && variavel.tamanho !== null) {
            // Verifica se é um vetor
            const tamanho = this.avaliarExpressao({ tipo: "Literal", valor: variavel.tamanho });
            this.variaveis.set(variavel.nome.lexema, new Array(tamanho).fill(null));
        } else {
            this.variaveis.set(variavel.nome.lexema, null);
        }
    }
    break;

      case "Expressao":
        this.avaliarExpressao(declaracao.expressao);
        break;

      case "Escreva":
        for (const expr of declaracao.expressoes) {
          const valor = this.avaliarExpressao(expr);
          this.exibirSaida(valor);
        }
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
        this.erro("Declaração desconhecida: " + declaracao.tipo);
    }
  }

 executarLeitura(atribuicao) {
  console.log("Executando leitura para:", atribuicao);
  const valorStr = prompt(`Digite o valor para ${atribuicao.nome.lexema}:`);
  const valor = Number(valorStr);

  if (atribuicao.tipo === "Atribuicao") {
    this.variaveis.set(atribuicao.nome.lexema, valor);
  } else if (atribuicao.tipo === "AtribuicaoArray") {
    const array = this.variaveis.get(atribuicao.nome.lexema);
    if (!Array.isArray(array)) {
      this.erro(`Variável ${atribuicao.nome.lexema} não é um vetor`);
    }
    const index = this.avaliarExpressao(atribuicao.index);
    if (index < 0 || index >= array.length) {
      this.erro(`Índice fora dos limites do vetor ${atribuicao.nome.lexema}`);
    }
    array[index] = valor;
  } else {
    this.erro("Leitura inválida: esperada variável ou vetor.");
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

      case "VariavelArray":
        const array = this.variaveis.get(expr.nome.lexema);
        if (!Array.isArray(array)) {
          this.erro(`Variável ${expr.nome.lexema} não é um vetor`);
        }
        const indice = this.avaliarExpressao(expr.index);
        if (indice < 0 || indice >= array.length) {
          this.erro(`Índice fora dos limites para vetor ${expr.nome.lexema}`);
        }
        return array[indice];

      case "Atribuicao":
        const valor = this.avaliarExpressao(expr.valor);
        this.variaveis.set(expr.nome.lexema, valor);
        return valor;

      case "AtribuicaoArray":
        const arr = this.variaveis.get(expr.nome.lexema);
        if (!Array.isArray(arr)) {
          this.erro(`Variável ${expr.nome.lexema} não é um vetor`);
        }
        const idx = this.avaliarExpressao(expr.index);
        const val = this.avaliarExpressao(expr.valor);
        if (idx < 0 || idx >= arr.length) {
          this.erro(`Índice fora do vetor ${expr.nome.lexema}`);
        }
        arr[idx] = val;
        return val;

      case "Binario":
        const esquerda = this.avaliarExpressao(expr.esquerda);
        const direita = this.avaliarExpressao(expr.direita);
        return this.avaliarOperacaoBinaria(expr.operador.tipo, esquerda, direita);

      default:
        this.erro("Expressão desconhecida: " + expr.tipo);
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
        this.erro("Operador binário não implementado: " + operadorTipo);
    }
  }
  executarPara(decl) {
  // Executa a atribuição inicial (ex: i := 0)
  this.avaliarExpressao(decl.inicializacao);

  while (this.avaliarExpressao(decl.condicao)) {
    // Executa o corpo do laço
    for (const comando of decl.corpo.declaracoes) {
      this.executarDeclaracao(comando);
    }

    // Executa o incremento (ex: i := i + 1)
    this.avaliarExpressao(decl.incremento);
  }
}


  executarSe(decl) {
    const condicao = this.avaliarExpressao(decl.condicao);
    const bloco = condicao ? decl.entao : decl.senao;
    if (bloco && bloco.declaracoes) {
      for (const cmd of bloco.declaracoes) {
        this.executarDeclaracao(cmd);
      }
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
