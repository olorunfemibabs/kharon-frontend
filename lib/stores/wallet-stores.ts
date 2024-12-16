import { create } from "zustand";
import { Wallet } from "@/lib/types/wallet";
import { WalletService } from "@/lib/services/wallet-service";
import { UserService } from "@/lib/services/user-service";
import { useAuthStore } from "./use-auth-store";

interface WalletState {
  wallets: Wallet[];
  isLoading: boolean;
  error: string | null;
  fetchUserWallets: () => Promise<void>;
  addWallet: (
    userId: string,
    address: string,
    network: string
  ) => Promise<void>;
  removeWallet: (userId: string, address: string) => Promise<void>;
  updateWallet: (
    userId: string,
    address: string,
    newNetwork: string
  ) => Promise<void>;
  setWallets: (wallets: Wallet[]) => void;
}

export const useWalletStore = create<WalletState>((set) => ({
  wallets: [],
  isLoading: false,
  error: null,

  fetchUserWallets: async () => {
    set({ isLoading: true, error: null });
    try {
      const userEmail = useAuthStore.getState().user?.email;
      if (!userEmail) throw new Error("User email not found");

      const userProfile = await UserService.getUserByEmail(userEmail);
      if (!userProfile?.id) throw new Error("User ID not found");

      const wallets = await WalletService.fetchWallets(userProfile.id);
      set({ wallets, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },

  addWallet: async (userId, address, network) => {
    try {
      const wallet = await WalletService.addWallet({
        user_id: userId,
        wallet_address: address,
        network,
      });
      set((state) => ({
        wallets: [...state.wallets, wallet],
      }));
    } catch (error) {
      console.error("Failed to add wallet:", error);
      throw error;
    }
  },

  removeWallet: async (userId, address) => {
    try {
      await WalletService.deleteWallet({
        user_id: userId,
        wallet_address: address,
      });
      set((state) => ({
        wallets: state.wallets.filter((w) => w.address !== address),
      }));
    } catch (error) {
      console.error("Failed to remove wallet:", error);
      throw error;
    }
  },

  updateWallet: async (userId, address, newNetwork) => {
    try {
      const updated = await WalletService.updateWallet({
        user_id: userId,
        wallet_address: address,
        new_network: newNetwork,
      });
      set((state) => ({
        wallets: state.wallets.map((w) =>
          w.address === address ? updated : w
        ),
      }));
    } catch (error) {
      console.error("Failed to update wallet:", error);
      throw error;
    }
  },

  setWallets: (wallets) => set({ wallets }),
}));