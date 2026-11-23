import { Router } from 'express';
import { z } from 'zod';
import { validarCpfNoJava, validarTelefoneNoJava } from '../../services/validacao-java.service';
import { ValidacaoJavaError } from '../../shared/errors';
import { authRepository, AuthRepository } from './auth.repository';
import { verificarDisponibilidade } from './disponibilidade';

// Etapas anteriores à criação da credencial: não criam conta ou perfil.
export function criarValidacaoCadastroRoutes(repo: AuthRepository = authRepository) {
  const router = Router();
  const schema = z.object({ valor: z.string().max(100) }).strict();
  router.post('/:campo', async (req, res) => {
    const campo = String(req.params.campo);
    if (campo !== 'cpf' && campo !== 'telefone') { res.status(404).json({ erro: 'Validação não encontrada' }); return; }
    const { valor } = schema.parse(req.body);
    const digitos = valor.replace(/\D/g, '');
    const entrada = campo === 'telefone' && digitos.length === 11 ? `+55${digitos}`
      : campo === 'telefone' && digitos.length === 13 && digitos.startsWith('55') ? `+${digitos}` : digitos;
    const resultado = campo === 'cpf' ? await validarCpfNoJava(entrada) : await validarTelefoneNoJava(entrada);
    if (!resultado.valido) throw new ValidacaoJavaError(resultado.erros);
    await verificarDisponibilidade(repo, campo, entrada);
    res.json({ valido: true });
  });
  return router;
}
