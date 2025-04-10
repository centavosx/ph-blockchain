'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Typography } from '@/components/ui/typography';
import {
  getBlocksQueryAdapter,
  useGetBlocksQuery,
} from '@/hooks/api/use-get-blocks';
import { Events } from '@ph-blockchain/api';
import { Block } from '@ph-blockchain/block';
import { useEffect, useState } from 'react';

export const BlockSection = () => {
  const { data } = useGetBlocksQuery({});

  const [blocks, setBlocks] = useState(data ?? []);

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

      setBlocks((prev) => {
        const newBlock = [
          ...getBlocksQueryAdapter({ data: [block.toJson(false)] }),
          ...prev,
        ];

        if (newBlock.length > 3) {
          newBlock.pop();
        }

        return newBlock;
      });
    });

    return off;
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <Label asChild>
        <Typography as="h4">Latest Blocks</Typography>
      </Label>
      {blocks.map((value) => (
        <Card className="shadow-xl" key={value.blockHash}>
          <CardHeader className="gap-2">
            <CardTitle>Block #{value.height}</CardTitle>
            <CardDescription className="flex flex-col gap-2">
              <Typography className="text-wrap break-all" as="muted">
                Hash:
                {value.blockHash}
              </Typography>
              {!!value.displayCreated && (
                <Typography as="small">
                  Created: {value.displayCreated}
                </Typography>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <Typography className="text-wrap break-all" as="muted">
              Previous: {value.previousHash}
            </Typography>
            <Typography className="text-wrap break-all" as="muted">
              Merkle: {value.merkleRoot}
            </Typography>
            <Typography className="text-wrap break-all" as="muted">
              Target: {value.targetHash}
            </Typography>
            <Typography as="large">
              Transactions: {value.transactionSize}
            </Typography>
            <Button className="max-w-32 mt-4" href={value.viewLink}>
              View
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
