import { useState, useEffect } from "react";
import { instance } from "@utils/helper";
import { useAccount, useNetwork } from "@starknet-react/core";
import { raw, TokenInfo, WalletTokensApiResponse } from "types";
import { num } from "starknet";
import axios from "axios";
import { TokenboundClient } from "starknet-tokenbound-sdk";
import { Chain } from "@starknet-react/chains";
import { AccountClassHashes } from "@utils/constants";
import { useTokenBoundSDK } from "./useTokenboundHookContext";

export const useFetchNFTMetadata = (address: string, id: string) => {
  const [nft, setNft] = useState<raw>({ name: "", description: "", image: "" });
  const [loading, setLoading] = useState<boolean>(true);
  const { chain } = useNetwork();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const url = `https://${
          chain.network === "mainnet"
            ? process.env.NEXT_PUBLIC_NETWORK_MAINNET
            : process.env.NEXT_PUBLIC_NETWORK_SEPOLIA
        }/v1/tokens/${address}/${id}`;

        const response = await instance.get(url);
        const { data } = await response;

        setNft(data?.result?.metadata?.normalized);
        setLoading(false);
      } catch (error) {
        if (process.env.NODE_ENV !== "production") {
          console.error("Error fetching user NFT:", error);
        }
        setLoading(false);
      }
    };
    if (address) {
      fetchData();
    }
  }, [address, chain, id]);

  return {
    nft,
    loading,
  };
};

export const useTBAAsset = (tokenBoundAddress: string) => {
  const { address } = useAccount();
  const [tbanft, setTbaNft] = useState<TokenInfo[]>([]);
  const [loadingTba, setTbaLoading] = useState<boolean>(true);
  const { chain } = useNetwork();
  useEffect(() => {
    const fetchData = async () => {
      try {
        if (tokenBoundAddress) {
          const url = `https://${
            chain.network === "mainnet"
              ? process.env.NEXT_PUBLIC_NETWORK_MAINNET
              : process.env.NEXT_PUBLIC_NETWORK_SEPOLIA
          }/v1/owners/${tokenBoundAddress}/tokens`;
          const response = await instance.get(url);
          const { data } = response;
          setTbaNft(data?.result);
          setTbaLoading(false);
        }
      } catch (error) {
        console.error("Error fetching user NFT:", error);
        setTbaLoading(false);
      }
    };
    if (address) {
      fetchData();
    }
  }, [address, tokenBoundAddress, chain]);
  return {
    tbanft,
    loadingTba,
  };
};

export const useDeployAccount = ({
  contractAddress,
  tokenId,
}: {
  contractAddress: string;
  tokenId: string;
}) => {
  const { tokenboundV3 } = useTokenBoundSDK();
  const [deploymentStatus, setDeploymentStatus] = useState<
    "idle" | "success" | "failed" | "ongoing"
  >("idle");
  const deployAccount = async () => {
    setDeploymentStatus("ongoing");
    try {
      await tokenboundV3?.createAccount({
        tokenContract: contractAddress,
        tokenId: tokenId,
      });
      setDeploymentStatus("success");
    } catch (err) {
      if (process.env.NODE_ENV !== "production") {
        console.error("Error deploying TBA", err);
      }
      setDeploymentStatus("failed");
      setTimeout(() => {
        setDeploymentStatus("idle");
      }, 2000);
    }
  };

  return { deploymentStatus, deployAccount };
};

export const useUpgradeAccount = ({
  contractAddress,
  tokenboundClient,
  chain,
}: {
  contractAddress: string;
  tokenboundClient: TokenboundClient | undefined;
  chain: Chain;
}) => {
  const [upgradeStatus, setUpgradeStatus] = useState<
    "idle" | "success" | "failed" | "ongoing"
  >("idle");
  const upgradeAccount = async () => {
    let network = chain.network;
    let v3Implementation =
      AccountClassHashes.V3[network as keyof typeof AccountClassHashes.V3];
    setUpgradeStatus("ongoing");
    try {
      await tokenboundClient?.upgrade({
        tbaAddress: contractAddress,
        newClassHash: v3Implementation,
      });
      setUpgradeStatus("success");
    } catch (err) {
      if (process.env.NODE_ENV !== "production") {
        console.error("Error upgrading TBA", err);
      }
      setUpgradeStatus("failed");
      setTimeout(() => {
        setUpgradeStatus("idle");
      }, 2000);
    }
  };

  return { upgradeAccount, upgradeStatus };
};

type RefreshType = {
  status: number;
  data: { result: string };
};

export const useRefreshMetadata = (
  contractAddress: string,
  tokenId: string
) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [success, setSuccess] = useState<RefreshType>({
    status: 0,
    data: { result: "" },
  });
  const [showSuccess, setShowSuccess] = useState(false);

  const { chain } = useNetwork();

  useEffect(() => {
    if (success?.status === 200) {
      setShowSuccess(true);

      const timer = setTimeout(() => {
        setShowSuccess(false);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [success]);

  const refreshMetadata = async () => {
    setLoading(true);
    try {
      const url = `https://${
        chain.network === "mainnet"
          ? process.env.NEXT_PUBLIC_NETWORK_MAINNET
          : process.env.NEXT_PUBLIC_NETWORK_SEPOLIA
      }/v1/tokens/${contractAddress}/${tokenId}/metadata/refresh`;
      const result: string = await axios.post(
        url,
        {},
        {
          headers: {
            accept: "application/json",
            "x-api-key": process.env.NEXT_PUBLIC_ARK_API_KEY,
          },
          withCredentials: false,
        }
      );
      // @ts-ignore
      setSuccess(result);
    } catch (error) {
      if (process.env.NODE_ENV !== "production") {
        console.error("Error fetching user NFT:", error);
      }
    } finally {
      setLoading(false);
    }
  };

  return { loading, success, refreshMetadata, showSuccess };
};

export const useGetTbaAddress = ({
  contractAddress,
  tokenId,
  tokenboundClient,
  SetVersionAddress,
}: {
  contractAddress: string;
  tokenId: string;
  tokenboundClient: TokenboundClient | undefined;
  SetVersionAddress: React.Dispatch<React.SetStateAction<string>>;
}) => {
  useEffect(() => {
    if (tokenboundClient) {
      const getAccountAddress = async () => {
        try {
          const accountResult = await tokenboundClient.getAccount({
            tokenContract: contractAddress,
            tokenId,
          });
          SetVersionAddress(num.toHex(accountResult));
        } catch (error) {
          if (process.env.NODE_ENV !== "production") {
            console.error(error);
          }
        }
      };
      getAccountAddress();
    }
  }, [tokenboundClient, contractAddress, tokenId]);
};

export const getWalletNft = async ({
  walletAddress,
  page,
}: {
  walletAddress: string;
  page?: number;
}) => {
  const url = `${process.env.NEXT_PUBLIC_MARKETPLACE_API_URL}/portfolio/${walletAddress}${page ? `?page=${page}` : ""}`;
  const response = await fetch(url);
  const data = (await response.json()) as WalletTokensApiResponse;
  console.log(data);

  if (!response.ok) {
    console.error(url, response.status);
    return {
      data: [],
      next_page: null,
      collection_count: 0,
      token_count: 0,
    };
  }
  return data;
};
