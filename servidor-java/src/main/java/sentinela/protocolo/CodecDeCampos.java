package sentinela.protocolo;

public final class CodecDeCampos {
    private CodecDeCampos() { }

    public static String codificar(String campo) {
        // Escape a barra antes dos delimitadores reais.
        return campo.replace("\\", "\\\\").replace("\t", "\\t")
                .replace("\r", "\\r").replace("\n", "\\n");
    }

    public static String decodificar(String campo) {
        StringBuilder resultado = new StringBuilder();
        for (int i = 0; i < campo.length(); i++) {
            char atual = campo.charAt(i);
            if (atual == '\\') {
                if (++i == campo.length()) throw new IllegalArgumentException("Escape incompleto");
                switch (campo.charAt(i)) {
                    case '\\': resultado.append('\\'); break;
                    case 't': resultado.append('\t'); break;
                    case 'r': resultado.append('\r'); break;
                    case 'n': resultado.append('\n'); break;
                    default: throw new IllegalArgumentException("Escape desconhecido");
                }
            } else {
                if (atual == '\t' || atual == '\r' || atual == '\n') {
                    throw new IllegalArgumentException("Delimitador sem escape");
                }
                resultado.append(atual);
            }
        }
        return resultado.toString();
    }
}
