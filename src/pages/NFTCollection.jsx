// src/pages/NFTCollection.jsx
import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  usePublicClient,
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { parseEther, formatEther, isAddress } from "viem";
import { env, log } from "../env";
import { abi } from "../utils/abi";
import { lang } from "../utils/lang";
export const NFTCollection = () => {
  const { address } = useParams();
  const { address: wallet, isConnected } = useAccount();
  const [walletOld, setWalletOld] = useState(wallet);
  const [balance, setBalance] = useState(0);
  const [balanceWOVER, setBalanceWOVER] = useState(0);
  const [balanceNFT, setBalanceNFT] = useState(0);
  const [nftTotalSupply, setNftTotalSupply] = useState(null);
  const [asks, setAsks] = useState([]);
  const [bids, setBids] = useState([]);
  const [bidPrice, setBidPrice] = useState(0);
  const [topBid, setTopBid] = useState({ bidder: "", price: 0 });
  const [history, setHistory] = useState([]);
  const [historySize, setHistorySize] = useState(0);
  const [myNfts, setMyNfts] = useState([]);
  const [selectedTab, setSelectedTab] = useState("sell");
  const [showMyNftsModal, setShowMyNftsModal] = useState(false); // 모달 상태
  const [sellType, setSellType] = useState("ASK");
  const [showBidModal, setShowBidModal] = useState(false); // 모달 상태
  const [showNftTransferModal, setShowNftTransferModal] = useState(false); // 모달 상태
  const [update, setUpdate] = useState(0);
  const [updateBalance, setUpdateBalance] = useState(0);
  const navigate = useNavigate();
  const publicClient = usePublicClient();
  const { writeContractAsync, isPending } = useWriteContract();
  const [isWaiting, setIsWaiting] = useState(false);

  const [langCode, setLangCode] = useState("en");
  const [hash, setHash] = useState(null);
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    });
  const [sortType, setSortType] = useState("priceAsc");
  const [historySort, setHistorySort] = useState("blockDesc"); // 기본값: 최신 블록순
  const [notifications, setNotifications] = useState([]);
  const [showTopInfo, setShowTopInfo] = useState(true); // useState import 확인

  useEffect(() => {
    if (walletOld != wallet) {
      setUpdate(update + 1);
      setUpdateBalance(updateBalance + 1);
      setWalletOld(wallet);
    }
  }, [wallet]);

  // get lang from browser
  useEffect(() => {
    const lang = navigator.language.split("-")[0];
    if (["en", "ko"].includes(lang)) {
      setLangCode(lang);
    }
  }, []);

  // 페이지 로드 시 잘못된 NFT 주소면 홈으로 이동
  useEffect(() => {
    const NFTs = env.NFTs.map((nft) => nft.address);
    if (!NFTs.includes(address)) {
      navigate("/");
    }
  }, [address, navigate]);

  // 지갑이 연결된 경우, 사용자가 보유 중인 NFT 목록 불러오기
  useEffect(() => {
    if (!isConnected) return;
    (async () => {
      try {
        const nfts = await fetch(`https://scan.over.network/api/v2/tokens/${address}/instances?holder_address_hash=${wallet}`).then((r) => r.json());

        const items = [];
        for (const item of nfts.items || []) {
          items.push({
            tokenId: item.id,
            imageUrl: item.image_url,
          });
        }
        setMyNfts(items);
      } catch (err) {
        console.error(err);
      }
    })();
  }, [address, wallet, isConnected, update]);

  useEffect(() => {
    (async () => {
      try {
        const data = await publicClient.readContract({
          address: env.contracts.NFTExchange,
          abi: abi.NFTExchange,
          functionName: "getActiveAsks",
          args: [address],
        });
        log("Active Asks:", data);
        const items = [];
        for (const item of data || []) {
          items.push({
            tokenId: Number(item.idx),
            price: formatEther(item.price),
            seller: item.seller,
            expiration: Number(item.expiration),
          });
        }

        if (items.length == 0) {
          setAsks([]);
          return;
        }

        for (let i = 0; i < items.length; i++) {
          let item = items[i];
          items[i].imageUrl = env.NFTs[0].imageUrl(item.tokenId);
        }

        const sortedItems = [...items].sort((a, b) => {
          switch (sortType) {
            case "priceAsc":
              return Number(a.price) - Number(b.price);
            case "priceDesc":
              return Number(b.price) - Number(a.price);
            case "timeAsc":
              return Number(a.expiration) - Number(b.expiration);
            case "timeDesc":
              return Number(b.expiration) - Number(a.expiration);
            default:
              return Number(a.price) - Number(b.price);
          }
        });

        setAsks(sortedItems);
        log("Asks:", sortedItems);
      } catch (err) {
        console.error(err);
      }
    })();
  }, [address, publicClient, update, sortType]);


  useEffect(() => {
    (async () => {
      try {
        const totalSupply = await publicClient.readContract({
          address: address,
          abi: abi.ERC721,
          functionName: "totalSupply",
        });
        setNftTotalSupply(Number(totalSupply));
      } catch (err) {
        console.error(err);
        setNftTotalSupply(null);
      }
    })();
  }, [address]);

  useEffect(() => {
    (async () => {
      if (update == 0) {return;}
      try{
        const datas = [];
        // 0. getTopBid
        // 1. getBids
        // 2. getTradeHistoryLast
        // 3. getTradeHistorySize(address)

        datas.push({
          address: env.contracts.NFTExchange,
          abi: abi.NFTExchange,
          functionName: "getTopBid",
          args: [address],
        });

        datas.push({
          address: env.contracts.NFTExchange,
          abi: abi.NFTExchange,
          functionName: "getBids",
          args: [address],
        });

        datas.push({
          address: env.contracts.NFTExchange,
          abi: abi.NFTExchange,
          functionName: "getTradeHistoryLast",
          args: [address, 100],
        });

        datas.push({
          address: env.contracts.NFTExchange,
          abi: abi.NFTExchange,
          functionName: "getTradeHistorySize",
          args: [address],
        });

        const results = await publicClient.multicall({
          contracts: datas
        });
        log('Multicall3:', results);

        {
          const topBid = results[0].result;
          setTopBid({
            bidder: topBid.bidder.bidder,
            price: formatEther(topBid.price),
          });
        }
        {
          const bids = results[1].result;
          const items = [];
          for (const item of bids || []) {
            items.push({
              bidder: item.bidder.bidder,
              nonce: item.bidder.nonce,
              price: formatEther(item.price),
            });
          }
          items.sort((a, b) => {
            return b.price - a.price;
          });
          setBids(items);
        }
        {
          const tradeHistory = results[2].result;
          const items = [];
          for (const item of tradeHistory || []) {
            items.push({
              tokenId: Number(item.tokenId),
              seller: item.seller,
              buyer: item.buyer,
              price: formatEther(item.price),
              bn: Number(item.bn),
            });
          }
          setHistory(items);
        }

        {
          const size = results[3].result;
          setHistorySize(Number(size));
        }
      } catch (err) {
        console.error(err);
      }
    })();
  }, [update]);

  useEffect(() => {
    (async () => {
      if (updateBalance == 0) {return;}
      try {
        if (!wallet) return;
        const balance = await publicClient.getBalance({ address: wallet });
        let balanceOver = formatEther(balance);
        // float point 2
        balanceOver = parseFloat(balanceOver).toFixed(2);
        setBalance(balanceOver);
        
        const datas = [];
        // 0. balanceOf WETH
        // 1. balanceOf NFT

        datas.push({
          address: env.contracts.WETH,
          abi: abi.WETH,
          functionName: "balanceOf",
          args: [wallet],
        });
        datas.push({
          address: address,
          abi: abi.ERC721,
          functionName: "balanceOf",
          args: [wallet],
        });
        const results = await publicClient.multicall({ contracts: datas });
        log('updateBalance:', results);

        const balanceWOVER = results[0].result;
        const balanceNFT = Number(results[1].result);
        let balanceWOVEROver = formatEther(balanceWOVER);
        balanceWOVEROver = parseFloat(balanceWOVEROver).toFixed(2);

        setBalanceWOVER(balanceWOVEROver);
        setBalanceNFT(balanceNFT);
      } catch (err) {
        console.error(err);
      }
    })();
  }, [updateBalance]);

  // setInterval update balance over
  useEffect(() => {
    const intervalUpdateBalance = setInterval(() => {
      setUpdateBalance(updateBalance + 1);
    }, 10000);
    const intervalUpdate = setInterval(() => {
      setUpdate(update + 1);
    }, 30000);
    setUpdateBalance(updateBalance + 1);
    setUpdate(update + 1);
    return () => {
      clearInterval(intervalUpdateBalance);
      clearInterval(intervalUpdate);
    }
  }, []);

  const tryWriteContractAsync = async (...args) => {
    try {
      return await writeContractAsync(...args);
    } catch (err) {
      alert(err.message);
      return false;
    }
  }

  const checkApprovalInner = async (tokenId) => {
    const getApproved = await publicClient.readContract({
      address: address,
      abi: abi.ERC721,
      functionName: "getApproved",
      args: [tokenId],
    });
    log("getApproved:", getApproved);

    if (getApproved != env.contracts.NFTExchange) {
      alert(lang[langCode].errors.approve);
      var txhash = await tryWriteContractAsync({
        address: address,
        abi: abi.ERC721,
        functionName: "approve",
        args: [env.contracts.NFTExchange, tokenId],
      });
      log("approve:", txhash);
      setHash(txhash);
      return false;
    }
    return true;
  };
  const checkApproval = async (tokenId) => {
    if (await checkApprovalInner(tokenId)) return;
    // wait for isConfirming
    while (isPending || isConfirming) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      log("waiting for isConfirming", isConfirming);
    }
    await new Promise((resolve) => setTimeout(resolve, 6000));
    // check again
    await checkApproval(tokenId);
  };
  const handleTransferNft = async (tokenId) => {
    setIsWaiting(true);
    var txhash;
    const toAddress = prompt(lang[langCode].prompts.transferToAddress.replace("%s", env.NFTs.find(nft => nft.address === address).name).replace("%s", tokenId));
    if (!toAddress || toAddress.length != 42 || !toAddress.startsWith("0x") || !isAddress(toAddress, {strict: true})) {
      alert(lang[langCode].errors.address);
      setIsWaiting(false);
      return;
    }

    const confirmed = confirm(lang[langCode].prompts.transferConfirm.replace("%s", env.NFTs.find(nft => nft.address === address).name).replace("%s", tokenId).replace("%s", toAddress));
    if (!confirmed) {
      setIsWaiting(false);
      return;
    }

    txhash = await tryWriteContractAsync({
      address: address,
      abi: abi.ERC721,
      functionName: "transferFrom",
      args: [wallet, toAddress, tokenId],
    });
    setHash(txhash);
    log("transferFrom:", txhash);
    while (isPending || isConfirming) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      log("waiting for isConfirming", isConfirming);
    }
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsWaiting(false);
    setUpdateBalance(updateBalance+1);setUpdate(update + 1);
    setShowMyNftsModal(false);
  }
  // NFT를 선택했을 때 (예: 판매 트랜잭션 실행 등)
  const handleSelectNft = async (tokenId) => {
    setIsWaiting(true);
    await checkApproval(tokenId);
    var txhash;

    if (sellType === "ASK") {
      const price = prompt(lang[langCode].prompts.askPrice, "1");
      if (isNaN(price) || Number(price) < 1 || Number(price) > 999999999) {
        setIsWaiting(false);
        return alert(lang[langCode].errors.number);
      }
      const confirmed = confirm(
        lang[langCode].prompts.askConfirm.replace("%s", tokenId).replace("%s", price)
      );
      if (!confirmed) {
        setIsWaiting(false);
        return;
      }

      // function addAsk(IERC721 nft, uint256 tokenId, uint256 price)
      txhash = await tryWriteContractAsync({
        address: env.contracts.NFTExchange,
        abi: abi.NFTExchange,
        functionName: "addAsk",
        args: [address, tokenId, parseEther(price)],
      });
      setHash(txhash);
      log("addAsk:", txhash);
    } else if (sellType === "BID") {
      const confirmed = confirm(
        lang[langCode].prompts.bidConfirm.replace("%s", tokenId).replace("%s", topBid.price)
      );
      if (!confirmed) {
        setIsWaiting(false);
        return;
      }
      // function acceptBid(IERC721 nft, uint256 tokenId, uint256 minPrice)
      txhash = await tryWriteContractAsync({
        address: env.contracts.NFTExchange,
        abi: abi.NFTExchange,
        functionName: "acceptBid",
        args: [address, tokenId, parseEther(topBid.price)],
      });
      setHash(txhash);
      log("acceptBid:", txhash);
    }
    while (isPending || isConfirming) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      log("waiting for isConfirming", isConfirming);
    }
    await new Promise((resolve) => setTimeout(resolve, 6000));
    setIsWaiting(false);
    setUpdateBalance(updateBalance+1);setUpdate(update + 1);
    setShowMyNftsModal(false);
  };
  const handleBid = async (price) => {
    if (isNaN(price) || Number(price) < 1 || Number(price) > 999999999)
      return alert(lang[langCode].errors.number);
    if (Number(price) <= Number(topBid.price))
      return alert(lang[langCode].prompts.topBid);
    setIsWaiting(true);
    const confirmed = confirm(lang[langCode].prompts.bidConfirmBuy.replace("%s", price));
    if (!confirmed) {
      setIsWaiting(false);
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 6000));
    // function addBid(IERC721 nft, uint256 price) public payable {
    var txhash = await tryWriteContractAsync({
      address: env.contracts.NFTExchange,
      abi: abi.NFTExchange,
      functionName: "addBid",
      args: [address, parseEther(price)],
      value: parseEther(price),
    });
    setHash(txhash);
    log("addBid:", txhash);
    while (isPending || isConfirming) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      log("waiting for isConfirming", isConfirming);
    }
    await new Promise((resolve) => setTimeout(resolve, 6000));
    setIsWaiting(false);
    setUpdateBalance(updateBalance+1);setUpdate(update + 1);
    setShowBidModal(false);
  };

  const handleBuy = async (item) => {
    const confirmed = confirm(
      lang[langCode].prompts.bidConfirm.replace("%s", item.tokenId).replace("%s", item.price)
    );
    if (!confirmed) return;

    // function acceptAsk(IERC721 nft, uint256 tokenId, uint256 price) public payable {
    var txhash = await tryWriteContractAsync({
      address: env.contracts.NFTExchange,
      abi: abi.NFTExchange,
      functionName: "acceptAsk",
      args: [address, item.tokenId, parseEther(item.price)],
      value: parseEther(item.price),
    });
    setHash(txhash);
    log("buy:", txhash);
    while (isPending || isConfirming) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      log("waiting for isConfirming", isConfirming);
    }
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setUpdateBalance(updateBalance+1);setUpdate(update + 1);
  };

  const handleCancel = async (item) => {
    const confirmed = confirm(
      lang[langCode].prompts.askCancel.replace("%s", item.tokenId)
    );
    if (!confirmed) return;

    // function removeAsk(IERC721 nft, uint256 tokenId)
    var txhash = await tryWriteContractAsync({
      address: env.contracts.NFTExchange,
      abi: abi.NFTExchange,
      functionName: "removeAsk",
      args: [address, item.tokenId],
    });
    setHash(txhash);
    log("cancel:", txhash);
    while (isPending || isConfirming) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      log("waiting for isConfirming", isConfirming);
    }
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setUpdateBalance(updateBalance+1);setUpdate(update + 1);
  };

  const handleWithdrawWOVER = async () => {
    const confirmed = confirm(lang[langCode].prompts.withdrawWOVER);
    if (!confirmed) return;

    var txhash = await tryWriteContractAsync({
      address: env.contracts.WETH,
      abi: abi.WETH,
      functionName: "withdraw",
      args: [parseEther(balanceWOVER)],
    });
    setHash(txhash);
    log("withdrawWOVER:", txhash);
    while (isPending || isConfirming) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      log("waiting for isConfirming", isConfirming);
    }
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setUpdateBalance(updateBalance+1);setUpdate(update + 1);
  }

  const handleCancelBid = async (item) => {
    const confirmed = confirm(
      lang[langCode].prompts.bidCancel.replace("%s", item.price)
    );
    if (!confirmed) return;

    // function removeAsk(IERC721 nft, uint256 tokenId)
    var txhash = await tryWriteContractAsync({
      address: env.contracts.NFTExchange,
      abi: abi.NFTExchange,
      functionName: "removeBid",
      args: [address, item.nonce],
    });
    setHash(txhash);
    log("cancel:", txhash);
    while (isPending || isConfirming) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      log("waiting for isConfirming", isConfirming);
    }
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setUpdateBalance(updateBalance+1);setUpdate(update + 1);
  };

  // Add notification when hash is set
  useEffect(() => {
    if (hash) {
      const newNotification = {
        id: Date.now(),
        hash,
        timestamp: new Date(),
      };
      
      setNotifications(prev => [...prev, newNotification]);

      // Remove notification after 30 seconds
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== newNotification.id));
      }, 30000);
    }
  }, [hash]);

  const sortedHistory = [...history].sort((a, b) => {
    switch (historySort) {
      case "blockAsc":
        return Number(a.bn) - Number(b.bn);
      case "blockDesc":
        return Number(b.bn) - Number(a.bn);
      case "priceAsc":
        return Number(a.price) - Number(b.price);
      case "priceDesc":
        return Number(b.price) - Number(a.price);
      default:
        return Number(b.bn) - Number(a.bn);
    }
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-lg sm:text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
            {env.NFTs.find(nft => nft.address === address).name} Collection
          </h1>
          <button
            onClick={() => setShowTopInfo(!showTopInfo)}
            className="px-3 py-1.5 bg-white/80 backdrop-blur-sm border border-slate-200 rounded-lg text-slate-600 hover:text-slate-900 hover:border-slate-300 transition-all duration-200 text-sm flex items-center gap-1.5 shadow-sm hover:shadow group"
          >
            {showTopInfo ? (
              <>
                <span>{lang[langCode].etc.hide}</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 group-hover:-translate-y-0.5 transition-transform" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                </svg>
              </>
            ) : (
              <>
                <span>{lang[langCode].etc.show}</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 group-hover:translate-y-0.5 transition-transform" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </>
            )}
          </button>
        </div>

        <div id="top-info" className={`mb-8 grid grid-cols-2 gap-8 sm:grid-cols-3 transition-all duration-300 ${showTopInfo ? 'block' : 'hidden'}`}>
          {/* Left Side */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-white shadow-sm">
            <h1 className="text-lg sm:text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 mb-4">
              NFT: {env.NFTs.find(nft => nft.address === address).name}
            </h1>
            <p className="text-slate-500 font-mono">
              <a
                href={`https://scan.over.network/token/${address}`}
                target="_blank"
                rel="noreferrer"
                className="hover:text-indigo-600 transition-colors"
              >
                {address.slice(0, 10)}...
              </a>
            </p><br/>
            <p className="text-slate-500 font-mono">
              Total Supply
              <br/>
              {nftTotalSupply}
            </p><br/>

            <img src={env.NFTs.find(nft => nft.address === address).image} alt="NFT" className="w-full h-auto" />
          </div>
          {/* sm only view div */}
          <div className="hidden sm:block">
          </div>

          {/* Right Side */}
          {isConnected ? (
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-white shadow-sm">
              <div className="space-y-6">
                <div>
                  <h1 className="text-lg sm:text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 mb-4">Wallet</h1>
                  <p className="text-slate-500 font-mono">
                    <a
                      href={`https://scan.over.network/address/${wallet}`}
                      target="_blank"
                      rel="noreferrer"
                      className="hover:text-indigo-600 transition-colors"
                    >
                      {wallet.slice(0, 10)}...
                    </a>
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-slate-900 mb-2">Balance</h3>
                  <div className="flex flex-wrap gap-4 grid grid-cols-2">
                    <span className="px-2 py-2 bg-slate-50 rounded-xl text-slate-700 font-medium text-center text-sm md:text-base">
                      OVER<br/>{balance}
                    </span>
                    <span className="px-2 py-2 bg-slate-50 rounded-xl text-slate-700 font-medium text-center text-sm md:text-base">
                      WOVER<br/>{balanceWOVER}
                    </span>
                    <span className="px-2 py-2 bg-slate-50 rounded-xl text-slate-700 font-medium text-center text-sm md:text-base" onClick={() => setShowNftTransferModal(true)}>
                      NFT<br/>{balanceNFT}
                    </span>
                  </div>
                </div>
                {balanceWOVER > 0.1 && (
                  <div className="pt-2">
                    <button 
                      className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 shadow-sm w-full"
                      onClick={() => handleWithdrawWOVER()}
                    >
                      WOVER to OVER
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-white shadow-sm">
              <div className="flex flex-col items-center justify-center h-full space-y-4">
                <h1 className="text-lg sm:text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
                  Wallet
                </h1>
                <p className="text-slate-600 text-center">
                  {lang[langCode].errors.wallet}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-x-6 border-b border-slate-200">
          {["sell", "buy", "history"].map((tab) => (
            <button
              key={tab}
              className={`py-4 px-6 text-lg transition-all duration-200 ${
                selectedTab === tab
                  ? "border-b-2 border-indigo-500 text-indigo-600 font-medium"
                  : "text-slate-600 hover:text-slate-900"
              }`}
              onClick={() => setSelectedTab(tab)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Sell Orders Grid */}
        {selectedTab === "sell" && (
          <div className="mt-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-medium text-slate-900">Sell Orders</h2>
              <select
                className="px-4 py-2 border border-slate-200 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={sortType}
                onChange={(e) => setSortType(e.target.value)}
              >
                <option value="priceAsc">Price: Low to High</option>
                <option value="priceDesc">Price: High to Low</option>
                <option value="timeAsc">Time: Old to New</option>
                <option value="timeDesc">Time: New to Old</option>
              </select>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {asks.map((ask) => (
                <div
                  key={ask.tokenId}
                  className="bg-white/70 backdrop-blur-sm rounded-2xl overflow-hidden transform hover:-translate-y-1 transition-all duration-300 hover:shadow-[0_20px_50px_rgba(8,_112,_184,_0.1)] border border-white/80"
                >
                  <img
                    src={ask.imageUrl}
                    alt={`Token ${ask.tokenId}`}
                    className="w-full h-64 object-cover transform hover:scale-105 transition-all duration-700"
                  />
                  <div className="p-6 space-y-4">
                    <h3 className="text-lg font-medium text-slate-900">
                      Token ID:{" "}
                      <a
                        href={`https://scan.over.network/token/${address}/instance/${ask.tokenId}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-indigo-600 hover:text-indigo-700 transition-colors"
                      >
                        {ask.tokenId}
                      </a>
                    </h3>
                    <p className="text-slate-700 bg-slate-50 px-3 py-2 rounded-lg inline-block">
                      Price: {ask.price} OVER
                    </p>
                    <p className="text-slate-600">
                      Seller:{" "}
                      <a
                        href={`https://scan.over.network/address/${ask.seller}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-indigo-600 hover:text-indigo-700 transition-colors font-mono"
                      >
                        {ask.seller.slice(0, 8)}...{ask.seller.slice(-8)}
                      </a>
                    </p>
                    <p className="text-slate-600">
                      Expiration: {new Date(Number(ask.expiration) * 1000).toLocaleDateString()}
                    </p>
                    {wallet === ask.seller ? (
                      <button
                        className="w-full px-4 py-3 bg-gradient-to-r from-rose-600 to-pink-600 text-white rounded-xl hover:from-rose-700 hover:to-pink-700 transition-all duration-200 shadow-sm mt-4"
                        onClick={() => handleCancel(ask)}
                      >
                        Remove Ask
                      </button>
                    ) : isConnected ? (
                      <button
                        className="w-full px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 shadow-sm mt-4"
                        onClick={() => handleBuy(ask)}
                      >
                        Buy
                      </button>
                    ) : (
                      <button
                        className="w-full px-4 py-3 bg-slate-100 text-slate-400 rounded-xl cursor-not-allowed mt-4"
                        disabled
                      >
                        {lang[langCode].errors.wallet}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Buy Orders Table */}
        {selectedTab === "buy" && (
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl overflow-hidden border border-white/80">
            <h2 className="text-2xl font-medium text-slate-900 p-6 border-b border-slate-100">
              Buy Orders
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full divide-y divide-slate-200">
                <thead className="bg-slate-50/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Bidder
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Price (OVER)
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white/50 divide-y divide-slate-200">
                  {bids.map((bid, index) => (
                    <tr key={index} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <a
                          href={`https://scan.over.network/address/${bid.bidder}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-indigo-600 hover:text-indigo-700 transition-colors font-mono"
                        >
                          {bid.bidder.slice(0, 8)}...{bid.bidder.slice(-8)}
                        </a>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-slate-900 font-medium">
                        {bid.price} OVER
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {bid.bidder === wallet && (
                          <button
                            className="px-4 py-2 bg-gradient-to-r from-rose-600 to-pink-600 text-white rounded-lg hover:from-rose-700 hover:to-pink-700 transition-all duration-200"
                            onClick={() => handleCancelBid(bid)}
                          >
                            Cancel
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Trade History Table */}
        {selectedTab === "history" && (
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl overflow-hidden border border-white/80">
            <div className="flex justify-between items-center p-6 border-b border-slate-100">
              <h2 className="text-2xl font-medium text-slate-900">
                Trade History
              </h2>
              <select
                className="px-4 py-2 border border-slate-200 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={historySort}
                onChange={(e) => setHistorySort(e.target.value)}
              >
                <option value="blockDesc">Block: New to Old</option>
                <option value="blockAsc">Block: Old to New</option>
                <option value="priceDesc">Price: High to Low</option>
                <option value="priceAsc">Price: Low to High</option>
              </select>
            </div>
            <div className="p-6">
              <p className="text-slate-700 font-mono">
                Total Trade History: {historySize}
              </p>
              <p className="text-slate-500 font-mono">
                Average last 100 Price: {(history.reduce((acc, curr) => acc + Number(curr.price), 0) / history.length).toFixed(2)} OVER
              </p>
              <p className="text-slate-500 font-mono">
                Highest Price: {Math.max(...history.map(trade => Number(trade.price)))} OVER
              </p>
              <p className="text-slate-500 font-mono">
                Lowest Price: {Math.min(...history.map(trade => Number(trade.price)))} OVER
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full divide-y divide-slate-200">
                <thead className="bg-slate-50/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Block
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Token ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Seller
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Buyer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Price (OVER)
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white/50 divide-y divide-slate-200">
                  {sortedHistory.map((trade, index) => (
                    <tr key={index} className="hover:bg-slate-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <a
                          href={`https://scan.over.network/block/${trade.bn}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-slate-600 hover:text-slate-900 transition-colors"
                        >
                          {trade.bn}
                        </a>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <a
                          href={`https://scan.over.network/token/${address}/instance/${trade.tokenId}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-slate-600 hover:text-slate-900 transition-colors"
                        >
                          {trade.tokenId}
                        </a>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <a
                          href={`https://scan.over.network/address/${trade.seller}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-slate-600 hover:text-slate-900 transition-colors"
                        >
                          {trade.seller.slice(0, 8)}...{trade.seller.slice(-8)}
                        </a>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <a
                          href={`https://scan.over.network/address/${trade.buyer}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-slate-600 hover:text-slate-900 transition-colors"
                        >
                          {trade.buyer.slice(0, 8)}...{trade.buyer.slice(-8)}
                        </a>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-slate-900">
                        {trade.price} OVER
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        <div className="mt-8"></div>
        {/* Action Buttons */}
        {selectedTab === "sell" && (
          <div className="mb-8">
            {!isConnected && (
              <p className="mt-2 text-sm text-red-600">{lang[langCode].errors.wallet}</p>
            )}
            {isConnected && (
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  className="w-full sm:w-auto px-6 py-3 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-all duration-200 shadow-sm disabled:bg-slate-300 disabled:cursor-not-allowed whitespace-nowrap"
                  onClick={() => {
                    setSellType("ASK");
                    setShowMyNftsModal(true);
                  }}
                  disabled={!isConnected}
                >
                  Sell My Item
                </button>
                {balanceWOVER > 0.1 && (
                  <button 
                    className="w-full sm:w-auto px-6 py-3 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-all duration-200 shadow-sm disabled:bg-slate-300 disabled:cursor-not-allowed whitespace-nowrap"
                    onClick={() => handleWithdrawWOVER()}
                  >
                    WOVER to OVER
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {selectedTab === "buy" && (
          <div className="mb-8">
            {!isConnected && (
              <p className="mt-2 text-sm text-red-600">{lang[langCode].errors.wallet}</p>
            )}
            {isConnected && (
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  className="w-full sm:w-auto px-6 py-3 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-all duration-200 shadow-sm disabled:bg-slate-300 disabled:cursor-not-allowed whitespace-nowrap"
                  onClick={() => setShowBidModal(true)}
                  disabled={!isConnected}
                >
                  Make Bid (BuyOrder)
                </button>
                <button
                  className="w-full sm:w-auto px-6 py-3 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-all duration-200 shadow-sm disabled:bg-slate-300 disabled:cursor-not-allowed whitespace-nowrap"
                  onClick={() => {
                    setSellType("BID");
                    setShowMyNftsModal(true);
                  }}
                  disabled={!isConnected}
                >
                  Sell My Item to Top Bidder
                </button>
              </div>
            )}
          </div>
        )}
        {/* Modals */}
        {showNftTransferModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
              </div>

              <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                      <h3 className="text-lg leading-6 font-medium text-slate-900 mb-4">
                        Transfer My NFT
                      </h3>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {myNfts.map((nft) => (
                          <div
                            key={nft.tokenId}
                            className="group cursor-pointer"
                            onClick={() => handleTransferNft(nft.tokenId)}
                          >
                            <div className="relative aspect-square overflow-hidden rounded-lg border border-slate-200 group-hover:border-slate-300">
                              <img
                                src={nft.imageUrl}
                                alt={`Token ${nft.tokenId}`}
                                className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-200"
                              />
                              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-opacity" />
                            </div>
                            <p className="mt-2 text-sm text-center text-slate-600">
                              Token #{nft.tokenId}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="button"
                    className="mt-3 w-full inline-flex justify-center rounded-lg border border-slate-200 shadow-sm px-4 py-2 bg-white text-base font-medium text-slate-900 hover:bg-slate-50 focus:outline-none sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm transition-all duration-200"
                    onClick={() => setShowNftTransferModal(false)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        {/* Modals */}
        {showMyNftsModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
              </div>

              <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                      <h3 className="text-lg leading-6 font-medium text-slate-900 mb-4">
                        Select NFT to {sellType === "ASK" ? "Sell" : "Accept Bid"}
                      </h3>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {myNfts.map((nft) => (
                          <div
                            key={nft.tokenId}
                            className="group cursor-pointer"
                            onClick={() => handleSelectNft(nft.tokenId)}
                          >
                            <div className="relative aspect-square overflow-hidden rounded-lg border border-slate-200 group-hover:border-slate-300">
                              <img
                                src={nft.imageUrl}
                                alt={`Token ${nft.tokenId}`}
                                className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-200"
                              />
                              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-opacity" />
                            </div>
                            <p className="mt-2 text-sm text-center text-slate-600">
                              Token #{nft.tokenId}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="button"
                    className="mt-3 w-full inline-flex justify-center rounded-lg border border-slate-200 shadow-sm px-4 py-2 bg-white text-base font-medium text-slate-900 hover:bg-slate-50 focus:outline-none sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm transition-all duration-200"
                    onClick={() => setShowMyNftsModal(false)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {showBidModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
              </div>

              <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                      <h3 className="text-lg leading-6 font-medium text-slate-900 mb-4">
                        Make a Bid
                      </h3>
                      <div className="mt-2">
                        <input
                          type="number"
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                          placeholder="Enter bid amount in OVER"
                          value={bidPrice}
                          onChange={(e) => setBidPrice(e.target.value)}
                        />
                        {topBid.price > 0 && (
                          <p className="mt-2 text-sm text-slate-500">
                            Current top bid: {topBid.price} OVER
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="button"
                    className="w-full inline-flex justify-center rounded-lg border border-transparent shadow-sm px-4 py-2 bg-slate-900 text-base font-medium text-white hover:bg-slate-800 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm transition-all duration-200"
                    onClick={() => handleBid(bidPrice)}
                  >
                    Place Bid
                  </button>
                  <button
                    type="button"
                    className="mt-3 w-full inline-flex justify-center rounded-lg border border-slate-200 shadow-sm px-4 py-2 bg-white text-base font-medium text-slate-900 hover:bg-slate-50 focus:outline-none sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm transition-all duration-200"
                    onClick={() => setShowBidModal(false)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Notifications */}
        <div className="fixed bottom-4 right-4 z-50 space-y-2">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className="bg-white rounded-lg shadow-lg p-4 border border-slate-200 animate-fade-in"
            >
              <p className="text-sm text-slate-600 mb-1">New Transaction:</p>
              <a
                href={`https://scan.over.network/tx/${notification.hash}`}
                target="_blank"
                rel="noreferrer"
                className="text-slate-900 hover:text-slate-700 transition-colors"
              >
                {notification.hash.slice(0, 8)}...{notification.hash.slice(-8)}
              </a>
            </div>
          ))}
        </div>

        {/* Loading Modal */}
        {(isPending || isConfirming || isWaiting) && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4 text-center">
              <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
              </div>

              <div className="inline-block bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-sm sm:w-full sm:p-6">
                <div className="flex flex-col items-center">
                  <div className="mb-4">
                    <svg className="animate-spin h-8 w-8 text-slate-900" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </div>
                  <div className="mt-3 text-center sm:mt-5">
                    <h3 className="text-lg leading-6 font-medium text-slate-900">
                      {isPending ? "Waiting for confirmation..." : 
                       isConfirming ? "Transaction is being confirmed..." :
                       "Processing your request..."}
                    </h3>
                    {hash && (
                      <div className="mt-2">
                        <p className="text-sm text-slate-500">
                          Transaction Hash:
                        </p>
                        <a
                          href={`https://scan.over.network/tx/${hash}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm text-slate-900 hover:text-slate-700 transition-colors break-all"
                        >
                          {hash}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
