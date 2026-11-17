package sentinela.servidor;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;

import java.io.BufferedReader;
import java.io.BufferedWriter;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.OutputStreamWriter;
import java.net.InetAddress;
import java.net.ServerSocket;
import java.net.Socket;
import java.nio.charset.StandardCharsets;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

/**
 * Testa a SupervisoraDeConexao com sockets reais em localhost: o teste faz o papel do cliente
 * e entrega a ponta do servidor para a supervisora, sem precisar da AceitadoraDeConexao.
 */
class SupervisoraDeConexaoTest {

    private static final String ERRO_PEDIDO = "ERRO\tPedido de validação inválido.";

    private ServerSocket servidor;

    /** O "cliente": envia linhas e lê as respostas da supervisora. */
    private static final class Sessao implements AutoCloseable {
        final Socket cliente;
        private final BufferedReader entrada;
        private final BufferedWriter saida;

        Sessao(ServerSocket servidor) throws IOException {
            cliente = new Socket(InetAddress.getLoopbackAddress(), servidor.getLocalPort());
            cliente.setSoTimeout(3000); // se algo travar, o teste falha em vez de ficar preso
            new SupervisoraDeConexao(servidor.accept()).start();
            entrada = new BufferedReader(new InputStreamReader(cliente.getInputStream(), StandardCharsets.UTF_8));
            saida = new BufferedWriter(new OutputStreamWriter(cliente.getOutputStream(), StandardCharsets.UTF_8));
        }

        /** Envia o texto exatamente como está (sem acrescentar fim de linha). */
        void enviarBruto(String texto) throws IOException {
            saida.write(texto);
            saida.flush();
        }

        void enviar(String linha) throws IOException {
            enviarBruto(linha + "\n");
        }

        String receber() throws IOException {
            return entrada.readLine();
        }

        @Override
        public void close() throws IOException {
            cliente.close();
        }
    }

    @BeforeEach
    void abrirServidor() throws IOException {
        servidor = new ServerSocket(0);
    }

    @AfterEach
    void fecharServidor() throws IOException {
        servidor.close();
    }

    @Test
    void construtorRejeitaSocketNulo() {
        NullPointerException e = assertThrows(NullPointerException.class, () -> new SupervisoraDeConexao(null));

        assertEquals("O socket não pode ser null.", e.getMessage());
    }

    @Test
    void respondeOkParaPedidoValido() throws Exception {
        try (Sessao s = new Sessao(servidor)) {
            s.enviar("VALIDAR_TALHAO\tTalhão Norte\t2.5");

            assertEquals("OK", s.receber());
        }
    }

    @Test
    void respondeErroComAsMensagensDoValidadorPreservandoAcentos() throws Exception {
        try (Sessao s = new Sessao(servidor)) {
            s.enviar("VALIDAR_TALHAO\t\t-1");

            assertEquals("ERRO\tO nome do talhão é obrigatório.\t"
                    + "A área do talhão deve ser um número finito maior que zero.", s.receber());
        }
    }

    @Test
    void respondeUmaLinhaParaCadaPedidoNaMesmaConexaoEmOrdem() throws Exception {
        try (Sessao s = new Sessao(servidor)) {
            s.enviar("VALIDAR_TALHAO\tNorte\t1");
            s.enviar("VALIDAR_TALHAO\tNorte\t0");
            s.enviar("VALIDAR_TALHAO\tSul\t3.2");

            assertEquals("OK", s.receber());
            assertEquals("ERRO\tA área do talhão deve ser um número finito maior que zero.", s.receber());
            assertEquals("OK", s.receber());
        }
    }

    @Test
    void pedidoInvalidoNaoEncerraAConexao() throws Exception {
        try (Sessao s = new Sessao(servidor)) {
            s.enviar("isto não é um pedido");
            assertEquals(ERRO_PEDIDO, s.receber());

            s.enviar("VALIDAR_TALHAO\tNorte\t2.5");
            assertEquals("OK", s.receber());
        }
    }

    @Test
    void linhaVaziaGeraErroDePedido() throws Exception {
        try (Sessao s = new Sessao(servidor)) {
            s.enviar("");

            assertEquals(ERRO_PEDIDO, s.receber());
        }
    }

    @Test
    void aceitaClientesQueTerminamALinhaComCRLF() throws Exception {
        // Clientes no Windows costumam enviar \r\n; a leitura por linha remove o \r.
        try (Sessao s = new Sessao(servidor)) {
            s.enviarBruto("VALIDAR_TALHAO\tNorte\t2.5\r\n");

            assertEquals("OK", s.receber());
        }
    }

    @Test
    void fechaAConexaoQuandoOClienteTerminaOEnvio() throws Exception {
        try (Sessao s = new Sessao(servidor)) {
            s.enviar("VALIDAR_TALHAO\tNorte\t2.5");
            assertEquals("OK", s.receber());

            s.cliente.shutdownOutput(); // cliente avisa que não vai mandar mais nada

            assertNull(s.receber(), "o servidor deve fechar a conexão (fim de fluxo)");
        }
    }

    @Test
    void clienteQueCaiDeRepenteNaoAfetaOutrosClientes() throws Exception {
        try (Sessao queCai = new Sessao(servidor); Sessao estavel = new Sessao(servidor)) {
            queCai.enviar("VALIDAR_TALHAO\tNorte\t2.5");
            assertEquals("OK", queCai.receber());

            queCai.cliente.setSoLinger(true, 0); // close() vira reset abrupto da conexão
            queCai.cliente.close();

            estavel.enviar("VALIDAR_TALHAO\tSul\t4");
            assertEquals("OK", estavel.receber());
        }
    }
}