package sentinela.validacao;

import sentinela.protocolo.ProcessadorDeValidacao;

public class ValidadorCampoCadastroTest {
    public static void main(String[] args) {
        if (!ValidadorPerfil.validarCpf("11111111111").isEmpty()) throw new AssertionError("CPF repetido deve ser aceito");
        if (ValidadorPerfil.validarCpf("1234567890").isEmpty() || ValidadorPerfil.validarCpf("123456789012").isEmpty()) throw new AssertionError("CPF com tamanho inválido");
        if (!ValidadorPerfil.validarCpf("52998224725").isEmpty()) throw new AssertionError("CPF válido");
        if (!ValidadorPerfil.validarTelefone("+5500999999999").contains("O DDD do telefone deve ser um código brasileiro válido.")) throw new AssertionError("DDD inválido");
        if (!ValidadorPerfil.validarTelefone("+5511987654321").isEmpty()) throw new AssertionError("Telefone válido");
        if (!ValidadorPerfil.validarTelefone("+551134567890").contains("Informe um celular com DDD, começando com 9. Exemplo: (19) 99876-5432.")) throw new AssertionError("Mensagem de celular");
        if (!ProcessadorDeValidacao.processar("VALIDAR_CPF\t11111111111").equals("OK")) throw new AssertionError("Protocolo CPF");
        if (!ProcessadorDeValidacao.processar("VALIDAR_TELEFONE\t+5511987654321").equals("OK")) throw new AssertionError("Protocolo telefone");
        if (!ProcessadorDeValidacao.processar("VALIDAR_CPF\tvalor\textra").startsWith("ERRO\t")) throw new AssertionError("Protocolo malformado");
        System.out.println("Validação individual de CPF e telefone: OK");
    }
}
