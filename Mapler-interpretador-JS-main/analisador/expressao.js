export class Literal {
    constructor(linha, valor, token) {
      this.tipo = 'Literal';
      this.linha = linha;
      this.valor = valor;
      this.token = token;
    }
  }
  
  export class Binario {
    constructor(linha, esquerda, operador, direita) {
      this.tipo = 'Binario';
      this.linha = linha;
      this.esquerda = esquerda;
      this.operador = operador;
      this.direita = direita;
    }
  }
  
  export class Unario {
    constructor(linha, operador, direita) {
      this.tipo = 'Unario';
      this.linha = linha;
      this.operador = operador;
      this.direita = direita;
    }
  }
  
  export class Variavel {
    constructor(linha, nome) {
      this.tipo = 'Variavel';
      this.linha = linha;
      this.nome = nome;
    }
  }
  
  export class VariavelArray {
  // Antes: constructor(linha, nome, index)
  constructor(linha, nome, indices) { // MODIFICADO
    this.tipo = 'VariavelArray';
    this.linha = linha;
    this.nome = nome;
    this.indices = indices; // MODIFICADO: agora é um array de expressões de índice
  }
}
  
  export class Atribuicao {
    constructor(linha, nome, valor) {
      this.tipo = 'Atribuicao';
      this.linha = linha;
      this.nome = nome;
      this.valor = valor;
    }
  }
  
  export class AtribuicaoArray {
  // Antes: constructor(linha, nome, index, valor)
  constructor(linha, nome, indices, valor) { // MODIFICADO
    this.tipo = 'AtribuicaoArray';
    this.linha = linha;
    this.nome = nome;
    this.indices = indices; // MODIFICADO
    this.valor = valor;
  }
}
  export class Grupo {
    constructor(linha, expressao) {
      this.tipo = 'Grupo';
      this.linha = linha;
      this.expressao = expressao;
    }
  }
  
  export class ExpParentizada {
    constructor(linha, grupo) {
      this.tipo = 'ExpParentizada';
      this.linha = linha;
      this.grupo = grupo;
    }
  }
  
  export class Logico {
    constructor(linha, esquerda, operador, direita) {
      this.tipo = 'Logico';
      this.linha = linha;
      this.esquerda = esquerda;
      this.operador = operador;
      this.direita = direita;
    }
  }
  