package sentinela.validacao;

import java.util.ArrayList;
import java.util.List;
import java.util.Collections;

public class ValidadorPerfil {
    // Valide apenas os campos independentes das decisões restantes do cadastro.
    public static List<String> validarPerfil(String nomeCompleto, String cpf) {
        List<String> erros = new ArrayList<>();
        if (nomeCompleto == null || nomeCompleto.matches("[\\s\\p{Z}\\uFEFF]*")) {
            erros.add("O nome completo é obrigatório.");
        } else {
            int tamanho = nomeCompleto.codePointCount(0, nomeCompleto.length());
            if (tamanho < 2) erros.add("O nome completo deve ter pelo menos 2 caracteres.");
            else if (tamanho > 150) erros.add("O nome completo deve ter no máximo 150 caracteres.");
        }
        erros.addAll(validarCpf(cpf));
        return erros;
    }

    public static List<String> validarCpf(String cpf) {
        List<String> erros = new ArrayList<>();
        if (cpf == null || cpf.isEmpty()) erros.add("O CPF é obrigatório.");
        else if (!cpf.matches("[0-9]{11}")) erros.add("O CPF deve conter exatamente 11 dígitos.");
        return erros;
    }

    public static List<String> validarTelefone(String telefoneCanonico) {
        List<String> erros = new ArrayList<>();
        if (telefoneCanonico == null || telefoneCanonico.isEmpty()) erros.add("O telefone é obrigatório.");
        else if (!telefoneCanonico.matches("\\+55[0-9]{2}9[0-9]{8}"))
            erros.add("O telefone deve estar no formato +55DD9XXXXXXXX, sem separadores.");
        else if (!DddsBrasileiros.valido(telefoneCanonico.substring(3,5)))
            erros.add("O DDD do telefone deve ser um código brasileiro válido.");
        return erros;
    }

    public static List<String> validarCadastroPerfil(String nomeCompleto, String cpf,
            String telefoneCanonico, String canalCodigoPreferido) {
        List<String> erros = validarPerfil(nomeCompleto, cpf);
        // Confira formato e DDD sem comprovar existência ou posse do número.
        erros.addAll(validarTelefone(telefoneCanonico));
        if (!"email".equals(canalCodigoPreferido) && !"sms".equals(canalCodigoPreferido))
            erros.add("O canal de código é obrigatório e deve ser email ou sms.");
        return erros;
    }

    public static List<String> validarOpcionaisPerfil(String nomePublico, ImagemOcorrencia fotoPerfil) {
        List<String> erros = new ArrayList<>();
        if (nomePublico != null) {
            if (nomePublico.matches("[\\s\\p{Z}\\uFEFF]*")) erros.add("O nome público não pode ficar vazio quando informado.");
            else {
                int tamanho = nomePublico.codePointCount(0, nomePublico.length());
                if (tamanho < 2) erros.add("O nome público deve ter pelo menos 2 caracteres.");
                else if (tamanho > 80) erros.add("O nome público deve ter no máximo 80 caracteres.");
            }
        }
        // Um único objeto de entrada garante foto única, sem alterar as regras comuns.
        if (fotoPerfil != null) erros.addAll(ValidadorImagens.validar(
                Collections.singletonList(fotoPerfil), "O perfil deve ter no máximo uma foto."));
        return erros;
    }

}
