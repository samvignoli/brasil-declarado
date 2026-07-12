-- Visão geral por exercício
SELECT
  exercicio,
  sum(contribuintes) AS declarantes,
  sum(rend_total) AS renda_total,
  sum(patrimonio) AS patrimonio_declarado,
  sum(rend_total) / sum(contribuintes) AS renda_media,
  sum(patrimonio) / sum(contribuintes) AS patrimonio_medio
FROM perfil
GROUP BY exercicio
ORDER BY exercicio;

-- Ocupações com maior patrimônio total em 2026
SELECT
  co_ocupacao,
  sum(contribuintes) AS declarantes,
  sum(patrimonio) AS patrimonio_total,
  sum(patrimonio) / sum(contribuintes) AS patrimonio_medio
FROM perfil
WHERE exercicio = 2026
GROUP BY co_ocupacao
ORDER BY patrimonio_total DESC
LIMIT 30;

-- Raça e gênero, preservando o aviso sobre raça não informada
SELECT
  genero,
  raca_cor,
  sum(contribuintes) AS declarantes,
  sum(rend_total) / sum(contribuintes) AS renda_media,
  sum(patrimonio) / sum(contribuintes) AS patrimonio_medio
FROM perfil
WHERE exercicio = 2026
GROUP BY genero, raca_cor
ORDER BY patrimonio_medio DESC;

