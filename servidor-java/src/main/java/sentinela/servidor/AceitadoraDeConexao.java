package sentinela.servidor;

import java.io.IOException;
import java.net.ServerSocket;
import java.net.Socket;

public class AceitadoraDeConexao extends Thread {
    private final ServerSocket servidor;

    public AceitadoraDeConexao(int porta) throws IOException {
        // Abra a porta antes de iniciar a thread.
        servidor = new ServerSocket(porta);
    }

    @Override
    public void run() {
        // Feche o servidor ao encerrar a aceitação.
        try (ServerSocket servidorAberto = servidor) {
            while (true) {
                Socket cliente;
                try {
                    cliente = servidorAberto.accept();
                } catch (IOException e) {
                    System.err.println("Erro ao aceitar conexão: " + e.getMessage());
                    break;
                }

                // Entregue a conexão para uma thread própria.
                try {
                    SupervisoraDeConexao supervisora = new SupervisoraDeConexao(cliente);
                    supervisora.start();
                } catch (RuntimeException | OutOfMemoryError e) {
                    System.err.println("Não foi possível iniciar o atendimento: " + e.getMessage());
                    // Libere a conexão se a transferência falhar.
                    try {
                        cliente.close();
                    } catch (IOException erro) {
                        System.err.println("Erro ao fechar conexão do cliente: " + erro.getMessage());
                    }
                }
            }
        } catch (IOException e) {
            System.err.println("Erro ao fechar o servidor: " + e.getMessage());
        }
    }
}
