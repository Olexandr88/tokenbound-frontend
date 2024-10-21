import { instance } from "@utils/helper";
import { ChangeEvent, useEffect, useRef, useState } from "react";
import SearchIcon from "svg/SearchIcon";
import SyncLoader from "react-spinners/SyncLoader";
import Image from "next/image";
import { useNetwork } from "@starknet-react/core";

type NftInfo = {
  contract_address: string;
  contract_type: string;
  image: string;
  name: string;
  symbol: string;
};

const SearchNFT = () => {
  const { chain } = useNetwork();
  const nftDropDownRef = useRef<HTMLDivElement | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [nft, setNft] = useState<NftInfo>({
    contract_address: "",
    contract_type: "",
    image: "",
    name: "",
    symbol: "",
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [isFocused, setIsFocused] = useState(false);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setSearchInput(value);
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
  };
  useEffect(() => {
    setNft({
      contract_address: "",
      contract_type: "",
      image: "",
      name: "",
      symbol: "",
    });
    setLoading(true);
    const fetchData = async () => {
      try {
        const url = `https://${
          chain.network === "mainnet"
            ? process.env.NEXT_PUBLIC_NETWORK_MAINNET
            : process.env.NEXT_PUBLIC_NETWORK_SEPOLIA
        }/v1/contracts/${searchInput}`;
        const response = await instance.get(url);
        const { data } = response;
        setNft(data?.result);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching user NFT:", error);
        setLoading(false);
      }
    };
    const processChange = setTimeout(() => fetchData(), 1000);
    return () => clearTimeout(processChange);
  }, [searchInput]);
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        nftDropDownRef.current &&
        !nftDropDownRef.current.contains(event.target as Node)
      ) {
        setSearchInput("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [nftDropDownRef]);

  const myLoader = ({ src }: { src: string }) => {
    return src;
  };

  return (
    <div
      ref={nftDropDownRef}
      className={`relative transition-all duration-300 ease-in-out xsm:w-[90%] ${
        isFocused ? "w-[90%] lg:w-[30vw]" : "w-[14rem]"
      }`}
    >
      <div
        className={`relative transition-all duration-300 ease-in-out xsm:w-[90%] ${
          isFocused ? "w-[80vw] lg:w-[30vw]" : "w-[14rem]"
        }`}
      >
        <input
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          value={searchInput}
          className="h-[3rem] w-full rounded-[8px] bg-off-white py-4 pl-10 pr-4 text-[.875rem] placeholder:text-[.9em]"
          role="search"
          type="text"
          name="search"
          id="search"
          placeholder="Search NFTs"
        />
        <span
          style={{
            top: "calc(50% - 1.7em /2)",
          }}
          className="absolute left-0 pl-2 pr-4 text-gray-500"
        >
          <SearchIcon />
        </span>
      </div>
      <div
        style={{
          boxShadow: "0 0 2px 0 #c3c0c0, inset 0 0 2px 0 rgba(85, 85, 85, 0.2)",
        }}
        className={`gird top-[5rem] mt-8 min-h-[4rem] w-[80vw] rounded-[8px] bg-white xsm:w-[90%] lg:fixed lg:mt-0 lg:w-[30vw] ${searchInput ? "block" : "hidden"} `}
      >
        <div className="overflow-hidden">
          <div className="flex flex-col gap-6 p-4">
            {loading ? (
              <SyncLoader
                aria-label="Loading Spinner"
                size={10}
                color="#0C0C4F"
              />
            ) : (
              <>
                {nft.name === "" && nft.image === "" && nft.symbol === "" ? (
                  <div className="my-auto">
                    <h6 className="text-[.9em] uppercase">
                      Collection not found
                    </h6>
                  </div>
                ) : (
                  <>
                    <h5 className="text-[.9em]">COLLECTION</h5>
                    <a
                      href={`https://starkscan.co/contract/${nft.contract_address}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex h-[4rem] gap-4"
                    >
                      <div className="max-h-[50px] max-w-[50px] rounded-[8px]">
                        <Image
                          loader={myLoader}
                          src={nft.image}
                          width={20}
                          height={20}
                          alt={nft.name}
                          className="h-full w-full rounded-[8px]"
                        />
                      </div>

                      <div>
                        <h6 className="font-semibold">{nft.name}</h6>
                        <p>{nft.symbol}</p>
                      </div>
                    </a>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchNFT;
