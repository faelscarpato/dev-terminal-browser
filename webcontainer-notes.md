# WebContainer API — notas de implementação

Fontes oficiais consultadas:

- https://webcontainers.io/guides/quickstart
- https://webcontainers.io/api

A instalação oficial usa o pacote `@webcontainer/api`. O runtime deve ser inicializado uma única vez por página com `WebContainer.boot()`. A API fornece `mount(FileSystemTree)`, `spawn(command, args, options)`, `fs` e o evento `server-ready`. O processo expõe `output`, `input`, `exit` e pode receber `resize` para terminais interativos.

A documentação informa que WebContainers dependem de `SharedArrayBuffer`, isolamento cross-origin e cabeçalhos `Cross-Origin-Opener-Policy: same-origin` e `Cross-Origin-Embedder-Policy: require-corp`; em produção, a página precisa ser servida por HTTPS. A implementação deste projeto adiciona esses cabeçalhos no servidor e usa `coep: "require-corp"` no boot. Quando o navegador não fornece isolamento seguro, a interface mantém editor e persistência local disponíveis e mostra um estado degradado no terminal.

A exportação oficial do WebContainer também suporta formatos como ZIP, mas a IDE usa `jszip` para manter a exportação/importação alinhada ao modelo de arquivos local e permitir restauração independente do runtime.
