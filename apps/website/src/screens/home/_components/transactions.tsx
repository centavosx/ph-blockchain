'use client';

import { TransactionTable } from '@/components/app/transaction-table';
import { Typography } from '@/components/ui/typography';
import { useGetTransactionsQuery } from '@/hooks/api/use-get-transactions';
import { UiMapper } from '@/lib/ui-mapper';

import { Events } from '@ph-blockchain/api';
import { Block } from '@ph-blockchain/block';

import { useEffect, useState } from 'react';

export const TransactionsSection = () => {
  const { data } = useGetTransactionsQuery({
    limit: 20,
    reverse: true,
  });
  const [txs, setTxs] = useState(data?.data ?? []);

  useEffect(() => {
    const off = Events.createConfirmedBlockListener((data) => {
      const block = new Block(
        data.version,
        data.height,
        data.transactions || [],
        data.targetHash,
        data.previousHash,
        data.nonce,
        data.timestamp,
      );

      setTxs((prev) => {
        const newTxs = [
          ...UiMapper.transactions(
            block
              .decodeTransactions()
              .map((value) => value.decoded.serialize()),
          ),
          ...prev,
        ];

        return newTxs.slice(0, 20);
      });
    });

    return off;
  }, []);

  return (
    <div className="flex flex-col gap-4 w-full">
      <Typography as="h4">Latest Transactions</Typography>
      <TransactionTable data={txs} />
    </div>
  );
};
