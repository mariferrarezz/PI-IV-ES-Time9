package sentinela.servidor;

import sentinela.protocolo.ProcessadorDeValidacao;

import java.io.BufferedReader;
import java.io.BufferedWriter;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.OutputStreamWriter;
import java.net.Socket;
import java.nio.charset.StandardCharsets;
import java.util.Objects;

public class SupervisoraDeConexao extends Thread {
    private final Socket cliente;

    public SupervisoraDeConexao(Socket cliente) {
        // Exija uma conexão válida.
        this.cliente = Objects.requireNonNull(cliente, "O socket não pode ser null.");
    }

    @Override
    public void run() {
        // Feche todos os recursos ao terminar o atendimento.
        try (Socket conexao = cliente;
             BufferedReader leitor = new BufferedReader(new InputStreamReader(
                     conexao.getInputStream(), StandardCharsets.UTF_8));
             BufferedWriter escritor = new BufferedWriter(new OutputStreamWriter(
                     conexao.getOutputStream(), StandardCharsets.UTF_8))) {
            String mensagem;
            // Responda por linha sem registrar o conteúdo no console.
            while ((mensagem = leitor.readLine()) != null) {
                escritor.write(ProcessadorDeValidacao.processar(mensagem));
                escritor.newLine();
                escritor.flush();
            }
        } catch (IOException e) {
            System.err.println("Erro de comunicação com o cliente: " + e.getMessage());
        }
    }
}
