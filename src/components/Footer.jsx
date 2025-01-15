import { env } from "../env";

export const Footer = () => {
  return (
    <footer className="bg-white/70 backdrop-blur-sm border-t border-white/80">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="text-center">
          <p className="text-slate-600 mb-4">
            OverNftExchange by{" "}
            <a
              href="mailto:cheolsun80@gmail.com"
              className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 transition-all duration-300"
            >
              cheolsun80
            </a>
          </p>
          <div className="flex justify-center gap-6">
            <a
              href="https://github.com/cheolsun80-web3"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-500 hover:text-indigo-600 transition-colors duration-200"
            >
              GitHub
            </a>
            <a
              href="https://discord.gg/afzfh5g7Xw"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-500 hover:text-indigo-600 transition-colors duration-200"
            >
              Discord
            </a>
            <a
              href={`https://scan.over.network/address/${env.contracts.NFTExchange}?tab=contract`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-500 hover:text-indigo-600 transition-colors duration-200"
            >
              ONE-Contract
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}; 