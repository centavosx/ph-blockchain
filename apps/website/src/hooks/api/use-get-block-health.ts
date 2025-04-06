import { getQueryClient } from '@/lib/query-client';
import { Block } from '@ph-blockchain/api';
import { BlockHealthResult } from '@ph-blockchain/api/src/types/block';
import { Transform } from '@ph-blockchain/transformer';
import { QueryClient, useQuery } from '@tanstack/react-query';

export const prefetchGetBlockHealthQuery = async ({
  queryClient = getQueryClient(),
}: {
  queryClient?: QueryClient;
}) => {
  await queryClient.prefetchQuery({
    queryKey: ['block', 'health'],
    queryFn: () => Block.getHealth(),
  });
  return queryClient;
};

export const useGetBlockHealthQuery = () => {
  return useQuery({
    queryKey: ['block', 'health'],
    queryFn: () => Block.getHealth(),
    select: adapter,
  });
};

const adapter = (response: { data: BlockHealthResult }) => {
  const { data } = response;
  return {
    supply: `${Transform.toHighestUnit(data.totalSupply)} / ${Transform.toHighestUnit(data.maxSupply)}`,
    numberOfBlocks: data.blocks,
    txSize: data.txSize,
  };
};
