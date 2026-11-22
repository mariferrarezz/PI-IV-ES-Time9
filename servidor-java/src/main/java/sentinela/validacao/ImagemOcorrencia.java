package sentinela.validacao;

import java.time.Instant;

// Somente metadados; autoria e upload permanecem no Node.
public final class ImagemOcorrencia {
    public final String url;
    public final String publicId;
    public final String legenda;
    public final Instant enviadaEm;

    public ImagemOcorrencia(String url, String publicId, String legenda, Instant enviadaEm) {
        this.url = url;
        this.publicId = publicId;
        this.legenda = legenda;
        this.enviadaEm = enviadaEm;
    }
}
