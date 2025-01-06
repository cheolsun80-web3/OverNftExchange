// src/components/Layout.jsx
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Link } from "react-router-dom";

export const Layout = ({ children }) => {
  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link to="/" className="text-2xl font-bold text-sky-400 hover:text-sky-500 transition-colors">
            <span className="text-sky-600">O</span>ver
            <span className="text-sky-600">N</span>ft
            <span className="text-sky-600">E</span>xchange
          </Link>
          <ConnectButton.Custom>
            {({
              account,
              chain,
              openAccountModal,
              openChainModal,
              openConnectModal,
              mounted,
            }) => {
              const ready = mounted;
              const connected = ready && account && chain;

              return (
                <div
                  {...(!ready && {
                    'aria-hidden': true,
                    'style': {
                      opacity: 0,
                      pointerEvents: 'none',
                      userSelect: 'none',
                    },
                  })}
                >
                  {(() => {
                    if (!connected) {
                      return (
                        <button
                          onClick={openConnectModal}
                          className="px-6 py-2.5 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-all duration-200 shadow-sm"
                        >
                          Connect
                        </button>
                      );
                    }

                    if (chain.unsupported) {
                      return (
                        <button
                          onClick={openChainModal}
                          className="px-6 py-2.5 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-all duration-200 shadow-sm"
                        >
                          Wrong network
                        </button>
                      );
                    }

                    return (
                      <div className="flex gap-3">
                        <button
                          onClick={openAccountModal}
                          className="px-3 sm:px-6 py-2.5 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-all duration-200 shadow-sm truncate max-w-[160px] sm:max-w-none"
                        >
                          {account.displayName}
                        </button>
                      </div>
                    );
                  })()}
                </div>
              );
            }}
          </ConnectButton.Custom>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 py-8">{children}</main>
    </div>
  );
};
