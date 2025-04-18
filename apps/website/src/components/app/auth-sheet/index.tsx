'use client';

import { User } from 'lucide-react';
import { Sheet, SheetTrigger } from '../../ui/sheet';

import { useGetAccountByIdQuery } from '@/hooks/api/use-get-account-by-id';
import { useAuthStore } from '@/hooks/use-auth';
import { useUserAccountStore } from '@/hooks/use-user-account';
import { Events } from '@ph-blockchain/api';
import { Minter, Transaction } from '@ph-blockchain/block';
import { Transform } from '@ph-blockchain/transformer';
import { useEffect, useMemo, useRef } from 'react';
import { Button } from '../../ui/button';
import { appToast } from '../custom-toast';
import { Account } from './account';
import { LoginSheetContent } from './login';
import { RegisterSheetContent } from './register';
import { useQueryClient } from '@tanstack/react-query';
import { useGetPendingTransactionsByWalletAddressQuery } from '@/hooks/api/use-get-pending-transactions-by-wallet-address';
import { Defaults } from '@/constants/defaults';

export const AuthSheet = () => {
  const queryClient = useQueryClient();
  const txListenerRef = useRef<() => void>(null);
  const leaveAccountRef = useRef<() => void>(null);

  const { storedAccount, account, logout } = useAuthStore();
  const { setAccount, removeTxById, setPendingTxs } = useUserAccountStore();

  const rawAddress = useMemo(() => {
    if (!account) return '';
    const signedAccountAddress = account.getSignedAccount(0).walletAddress;
    return Transform.removePrefix(signedAccountAddress, Transaction.prefix);
  }, [account]);

  const { data: fetchedAccount } = useGetAccountByIdQuery(
    rawAddress,
    !rawAddress,
  );

  const { data: _pendingTxs } = useGetPendingTransactionsByWalletAddressQuery(
    rawAddress,
    !rawAddress,
  );

  useEffect(() => {
    setPendingTxs(_pendingTxs ?? []);
  }, [_pendingTxs, setPendingTxs]);

  useEffect(() => {
    if (!account) {
      return;
    }

    const timeoutId = setTimeout(() => {
      logout();
      appToast({
        type: 'error',
        title: 'Session ended.',
        subtitle: 'Please re-login again to use your account.',
      });
    }, 180000);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [account, logout, queryClient, rawAddress]);

  useEffect(() => {
    if (!fetchedAccount) return;

    setAccount({
      size: fetchedAccount.size?.toString(),
      nonce: fetchedAccount.nonce,
      address: fetchedAccount.address,
      amount: fetchedAccount.amount,
    });

    const off = Events.createAccountInfoListener((value) => {
      if (value.address === rawAddress) {
        setAccount(value);
      }
    });

    if (!txListenerRef.current) {
      leaveAccountRef.current = Events.subscribeAccount(rawAddress);
      txListenerRef.current = Events.createTransactionListener((data) => {
        const isReceive = data.to === fetchedAccount.displayAddress;
        const isSent = data.from === fetchedAccount.displayAddress;

        if (isSent) {
          removeTxById(data.transactionId);
        }

        if (isReceive || isSent) {
          const purpose = isReceive
            ? data.from === Minter.address
              ? 'Minted'
              : 'Received'
            : 'Sent';
          appToast({
            type: 'success',
            title: purpose,
            subtitle: `You have successfully ${purpose.toLowerCase()} ${Transform.toHighestUnit(data.amount)} ${Defaults.nativeCoinName}`,
            messages: [
              `Hash: ${data.transactionId}`,
              `Height: ${data.blockHeight}`,
            ],
          });
        }
      });
    }
    return () => {
      off();
    };
  }, [fetchedAccount, setAccount, rawAddress, removeTxById]);

  useEffect(() => {
    if (!storedAccount) {
      txListenerRef.current?.();
      txListenerRef.current = null;
      leaveAccountRef.current?.();
      leaveAccountRef.current = null;
    }
  }, [storedAccount]);

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline">
          <User />
          Login
        </Button>
      </SheetTrigger>

      {!account ? (
        !!storedAccount ? (
          <LoginSheetContent />
        ) : (
          <RegisterSheetContent />
        )
      ) : (
        <Account />
      )}
    </Sheet>
  );
};
