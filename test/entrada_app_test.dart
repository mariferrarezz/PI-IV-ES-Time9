import 'package:flutter_test/flutter_test.dart';
import 'package:sentinela/features/auth/tela_cadastro_nome.dart';
import 'package:sentinela/features/auth/tela_login.dart';
import 'package:sentinela/features/dashboard/home/tela_home.dart';
import 'package:sentinela/main.dart';

void main() {
  testWidgets('abertura mostra login sem consultar Firebase ou exibir Home', (tester) async {
    // Não inicializa Firebase: a construção não pode depender do estado da sessão.
    await tester.pumpWidget(const MeuApp());
    expect(find.byType(TelaLogin), findsOneWidget);
    expect(find.byType(TelaHome), findsNothing);
    await tester.pumpAndSettle();
    expect(find.byType(TelaLogin), findsOneWidget);
    expect(find.byType(TelaHome), findsNothing);
    await tester.ensureVisible(find.text('Criar conta'));
    await tester.tap(find.text('Criar conta'));
    await tester.pumpAndSettle();
    expect(find.byType(TelaCadastroNome), findsOneWidget);
  });
}
