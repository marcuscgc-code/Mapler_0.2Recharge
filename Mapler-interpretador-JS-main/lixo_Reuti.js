//  declaracaoVariaveis() {
//     console.log(">> ENTROU em declaracaoVariaveis()");
//     const retorno = [];
//     const nomes = [];

//     do {
//       nomes.push(this.consumirToken(TiposToken.IDENTIFICADOR, 'Esperado nome da variável.'));
//     } while (this.isTokenTypeIgualA(TiposToken.VIRGULA));

//     this.consumirToken(TiposToken.DOIS_PONTOS, 'Esperado ":"');

//     if (this.isTokenTypeIgualA(TiposToken.TIPO_VETOR)) {
//       this.consumirToken(TiposToken.ESQ_COLCHETE, 'Esperado "["');
//       const intervaloI = this.consumirToken(TiposToken.INTEIRO, 'Esperado valor inteiro positivo');
//       this.consumirToken(TiposToken.INTERVALO, 'Esperado ".."');
//       const intervaloF = this.consumirToken(TiposToken.INTEIRO, 'Esperado valor inteiro positivo');
//       this.consumirToken(TiposToken.DIR_COLCHETE, 'Esperado "]"');
//       this.consumirToken(TiposToken.DE, 'Esperado "de"');
//       const tipoDoVetor = this.tipoDado();

//       for (const nome of nomes) {
//         const varArray = new Decl.VariavelArray(
//           nome.linha,
//           nome,
//           new Expr.Literal(nome.linha, intervaloI.literal, nome),
//           new Expr.Literal(nome.linha, intervaloF.literal, nome),
//           tipoDoVetor
//         );
//         retorno.push(varArray);
//       }
//     } else {
//       const tipo = this.tipoDado();
//       for (const nome of nomes) {
//         retorno.push(new Decl.Var(nome.linha, nome, tipo));
//       }
//     }

//     this.consumirToken(TiposToken.PONTO_VIRGULA, 'Esperado ";"');
//     return new Decl.VarDeclaracoes(nomes[0].linha, retorno);
//   }