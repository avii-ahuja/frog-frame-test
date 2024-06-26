/** @jsxImportSource frog/jsx */
import { init, useQuery, fetchQuery } from "@airstack/airstack-react";
import BigNumber from "bignumber.js";
import {NeynarAPIClient} from "@neynar/nodejs-sdk";
import {VStack, Box, Text, Image, HStack} from "@/app/ui";

const tokenList = [
    {
        name: "DEGEN",
        contract: "0x4ed4E862860beD51a9570b96d89aF5E1B0Efefed"
        },
    {
        name: "WETH",
        contract: "0x4200000000000000000000000000000000000006"
    },
    {
        name: "USDC",
        contract: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"
    },
    {
        name: "BOOMER",
        contract: "0xcdE172dc5ffC46D228838446c57C1227e0B82049"
    }
];

const createQueryTokenBalances = ({owner, tokenAddresses}: {owner: string, tokenAddresses: string[]}) => {
    return `query MyQuery {
  TokenBalances(
    input: {filter: {owner: {_in: "${owner}"}, tokenAddress: {_in: ${JSON.stringify(tokenAddresses)}}}, blockchain: base}
  ) {
    TokenBalance {
      amount
      tokenAddress
      token {
        decimals
        logo {
          small
        }
        symbol
        name
      }
      owner {
        addresses
      }
    }
  }
}
`
}

const createQueryFid = (fid: number) => {
    console.log({fid});
    return `query MyQuery {
  Socials(
    input: {filter: {identity: {_in: ["fc_fid:${fid.toString()}"]}, dappName: {_eq: farcaster}}, blockchain: ethereum}
  ) {
    Social {
      connectedAddresses {
        address
      }
      dappName
    }
  }
}`;
}

export async function getOwnerAddress(fid: number){
    init(process.env.AIRSTACK_API_KEY!);
    const query = createQueryFid(fid);
    console.log(query);
    const {data, error} = await fetchQuery(query);
    //@ts-ignore
    return data?.Socials?.Social[0]?.connectedAddresses[0]?.address ?? null;
}

export const neynarClient = new NeynarAPIClient(process.env.NEYNAR_API_KEY!);

export async function fetchTokenBalances(owner: string){
    init(process.env.AIRSTACK_API_KEY!);
    const tokenAddresses = tokenList.map((token) => {return token.contract});
    const query = createQueryTokenBalances({owner, tokenAddresses})
    const {data, error} = await fetchQuery(query);
    if(error){
        console.error(error);
    }
    //@ts-ignore
    const balances = data?.TokenBalances?.TokenBalance?.map((balance) => {
        return {
            name: balance.token.name,
            amount: BigNumber(balance.amount).div(BigNumber(10).exponentiatedBy(balance.token.decimals)),
            tokenAddress: balance.tokenAddress,
            symbol: balance.token.symbol,
            imageUrl: balance.token.logo.small
        }
    }) ?? [];
    return {owner, balances};
    // return data?.TokenBalances;
}

export function renderBalances(tokens: {owner: string, balances: { name: string; amount: BigNumber, tokenAddress: string , symbol: string, imageUrl: string}[]}){
    const {owner, balances} = tokens;
    console.log(JSON.stringify(tokens, null, 4));
    //@ts-ignore
    const jsx = (
        <Box
            grow
            alignVertical="center"
            backgroundColor="background"
            padding="32"
        >
                <Text size="24">{owner.substring(0, 6)+"..."+owner.substring(owner.length-4)}</Text>
            <VStack gap="4">
                {(balances.map((balance, index) => (
                        <HStack
                            key={index}
                            grow
                            width="100%"
                            alignVertical="center"
                            alignHorizontal="space-between"
                        >
                            <HStack alignVertical="center">
                                <Image
                                    src={balance.imageUrl ?? process.env.SAMPLE_TOKEN_URL}
                                    height="30"
                                    width="30"
                                    borderRadius="40"
                                />
                                <Text size="20">
                                    {balance.symbol}
                                </Text>
                            </HStack>
                            <Text size="20">
                                {balance.amount.toFixed(3)}
                            </Text>
                        </HStack>
                    )))}
            </VStack>
        </Box>
    )

    // Return JSX
    return jsx;
}
