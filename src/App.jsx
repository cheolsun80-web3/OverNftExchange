import { RainbowKitProvider, getDefaultWallets } from '@rainbow-me/rainbowkit';
import { WagmiConfig, createConfig, http } from 'wagmi';
// import { mainnet, sepolia } from 'wagmi/chains';
// import { createPublicClient, getContract } from 'viem';
import { Route, Routes, BrowserRouter } from 'react-router-dom';
import '@rainbow-me/rainbowkit/styles.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { connectorsForWallets } from '@rainbow-me/rainbowkit';
import {walletConnectWallet,} from '@rainbow-me/rainbowkit/wallets';

import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { NFTCollection } from './pages/NFTCollection';

import { env } from './env';

const overChain = {
  id: 54176,
  name: 'OverProtocol Mainnet',
  network: 'OverProtocol Mainnet',
  nativeCurrency: {
    decimals: 18,
    symbol: 'OVER',
  },
  rpcUrls: {
    default: { http: ['https://rpc.overprotocol.com'] },
    public: { http: ['https://rpc.overprotocol.com'] },
  },
  contracts: {
    multicall3: {
      address: env.contracts.Multicall3,
      blockCreated: 5882,
    },
  },
  // id: 31337,
  // name: 'Local Chain',
  // network: 'localhost',
  // nativeCurrency: {
  //   decimals: 18,
  //   name: 'Ethereum',
  //   symbol: 'ETH',
  // },
  // rpcUrls: {
  //   default: { http: ['http://127.0.0.1:8545'] },
  //   public: { http: ['http://127.0.0.1:8545'] },
  // },
};

const connectors = connectorsForWallets(
  [
    {
      groupName: 'Recommended',
      wallets: [walletConnectWallet],
    }
  ],
  {
    appName: 'ONE OverNftExchange',
    projectId: 'c827f82cc2a16ca18e73a3c7d189e06c',
  }
);

const { wallets } = getDefaultWallets({
  appName: 'OverNftExchange',
  projectId: 'c827f82cc2a16ca18e73a3c7d189e06c', // WalletConnect Cloud에서 발급받은 프로젝트 ID
  chains: [overChain]
});

const config = createConfig({
  chains: [overChain],
  transports: {
    [overChain.id]: http()
  },
  wallets,
  connectors,
});

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WagmiConfig config={config}>
        <RainbowKitProvider chains={[overChain]}>
          <BrowserRouter>
            <Layout>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/nft/:address" element={<NFTCollection />} />
              </Routes>
            </Layout>
          </BrowserRouter>
        </RainbowKitProvider>
      </WagmiConfig>
    </QueryClientProvider>
  );
}

export default App;
