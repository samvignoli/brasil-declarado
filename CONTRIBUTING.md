# Como contribuir

Obrigado pelo interesse em melhorar o Brasil declarado.

## Antes de abrir um pull request

1. Descreva claramente o problema estatístico, editorial ou técnico.
2. Preserve a distinção entre declarantes, população e declarações entregues.
3. Não acrescente interpretações causais sem evidência que sustente o mecanismo.
4. Não tente reidentificar pessoas ou contornar os limiares de proteção.
5. Execute `npm test` e explique qualquer alteração nos resultados numéricos.

## Desenvolvimento

```bash
npm install
npm run dev
npm test
```

## Dados e privacidade

O projeto trabalha somente com agregados. Pull requests que incluam dados
pessoais, tentativas de reidentificação ou arquivos sem proveniência verificável
serão recusados.

Arquivos grandes, bancos locais e credenciais nunca devem ser adicionados ao
Git. O banco DuckDB completo é distribuído somente como asset de Release.

## Estilo editorial

- informe denominadores e tamanho dos grupos;
- diferencie média, total e participação;
- explicite limitações de cobertura e mensuração;
- evite usar uma ocupação rara como retrato de todo um setor;
- trate raça, gênero, classe e território como estruturas, sem essencializar
  indivíduos.

