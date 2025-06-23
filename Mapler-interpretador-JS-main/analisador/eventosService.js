export class EventosService {
    constructor(callback = null) {
      this.callback = callback;
    }
  
    notificar(tipo, erro) {
      if (this.callback) {
        this.callback(tipo, erro);
      } else {
        console.error(`Erro (${tipo}) na linha ${erro.linha}: ${erro.mensagem}`);
      }
    }
  }
  