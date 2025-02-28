// src/pages/Home.jsx
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { env } from "../env";

export const Home = () => {
  const [nfts, setNfts] = useState([]);

  useEffect(() => {
    const mockNFTs = env.NFTs;
    setNfts(mockNFTs);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 text-center mb-6">
          NFT Collections
        </h1>
        <p className="text-slate-600 text-center mb-16 max-w-2xl mx-auto text-lg">
          Discover and trade unique digital collectibles on the OverProtocol
        </p>
        <h1>Shut down for a month. If you need this site, you can take the code since it's open-source and use it. All of the deposited OVER in the contract has been returned.</h1>
        {/* <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {nfts.map((nft) => (
            <Link
              key={nft.address}
              to={`/nft/${nft.address}`}
              className="group bg-white/70 backdrop-blur-sm rounded-2xl overflow-hidden transform hover:-translate-y-1 transition-all duration-300 hover:shadow-[0_20px_50px_rgba(8,_112,_184,_0.1)] border border-white/80"
            >
              <div className="aspect-w-16 aspect-h-9 overflow-hidden bg-gradient-to-br from-indigo-50 to-purple-50">
                <img
                  src={nft.image}
                  alt={nft.name}
                  className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700 ease-out"
                />
              </div>
              <div className="p-8">
                <h2 className="text-xl font-semibold text-slate-800 group-hover:text-indigo-600 transition-colors duration-300">
                  {nft.name}
                </h2>
                <p className="mt-3 text-sm text-slate-500 font-mono bg-white/80 px-3 py-1.5 rounded-full inline-block shadow-sm">
                  {nft.address.slice(0, 10)}...{nft.address.slice(-8)}
                </p>
              </div>
            </Link>
          ))}
        </div> */}
      </div>
    </div>
  );
};
