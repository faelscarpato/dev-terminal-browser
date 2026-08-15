# DevTerminal: Node.js Browser IDE — TODO

## Funcionalidades principais

- [x] Layout de IDE com explorer, abas, editor e terminal redimensionáveis.
- [x] Tema escuro elegante como padrão, com foco em contraste e produtividade.
- [x] Monaco Editor com syntax highlighting, autocompletar e múltiplos arquivos.
- [x] Terminal Xterm.js integrado ao WebContainer API para executar Node.js no navegador.
- [x] Persistência local do sistema de arquivos virtual via IndexedDB.
- [x] Backup e restauração da sessão local.
- [x] Painel de configurações para editor, terminal, fontes, tamanhos e atalhos.
- [x] Extensibilidade por extensões locais registradas pelo usuário.
- [x] Exportação e importação de projetos como ZIP.
- [x] Sincronização autenticada de projetos com o banco de dados.
- [x] PWA com manifest e service worker para uso offline.
- [x] Testes unitários e validação visual das principais interações.

## Histórico de restauração

- [x] Reaplicar a implementação visual e funcional da IDE após a restauração do sandbox.

- [x] Corrigir erro de carregamento `Uncaught SyntaxError: Unexpected token '<'` na rota principal `/?from_webdev=1` e validar o build/preview.
- [x] Corrigir o Monaco Editor que está renderizando somente uma linha visível, garantindo altura flexível e resize correto.
