import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Link } from "react-router-dom";

export const Header = () => {
  return (
    <nav className="bg-white/70 backdrop-blur-sm border-b border-white/80">
      <div className="max-w-7xl mx-auto px-4 py-5 flex justify-between items-center">
        <Link to="/" className="group relative flex flex-col items-start">
          <span className="text-5xl font-black tracking-tight leading-none bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent group-hover:from-indigo-700 group-hover:to-purple-700 transition-all duration-300">
            ONE
          </span>
          <span className="text-xs font-medium tracking-widest uppercase text-slate-500 group-hover:text-slate-700 transition-all duration-300">
            Over Nft Exchange
          </span>
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
                          className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 shadow-sm"
                        >
                          Connect
                        </button>
                      );
                    }

                    if (chain.unsupported) {
                      return (
                        <button
                          onClick={openChainModal}
                          className="px-6 py-2.5 bg-gradient-to-r from-rose-600 to-pink-600 text-white rounded-xl hover:from-rose-700 hover:to-pink-700 transition-all duration-200 shadow-sm"
                        >
                          Wrong network
                        </button>
                      );
                    }

                    return (
                      <div className="flex gap-3">
                        <button
                          onClick={openAccountModal}
                          className="px-3 sm:px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 shadow-sm truncate max-w-[160px] sm:max-w-none"
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
  );
}; 