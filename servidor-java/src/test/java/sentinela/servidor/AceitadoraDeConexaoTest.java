package sentinela.servidor;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.io.BufferedReader;
import java.io.BufferedWriter;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.OutputStreamWriter;
import java.net.InetAddress;
import java.net.ServerSocket;
import java.net.Socket;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import org.junit.jupiter.api.Test;

/**
 * Testes da AceitadoraDeConexao (porta + atendimento de ponta a ponta com a SupervisoraDeConexao).
 *
 * Limitação atual da classe: ela não tem método para descobrir a porta (porta 0) nem para
 * encerrar o ServerSocket. Por isso cada teste escolhe uma porta livre antes e deixa o
 * ServerSocket aberto até o fim da JVM de teste (a thread é marcada como daemon).
 * Com getPorta() e encerrar() estes testes ficariam mais simples e sem porta "vazando".
 */
class AceitadoraDeConexaoTest {

    /** Pede ao sistema uma porta livre e a libera em seguida. */
    private static int portaLivre() throws IOException {
        try (ServerSocket temporario = new ServerSocket(0)) {
            return temporario.getLocalPort();
        }
    }

    private static AceitadoraDeConexao iniciar(int porta) throws IOException {
        AceitadoraDeConexao aceitadora = new AceitadoraDeConexao(porta);
        aceitadora.setDaemon(true); // não segura a JVM de teste
        aceitadora.start();
        return aceitadora;
    }

    /** Abre uma conexão, envia um pedido (uma linha) e devolve a linha de resposta. */
    private static String perguntar(int porta, String pedido) throws IOException {
        try (Socket cliente = new Socket(InetAddress.getLoopbackAddress(), porta)) {
            cliente.setSoTimeout(3000);
            BufferedWriter saida = new BufferedWriter(
                    new OutputStreamWriter(cliente.getOutputStream(), StandardCharsets.UTF_8));
            BufferedReader entrada = new BufferedReader(
                    new InputStreamReader(cliente.getInputStream(), StandardCharsets.UTF_8));
            saida.write(pedido + "\n");
            saida.flush();
            return entrada.readLine();
        }
    }

    // ---------- porta ----------

    @Test
    void construtorAbreAPortaAntesDeIniciarAThread() throws Exception {
        int porta = portaLivre();
        AceitadoraDeConexao aceitadora = new AceitadoraDeConexao(porta);
        aceitadora.setDaemon(true);

        // A thread NÃO foi iniciada, mas a porta já aceita conexões (ficam na fila do sistema).
        assertDoesNotThrow(() -> {
            try (Socket cliente = new Socket(InetAddress.getLoopbackAddress(), porta)) {
                assertTrue(cliente.isConnected());
            }
        });
    }

    @Test
    void portaJaOcupadaFazOConstrutorLancarIOException() throws Exception {
        try (ServerSocket ocupado = new ServerSocket(0)) {
            int porta = ocupado.getLocalPort();

            assertThrows(IOException.class, () -> new AceitadoraDeConexao(porta));
        }
    }

    // ---------- atendimento de ponta a ponta ----------

    @Test
    void atendeUmClienteDePontaAPonta() throws Exception {
        int porta = portaLivre();
        iniciar(porta);

        assertEquals("OK", perguntar(porta, "VALIDAR_TALHAO\tTalhão Norte\t2.5"));
    }

    @Test
    void continuaAceitandoDepoisQueUmClienteSai() throws Exception {
        int porta = portaLivre();
        iniciar(porta);

        assertEquals("OK", perguntar(porta, "VALIDAR_TALHAO\tPrimeiro\t1"));
        // O primeiro cliente já desconectou; um segundo precisa ser atendido normalmente.
        assertEquals("ERRO\tA área do talhão é obrigatória.", perguntar(porta, "VALIDAR_TALHAO\tSegundo\t"));
    }

    @Test
    void atendeVariosClientesAoMesmoTempo() throws Exception {
        int porta = portaLivre();
        iniciar(porta);

        int clientes = 10;
        ExecutorService pool = Executors.newFixedThreadPool(clientes);
        try {
            List<Future<String>> respostas = new ArrayList<>();
            for (int i = 0; i < clientes; i++) {
                // clientes pares enviam pedido válido; ímpares enviam área inválida
                String pedido = (i % 2 == 0)
                        ? "VALIDAR_TALHAO\tTalhão " + i + "\t" + (i + 1)
                        : "VALIDAR_TALHAO\tTalhão " + i + "\t-" + i;
                respostas.add(pool.submit(() -> perguntar(porta, pedido)));
            }

            for (int i = 0; i < clientes; i++) {
                String esperado = (i % 2 == 0)
                        ? "OK"
                        : "ERRO\tA área do talhão deve ser um número finito maior que zero.";
                assertEquals(esperado, respostas.get(i).get(5, TimeUnit.SECONDS), "cliente " + i);
            }
        } finally {
            pool.shutdownNow();
        }
    }
}