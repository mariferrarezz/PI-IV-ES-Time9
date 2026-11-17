package sentinela.servidor;


import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.junit.jupiter.api.Assumptions.assumeTrue;

import java.io.BufferedReader;
import java.io.BufferedWriter;
import java.io.File;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.OutputStreamWriter;
import java.net.InetAddress;
import java.net.ServerSocket;
import java.net.Socket;
import java.nio.charset.StandardCharsets;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.BlockingQueue;
import java.util.concurrent.LinkedBlockingQueue;
import java.util.concurrent.TimeUnit;
import org.junit.jupiter.api.Test;

/**
 * Testa o main() do Servidor rodando-o como um PROCESSO separado (como o usuário faria no
 * terminal). Assim a porta e a thread aceitadora ficam no processo filho e são encerradas ao
 * fim de cada teste, sem deixar nada preso na JVM dos testes.
 */
class ServidorTest {

    private static final int ESPERA_SEGUNDOS = 5;

    /** Um "java sentinela.servidor.Servidor [args]" em execução, com a saída capturada. */
    private static final class ProcessoServidor implements AutoCloseable {
        private final Process processo;
        private final BlockingQueue<String> linhas = new LinkedBlockingQueue<>();
        private final List<String> lidas = new ArrayList<>();
        private final Thread leitor;

        ProcessoServidor(String... argumentos) throws Exception {
            Path classes = Path.of(Servidor.class.getProtectionDomain().getCodeSource().getLocation().toURI());
            String java = System.getProperty("java.home") + File.separator + "bin" + File.separator + "java";

            List<String> comando = new ArrayList<>(List.of(java,
                    "-Dstdout.encoding=UTF-8", "-Dstderr.encoding=UTF-8", // acentos corretos em qualquer sistema
                    "-cp", classes.toString(), "sentinela.servidor.Servidor"));
            comando.addAll(List.of(argumentos));

            processo = new ProcessBuilder(comando).redirectErrorStream(true).start();
            BufferedReader saida = new BufferedReader(
                    new InputStreamReader(processo.getInputStream(), StandardCharsets.UTF_8));
            leitor = new Thread(() -> {
                try {
                    String linha;
                    while ((linha = saida.readLine()) != null) {
                        linhas.add(linha);
                    }
                } catch (IOException ignorado) {
                    // processo encerrado
                }
            });
            leitor.setDaemon(true);
            leitor.start();
        }

        /** Espera até aparecer exatamente esta linha na saída; false se estourar o tempo. */
        boolean esperarLinha(String esperada) throws InterruptedException {
            long limite = System.nanoTime() + TimeUnit.SECONDS.toNanos(ESPERA_SEGUNDOS);
            while (System.nanoTime() < limite) {
                String linha = linhas.poll(100, TimeUnit.MILLISECONDS);
                if (linha != null) {
                    lidas.add(linha);
                    if (linha.equals(esperada)) {
                        return true;
                    }
                }
            }
            return false;
        }

        /** Para programas que terminam sozinhos: espera o fim e devolve toda a saída. */
        List<String> aguardarFimELerSaida() throws InterruptedException {
            assertTrue(processo.waitFor(ESPERA_SEGUNDOS, TimeUnit.SECONDS), "o programa deveria ter terminado");
            leitor.join(2000);
            linhas.drainTo(lidas);
            return lidas;
        }

        @Override
        public void close() {
            processo.destroyForcibly();
            try {
                processo.waitFor(ESPERA_SEGUNDOS, TimeUnit.SECONDS);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        }
    }

    private static int portaLivre() throws IOException {
        try (ServerSocket temporario = new ServerSocket(0)) {
            return temporario.getLocalPort();
        }
    }

    private static boolean portaDisponivel(int porta) {
        try (ServerSocket teste = new ServerSocket(porta)) {
            return teste.isBound();
        } catch (IOException ocupada) {
            return false;
        }
    }

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

    // ---------- argumentos ----------

    @Test
    void portaPadraoEh7000() {
        assertEquals(7000, Servidor.PORTA_PADRAO);
    }

    @Test
    void maisDeUmArgumentoMostraOUsoEEncerra() throws Exception {
        try (ProcessoServidor p = new ProcessoServidor("7001", "7002")) {
            List<String> saida = p.aguardarFimELerSaida();

            assertEquals(1, saida.size());
            assertTrue(saida.get(0).startsWith("Uso esperado: "), saida.get(0));
        }
    }

    @Test
    void portaNaoNumericaEhRejeitada() throws Exception {
        for (String invalida : List.of("abc", "80.5")) {
            try (ProcessoServidor p = new ProcessoServidor(invalida)) {
                assertEquals(List.of("A porta deve ser um número inteiro."), p.aguardarFimELerSaida(),
                        "argumento: " + invalida);
            }
        }
    }

    @Test
    void portaForaDaFaixaEhRejeitadaSemAbrirServidor() throws Exception {
        for (String fora : List.of("0", "-1", "65536", "99999")) {
            try (ProcessoServidor p = new ProcessoServidor(fora)) {
                assertEquals(List.of("A porta deve estar entre 1 e 65535."), p.aguardarFimELerSaida(),
                        "argumento: " + fora);
            }
        }
    }

    // ---------- servidor no ar ----------

    @Test
    void portaValidaEhExibidaEOServidorAtendeClientes() throws Exception {
        int porta = portaLivre();

        try (ProcessoServidor p = new ProcessoServidor(String.valueOf(porta))) {
            assertTrue(p.esperarLinha("Porta configurada: " + porta));
            assertTrue(p.esperarLinha("Servidor aguardando conexões na porta " + porta + "."));

            assertEquals("OK", perguntar(porta, "VALIDAR_TALHAO\tTalhão Norte\t2.5"));
            assertEquals("ERRO\tA área do talhão é obrigatória.", perguntar(porta, "VALIDAR_TALHAO\tSul\t"));
        }
    }

    @Test
    void semArgumentosUsaAPortaPadrao() throws Exception {
        assumeTrue(portaDisponivel(Servidor.PORTA_PADRAO),
                "porta " + Servidor.PORTA_PADRAO + " já está em uso nesta máquina");

        try (ProcessoServidor p = new ProcessoServidor()) {
            assertTrue(p.esperarLinha("Porta configurada: " + Servidor.PORTA_PADRAO));
            assertTrue(p.esperarLinha("Servidor aguardando conexões na porta " + Servidor.PORTA_PADRAO + "."));

            assertEquals("OK", perguntar(Servidor.PORTA_PADRAO, "VALIDAR_TALHAO\tNorte\t1"));
        }
    }

    @Test
    void portaOcupadaMostraErroEOProgramaTermina() throws Exception {
        try (ServerSocket ocupado = new ServerSocket(0);
                ProcessoServidor p = new ProcessoServidor(String.valueOf(ocupado.getLocalPort()))) {
            int porta = ocupado.getLocalPort();

            List<String> saida = p.aguardarFimELerSaida();

            assertEquals("Porta configurada: " + porta, saida.get(0));
            assertTrue(saida.get(1).startsWith("Não foi possível abrir a porta " + porta + ": "), saida.get(1));
            assertFalse(saida.stream().anyMatch(l -> l.startsWith("Servidor aguardando")));
        }
    }
}
