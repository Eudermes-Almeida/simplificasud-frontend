SVGs de bandeira vendorizados a partir do pacote npm "flag-icons" (MIT license,
https://github.com/lipis/flag-icons), pasta flags/4x3/. Copiados diretamente como assets
estaticos (em vez de registrar o CSS do pacote em angular.json) porque o build do Angular
(esbuild) da colisao de nomes de arquivo ("Two output files share the same path but have
different contents") entre as variantes 4x3/ e 1x1/ de alguns codigos de bandeira nao usados
aqui (pc, sh-ac, sh-hl, sh-ta, un, xk) quando o flag-icons.css completo e incluido.

Paises usados no projeto (missionarios-retornados): br, ve, ar, cl, cv, us, jp, mx, mz, pt.
