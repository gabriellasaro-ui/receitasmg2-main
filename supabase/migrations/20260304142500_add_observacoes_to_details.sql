-- Adiciona coluna de observações na tabela de detalhes de vendas do closer
ALTER TABLE public.closer_sales_detail ADD COLUMN IF NOT EXISTS observacoes text;

-- Adiciona coluna de observações na tabela de detalhes de contratos de pré-vendas
ALTER TABLE public.pv_contracts_detail ADD COLUMN IF NOT EXISTS observacoes text;

-- Comentários para documentação do schema
COMMENT ON COLUMN public.closer_sales_detail.observacoes IS 'Observações extras da venda, incluindo vínculos com SDR';
COMMENT ON COLUMN public.pv_contracts_detail.observacoes IS 'Observações extras do contrato, incluindo vínculos com Closer';
