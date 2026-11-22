package sentinela.servidor;

import java.io.IOException;

public class Servidor {
    public static final int PORTA_PADRAO = 7000;

    public static void main(String[] args) {
        // Confira a quantidade de argumentos.
        if (args.length > 1) {
            System.out.println("Uso esperado: java -cp servidor-java/out sentinela.servidor.Servidor [PORTA]");
            return;
        }

        // Use a porta padrão ou converta o argumento.
        int porta = PORTA_PADRAO;
        if (args.length == 1) {
            try {
                porta = Integer.parseInt(args[0]);
            } catch (NumberFormatException e) {
                System.out.println("A porta deve ser um número inteiro.");
                return;
            }
        }

        // Valide a faixa permitida.
        if (porta < 1 || porta > 65535) {
            System.out.println("A porta deve estar entre 1 e 65535.");
            return;
        }

        // Exiba a porta configurada.
        System.out.println("Porta configurada: " + porta);

        // Abra a porta e inicie a aceitação de conexões.
        try {
            AceitadoraDeConexao aceitadora = new AceitadoraDeConexao(porta);
            aceitadora.start();
            System.out.println("Servidor aguardando conexões na porta " + porta + ".");
        } catch (IOException e) {
            System.err.println("Não foi possível abrir a porta " + porta + ": " + e.getMessage());
        }
    }
}
