import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminPerfisService, LiderAdmin } from '../../services/admin-perfis.service';

// Tela restrita ao perfil "Administrador Master" (ver memória project-raiox-admin-perfis):
// CRUD simples de perfis de líder. Não usa AuthService.logout() diretamente -- emite `sair`
// e deixa o AppComponent chamar, igual ao PaiComponent, pra manter um único ponto de logout.
@Component({
  selector: 'app-admin-perfis',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-perfis.component.html',
  styleUrl: './admin-perfis.component.css',
})
export class AdminPerfisComponent {
  @Output() sair = new EventEmitter<void>();

  readonly unidades = [
    'Estaca Betim',
    'Ala Betim 1',
    'Ala Betim 2',
    'Ala Divinópolis 1',
    'Ala Divinópolis 2',
    'Ala Itaúna',
    'Ala Jardim das Alterosas',
    'Ramo Juatuba',
    'Ramo Nova Serrana',
    'Ramo Pará de Minas',
  ];

  readonly escopos = ['Ala-A', 'Ala-B', 'Estaca-A', 'Estaca-B'];

  // Chamados hoje presentes na base (SELECT DISTINCT chamado FROM lideres), em ordem
  // alfabética. Coluna é texto livre no banco, mas a tela usa select fechado pra evitar
  // grafias divergentes do mesmo chamado.
  readonly chamados = [
    'Bispo',
    'Conselheiro Estaca',
    'Membro do Sumo Conselho da Estaca',
    'Presidente da Escola Dominical',
    'Presidente da Primária',
    'Presidente da Primária da Estaca',
    'Presidente da Sociedade de Socorro',
    'Presidente das Moças',
    'Presidente de Ramo',
    'Presidente do Quórum de Élderes',
    'Presidente dos Rapazes',
    'Presidente Estaca',
    'Primeira Conselheira da Primária',
    'Primeira Conselheira da Primária da Estaca',
    'Primeira Conselheira da Sociedade de Socorro',
    'Primeira Conselheira da Sociedade de Socorro da Estaca',
    'Primeira Conselheira das Moças',
    'Primeiro Conselheiro da Escola Dominical',
    'Primeiro Conselheiro na Presidência de Ramo',
    'Primeiro Conselheiro no Bispado',
    'Primeiro Conselheiro no Quórum de Élderes',
    'Professor do Instituto',
    'Professor do Seminário',
    'Secretária Assistente da Sociedade de Socorro',
    'Secretária da Primária',
    'Secretária da Primária da Estaca',
    'Secretária da Sociedade de Socorro',
    'Secretária das Moças',
    'Secretária de ministração',
    'Secretária de ministração da Sociedade de Socorro',
    'Secretário Adjunto Financeiro da Ala',
    'Secretário da Ala',
    'Secretário de ministração do quórum de élderes',
    'Secretário de tecnologia do conselho de Belo Horizonte',
    'Secretário do Quórum de Élderes',
    'Secretário do Ramo',
    'Secretário Estaca',
    'Segunda Conselheira da Primária',
    'Segunda Conselheira da Primária da Estaca',
    'Segunda Conselheira da Sociedade de Socorro',
    'Segunda Conselheira da Sociedade de Socorro da Estaca',
    'Segunda Conselheira das Moças',
    'Segundo Conselheiro da Escola Dominical',
    'Segundo Conselheiro na Presidência de Ramo',
    'Segundo Conselheiro no Bispado',
    'Segundo Conselheiro no Quórum de Élderes',
  ];

  liderId: number | null = null;
  registromembro = '';
  nome = '';
  unidade = '';
  escopo = '';
  nascimento = ''; // exibido/editado como DD/MM/AAAA
  chamado = '';

  carregando = false;
  mensagem = '';
  erro = '';
  mostrarConfirmacaoRemover = false;

  constructor(private adminService: AdminPerfisService) {}

  onRegistroInput(valor: string): void {
    const digitos = valor.replace(/\D/g, '').substring(0, 11);
    let resultado = digitos.substring(0, 3);
    if (digitos.length > 3) resultado += '-' + digitos.substring(3, 7);
    if (digitos.length > 7) resultado += '-' + digitos.substring(7, 11);
    this.registromembro = resultado;
  }

  onNascimentoInput(valor: string): void {
    const digitos = valor.replace(/\D/g, '').substring(0, 8);
    let resultado = digitos.substring(0, 2);
    if (digitos.length > 2) resultado += '/' + digitos.substring(2, 4);
    if (digitos.length > 4) resultado += '/' + digitos.substring(4, 8);
    this.nascimento = resultado;
  }

  buscar(): void {
    this.erro = '';
    this.mensagem = '';
    // Descarta qualquer perfil carregado por uma busca anterior antes de tentar esta --
    // sem isso, uma busca que falha na validação (registro incompleto) deixava o liderId
    // antigo "pendurado", e Salvar/Remover Acesso continuavam válidos e agindo sobre o
    // perfil errado (já carregado antes), não sobre o que está no campo agora.
    this.liderId = null;
    const registro = this.registromembro.trim();

    if (registro.length < 13) {
      this.erro = 'Informe o registro de membro completo (000-0000-0000).';
      return;
    }

    this.carregando = true;
    this.adminService.buscarPorRegistroMembro(registro).subscribe({
      next: (lider) => {
        this.carregando = false;
        this.preencherFormulario(lider);
        this.mensagem = 'Perfil encontrado. Altere os campos e clique em Salvar, ou em Remover Acesso.';
      },
      error: (err) => {
        this.carregando = false;
        if (err?.status === 404) {
          this.limparFormulario(registro);
          this.mensagem = 'Registro não encontrado. Preencha os campos abaixo para criar um novo perfil.';
        } else {
          this.erro = 'Não foi possível buscar o perfil. Tente novamente.';
        }
      },
    });
  }

  salvar(): void {
    this.erro = '';
    this.mensagem = '';

    const nascimentoISO = this.converterNascimentoParaISO(this.nascimento);
    if (!this.nome.trim() || this.registromembro.trim().length < 13 || !this.unidade || !this.escopo || !nascimentoISO || !this.chamado) {
      this.erro = 'Preencha todos os campos (data no formato DD/MM/AAAA) antes de salvar.';
      return;
    }

    const dto: LiderAdmin = {
      nome: this.nome.trim(),
      registromembro: this.registromembro.trim(),
      unidade: this.unidade,
      escopo: this.escopo,
      nascimento: nascimentoISO,
      chamado: this.chamado,
    };

    this.carregando = true;
    const requisicao = this.liderId
      ? this.adminService.atualizar(this.liderId, dto)
      : this.adminService.criar(dto);

    requisicao.subscribe({
      next: (lider) => {
        this.carregando = false;
        this.preencherFormulario(lider);
        this.mensagem = 'Perfil salvo com sucesso.';
      },
      error: (err) => {
        this.carregando = false;
        this.erro = err?.status === 409
          ? (err?.error ?? 'Já existe um perfil com este registro de membro.')
          : 'Não foi possível salvar. Tente novamente.';
      },
    });
  }

  abrirConfirmacaoRemoverAcesso(): void {
    if (this.liderId === null) {
      return;
    }
    this.mostrarConfirmacaoRemover = true;
  }

  cancelarRemoverAcesso(): void {
    this.mostrarConfirmacaoRemover = false;
  }

  confirmarRemoverAcesso(): void {
    this.mostrarConfirmacaoRemover = false;

    if (this.liderId === null) {
      return;
    }

    this.erro = '';
    this.mensagem = '';
    this.carregando = true;
    this.adminService.revogarAcesso(this.liderId).subscribe({
      next: () => {
        this.carregando = false;
        this.escopo = '';
        this.mensagem = 'Acesso removido: este perfil não conseguirá mais fazer login.';
      },
      error: () => {
        this.carregando = false;
        this.erro = 'Não foi possível remover o acesso. Tente novamente.';
      },
    });
  }

  private preencherFormulario(lider: LiderAdmin): void {
    this.liderId = lider.id ?? null;
    this.nome = lider.nome;
    this.registromembro = lider.registromembro;
    this.unidade = lider.unidade;
    this.escopo = lider.escopo;
    this.nascimento = this.converterNascimentoParaExibicao(lider.nascimento);
    this.chamado = lider.chamado ?? '';
  }

  private limparFormulario(registromembroDigitado: string): void {
    this.liderId = null;
    this.registromembro = registromembroDigitado;
    this.nome = '';
    this.unidade = '';
    this.escopo = '';
    this.nascimento = '';
    this.chamado = '';
  }

  private converterNascimentoParaISO(ddmmaaaa: string): string | null {
    const digitos = ddmmaaaa.replace(/\D/g, '');
    if (digitos.length !== 8) {
      return null;
    }
    const dia = digitos.substring(0, 2);
    const mes = digitos.substring(2, 4);
    const ano = digitos.substring(4, 8);
    if (Number(dia) < 1 || Number(dia) > 31 || Number(mes) < 1 || Number(mes) > 12) {
      return null;
    }
    return `${ano}-${mes}-${dia}`;
  }

  private converterNascimentoParaExibicao(iso: string): string {
    const [ano, mes, dia] = iso.split('-');
    return `${dia}/${mes}/${ano}`;
  }
}
