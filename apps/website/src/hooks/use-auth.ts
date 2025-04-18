import { WalletAccount } from '@ph-blockchain/block';
import { decryptWithPassword, encryptWithPassword } from './../lib/encrypt';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Derivation = {
  name: string;
};
export type UseAuthStore = {
  account?: WalletAccount;
  storedAccount?: {
    data: string;
  };
  register: (data: string, password: string) => Promise<void>;
  login: (password: string) => Promise<void>;
  logout: () => void;
  reset: () => void;
};

export const useAuthStore = create<
  UseAuthStore,
  [['zustand/persist', Partial<UseAuthStore>]]
>(
  persist(
    (set, get) => ({
      storedAccount: undefined,
      register: async (data, password) => {
        const encryptedData = await encryptWithPassword(data, password);
        const account = new WalletAccount(data);
        await account.init();
        set({
          account,
          storedAccount: {
            data: encryptedData,
          },
        });
      },
      login: async (password) => {
        const storedAccount = get().storedAccount;
        if (!storedAccount) throw new Error('No account added');
        const data = await decryptWithPassword(storedAccount.data, password);

        const account = new WalletAccount(data);
        await account.init();
        set({
          account,
        });
      },
      logout: () => {
        set({
          account: undefined,
        });
      },
      reset: () => {
        set({
          account: undefined,
          storedAccount: undefined,
        });
      },
    }),
    {
      name: 'auth',
      partialize: (state) => ({
        storedAccount: state.storedAccount,
      }),
    },
  ),
);
