package sentinela.validacao;
import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;

final class DddsBrasileiros {
    // Anatel, relação CN por UF (p. 2), consultada 2026-11-17; URL em comunidade.md.
    private static final Set<String> CODIGOS=new HashSet<>(Arrays.asList(
        "11","12","13","14","15","16","17","18","19","21","22","24","27","28",
        "31","32","33","34","35","37","38","41","42","43","44","45","46","47","48","49",
        "51","53","54","55","61","62","63","64","65","66","67","68","69",
        "71","73","74","75","77","79","81","82","83","84","85","86","87","88","89",
        "91","92","93","94","95","96","97","98","99"));
    static boolean valido(String ddd){return CODIGOS.contains(ddd);}
}
