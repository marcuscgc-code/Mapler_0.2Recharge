export class Programa {
  constructor(linha, variaveis, corpo, modulos, fim) {
    this.tipo = 'Programa';
    this.linha = linha;
    this.variaveis = variaveis;
    this.corpo = corpo;
    this.modulos = modulos;
    this.fim = fim;
  }
}

export class Fim {
  constructor(linha, token) {
    this.tipo = 'Fim';
    this.linha = linha;
    this.token = token;
  }
}

export class Var {
  constructor(linha, nome, tipo, tamanho = null) {
    this.tipo = 'Var';
    this.linha = linha;
    this.nome = nome;
    this.tipoDado = tipo;
    this.tamanho = tamanho; // ✅ usado para vetores
  }
}

export class VarDeclaracoes {
  constructor(linha, variaveis) {
    this.tipo = 'VarDeclaracoes';
    this.linha = linha;
    this.variaveis = variaveis; // lista de Var
  }
}

// ✅ Variável acessando vetor, ex: v[1]
export class VariavelArray {
  constructor(linha, nome, index) {
    this.tipo = 'VariavelArray';
    this.linha = linha;
    this.nome = nome;
    this.index = index;
  }
}

// ✅ Atribuição em vetor, ex: v[2] <- 30;
export class AtribuicaoArray {
  constructor(linha, nome, index, valor) {
    this.tipo = 'AtribuicaoArray';
    this.linha = linha;
    this.nome = nome;
    this.index = index;
    this.valor = valor;
  }
}

export class Escreva {
  constructor(linha, expressoes) {
    this.tipo = 'Escreva';
    this.linha = linha;
    this.expressoes = expressoes;
  }
}

export class Ler {
  constructor(linha, atribuicao) {
    this.tipo = 'Ler';
    this.linha = linha;
    this.atribuicao = atribuicao;
  }
}

export class Expressao {
  constructor(linha, expressao) {
    this.tipo = 'Expressao';
    this.linha = linha;
    this.expressao = expressao;
  }
}

export class Bloco {
  constructor(linha, declaracoes) {
    this.tipo = 'Bloco';
    this.linha = linha;
    this.declaracoes = declaracoes;
  }
}

export class Se {
  constructor(linha, condicao, entaoBloco, senaoBloco = null) {
    this.tipo = 'Se';
    this.linha = linha;
    this.condicao = condicao;
    this.entao = entaoBloco;
    this.senao = senaoBloco;
  }
}

export class Enquanto {
  constructor(linha, condicao, corpo) {
    this.tipo = 'Enquanto';
    this.linha = linha;
    this.condicao = condicao;
    this.corpo = corpo;
  }
}

export class Para {
  constructor(linha, inicializacao, condicao, incremento, corpo) {
    this.tipo = 'Para';
    this.linha = linha;
    this.inicializacao = inicializacao;
    this.condicao = condicao;
    this.incremento = incremento;
    this.corpo = corpo;
  }
}

export class Repita {
  constructor(linha, corpo, condicao) {
    this.tipo = 'Repita';
    this.linha = linha;
    this.corpo = corpo;
    this.condicao = condicao;
  }
}

export class Modulo {
  constructor(linha, nome, corpo) {
    this.tipo = 'Modulo';
    this.linha = linha;
    this.nome = nome;
    this.corpo = corpo;
  }
}

export class ChamadaModulo {
  constructor(linha, nome) {
    this.tipo = 'ChamadaModulo';
    this.linha = linha;
    this.nome = nome;
  }
}

// ✅ Exporte tudo junto
export const Decl = {
  Programa,
  Fim,
  Var,
  VarDeclaracoes,
  VariavelArray,
  AtribuicaoArray,
  Escreva,
  Ler,
  Expressao,
  Bloco,
  Se,
  Enquanto,
  Para,
  Repita,
  Modulo,
  ChamadaModulo
};
