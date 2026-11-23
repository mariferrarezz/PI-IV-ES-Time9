// Não lê .env nem aceita fallback para a conexão compartilhada.
export function bancoPutIsolado(uri: string | undefined, rodada: string) {
  if (!uri) throw new Error("BD8_TEST_MONGODB_URI_AUSENTE");
  if (!/^mongodb:\/\/(127\.0\.0\.1|localhost|\[::1\]):[0-9]+\/\?[^#]+$/.test(uri))
    throw new Error("MONGODB_PUT_EXIGE_LOOPBACK_SEM_BANCO_OU_CREDENCIAIS");
  const url = new URL(uri);
  if ([...url.searchParams.keys()].some(chave => chave !== "replicaSet"))
    throw new Error("OPCAO_MONGODB_PUT_NAO_PERMITIDA");
  if (!url.searchParams.get("replicaSet")) throw new Error("MONGODB_PUT_EXIGE_REPLICA_SET");
  if (!/^[0-9a-f-]{36}$/.test(rodada)) throw new Error("RODADA_INVALIDA");
  const nome = `sentinela_testes_put_${rodada.replaceAll("-", "")}`;
  if (nome === "sentinela" || !/^sentinela_testes_put_[0-9a-f]{32}$/.test(nome))
    throw new Error("BANCO_PUT_NAO_ISOLADO");
  return { uri, nome };
}
