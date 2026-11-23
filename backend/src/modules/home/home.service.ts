import { AppError } from "../../shared/errors";
import { AuthRepository, authRepository } from "../auth/auth.repository";
import { HomeRepository, homeRepository } from "./home.repository";

type BuscaPerfil = Pick<AuthRepository, "buscarPorFirebaseUid">;

export interface ResumoHome {
  // Nome para a saudação: o nome público ou, sem ele, o primeiro nome do nome completo.
  nome: string;
  // Propriedade ativa mais recente; null quando o produtor ainda não cadastrou nenhuma.
  propriedade: { id: string; nome: string; municipio: string; estado: string } | null;
  // Talhões ativos da propriedade do resumo (0 sem propriedade).
  talhoes: number;
  // Alertas do usuário não lidos e não expirados (de todas as propriedades).
  alertasAtivos: number;
}

export function nomeSaudacao(nomePublico: string | null | undefined, nomeCompleto: string) {
  const publico = nomePublico?.trim();
  if (publico) return publico;
  return nomeCompleto.trim().split(/\s+/u)[0] ?? "";
}

export function criarHomeService(repo: HomeRepository = homeRepository, usuarios: BuscaPerfil = authRepository,
  relogio: () => Date = () => new Date()) {
  return {
    async resumo(uid: string): Promise<ResumoHome> {
      const perfil = await usuarios.buscarPorFirebaseUid(uid);
      if (!perfil) throw new AppError(404, "Perfil não cadastrado", "PERFIL_NAO_ENCONTRADO");
      const [propriedade, alertasAtivos] = await Promise.all([
        repo.propriedadeMaisRecente(perfil._id),
        repo.contarAlertasAtivos(perfil._id, relogio()),
      ]);
      const talhoes = propriedade ? await repo.contarTalhoesAtivos(propriedade._id) : 0;
      return {
        nome: nomeSaudacao(perfil.nomePublico, perfil.nomeCompleto),
        propriedade: propriedade ? { id: String(propriedade._id), nome: propriedade.nome,
          municipio: propriedade.municipio, estado: propriedade.estado } : null,
        talhoes,
        alertasAtivos,
      };
    },
  };
}

export type HomeService = ReturnType<typeof criarHomeService>;
export const homeService = criarHomeService();
