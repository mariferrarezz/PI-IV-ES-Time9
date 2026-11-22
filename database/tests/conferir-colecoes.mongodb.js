// Utiliza a conexão já ativa na extensão MongoDB do VS Code.
// Seleciona o banco existente e lista os nomes das coleções, sem alterar dados.
use('sentinela');
db.getCollectionNames();
// Mostra as configurações atuais da coleção talhoes.
db.getCollectionInfos({ name: 'talhoes' });
// Conta os documentos existentes na coleção.
db.getCollection('talhoes').countDocuments({});