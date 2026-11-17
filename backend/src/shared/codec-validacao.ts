// Escapes dos comandos com campos codificados; talhões mantêm barras literais.
export function codificarCampoProtocolo(campo: string): string {
  return campo.replace(/\\/g, "\\\\").replace(/\t/g, "\\t")
    .replace(/\r/g, "\\r").replace(/\n/g, "\\n");
}

export function decodificarCampoProtocolo(campo: string): string {
  let resultado = "";
  const escapes: Record<string, string> = { "\\": "\\", t: "\t", r: "\r", n: "\n" };
  for (let i = 0; i < campo.length; i++) {
    if (campo[i] === "\\") {
      const escape = campo[++i];
      if (escape === undefined || !Object.hasOwn(escapes, escape)) throw new Error("ESCAPE_INVALIDO");
      resultado += escapes[escape];
    } else {
      if (/[\t\r\n]/.test(campo[i])) throw new Error("DELIMITADOR_SEM_ESCAPE");
      resultado += campo[i];
    }
  }
  return resultado;
}
