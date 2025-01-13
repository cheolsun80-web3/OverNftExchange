export const env = {
    "contracts": {
        "WETH": "0x59c914C8ac6F212bb655737CC80d9Abc79A1e273",
        "NFTExchange": "0x45b737bB344766209170a024a90bFE94E214c4d9",
        "Multicall3": "0x03657CDcDA1523C073b5e09c37dd199E6fBD1b99",
    },
    "NFTs": [
        {
          address: "0x6f969f215E77bEaeC5c92b3344BddbCe8DA67604",
          image: "https://i.seadn.io/s/raw/files/952369bd07d4f4762101d7d8e3ed54f5.png?auto=format&dpr=1&w=1000",
          name: "Nethers",
          imageUrl: function(tokenId) {
            return `https://nethers-nft.nethers.app/nft/${tokenId}.jpg`;
          }
        },
    ],
}

export const log = (...args) => {
  if (new URL(window.location.href).protocol === "http:") {
    console.log('debug', ...args);
  }
}
