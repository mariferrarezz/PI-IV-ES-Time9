//Guardar comandos para criar coleções ausentes no banco de dados MongoDB.
use('sentinela');

db.createCollection('fontes_conhecimento');

db.createCollection('avaliacoes_tratamento');

db.getCollectionNames();