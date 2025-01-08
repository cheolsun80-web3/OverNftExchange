import { RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { WagmiProvider, http } from 'wagmi';
import { Route, Routes, BrowserRouter } from 'react-router-dom';
import '@rainbow-me/rainbowkit/styles.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { getDefaultConfig } from '@rainbow-me/rainbowkit';

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
};

const config = getDefaultConfig({
  appName: 'OverNftExchange',
  projectId: '43c084b035366019001c72732c344615',
  chains: [overChain],
  transports: {
    [overChain.id]: http()
  },
});


const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WagmiProvider config={config}>
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
      </WagmiProvider>
    </QueryClientProvider>
  );
}

export default App;
