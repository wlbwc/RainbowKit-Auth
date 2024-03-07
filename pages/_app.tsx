import "../styles/globals.css";
import "@rainbow-me/rainbowkit/styles.css";
import type { AppProps } from "next/app";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider, createConfig, http } from "wagmi";
import { arbitrum, base, mainnet, optimism, polygon, zora, bsc, bscTestnet, polygonMumbai } from "wagmi/chains";
import {
    connectorsForWallets,
    darkTheme,
    getDefaultConfig,
    RainbowKitProvider,
    AuthenticationStatus,
    ConnectButton,
    createAuthenticationAdapter,
    RainbowKitAuthenticationProvider,
} from "@rainbow-me/rainbowkit";
import { rabbyWallet, walletConnectWallet, metaMaskWallet, rainbowWallet } from "@rainbow-me/rainbowkit/wallets";
import { useEffect, useMemo, useState } from "react";
import { SiweMessage } from "siwe";
import { getSession } from "next-auth/react";
import { getToken } from "next-auth/jwt";
import { GetServerSideProps, InferGetServerSidePropsType } from "next";

const connectors = connectorsForWallets(
    [
        {
            groupName: "Available wallets",
            wallets: [metaMaskWallet, rabbyWallet, walletConnectWallet, rainbowWallet],
        },
    ],
    {
        appName: "RainbowKit-Auth",
        projectId: "YOUR_PROJECT_ID",
    }
);
const config = createConfig({
    connectors,
    chains: [mainnet, polygon, optimism, arbitrum, base, zora, bsc, bscTestnet, polygonMumbai],
    multiInjectedProviderDiscovery: false,
    transports: {
        [mainnet.id]: http(),
        [polygon.id]: http(),
        [optimism.id]: http(),
        [arbitrum.id]: http(),
        [base.id]: http(),
        [zora.id]: http(),
        [bsc.id]: http(),
        [bscTestnet.id]: http(),
        [polygonMumbai.id]: http(),
    },
});

const queryClient = new QueryClient();

function MyApp({ Component, pageProps }: AppProps) {
    const [authStatus, setAuthStatus] = useState<AuthenticationStatus>("loading");
    useEffect(() => {
        const fetchUser = async () => {
            try {
                const response = await fetch("http://localhost:8080/me", { credentials: "include" });
                const responseJson = await response.json();
                const address = await responseJson.address;
                console.log("address: ", address);
                setAuthStatus(address ? "authenticated" : "unauthenticated");
            } catch (e) {
                console.log("error: ", e);
                setAuthStatus("unauthenticated");
            }
        };
        fetchUser();

        window.addEventListener("focus", fetchUser);

        return () => {
            window.removeEventListener("focus", fetchUser);
        };
    }, []);

    const authAdapter = useMemo(() => {
        return createAuthenticationAdapter({
            getNonce: async () => {
                const response = await fetch("http://localhost:8080/nonce");
                const { nonce } = await response.json();
                return nonce;
            },

            createMessage: ({ nonce, address, chainId }) => {
                return new SiweMessage({
                    domain: window.location.host,
                    address,
                    statement: "Sign in with Etherium to the app.",
                    uri: window.location.origin,
                    version: "1",
                    chainId,
                    nonce,
                });
            },
            getMessageBody: ({ message }) => {
                return message.prepareMessage();
            },

            verify: async ({ message, signature }) => {
                const verifyRes = await fetch("http://localhost:8080/verify", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ message, signature }),
                });
                const responseJson = await verifyRes.json();
                if (verifyRes.ok) {
                    document.cookie = `address=${responseJson.address}; path=/`;
                    return verifyRes.ok;
                }

                return verifyRes.ok;
            },

            signOut: async () => {
                console.log("Signing out");
                await fetch("http://localhost:8080/logout", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({}),
                });
            },
        });
    }, []);

    return (
        <WagmiProvider config={config}>
            <QueryClientProvider client={queryClient}>
                <RainbowKitAuthenticationProvider adapter={authAdapter} status={authStatus}>
                    <RainbowKitProvider
                        theme={darkTheme()}
                        modalSize="compact"
                        locale="en-US"
                        appInfo={{
                            appName: "RainbowKit-Auth",
                            learnMoreUrl: "https://github.com/wlbwc/RainbowKit-Auth",
                        }}
                    >
                        <Component {...pageProps} />
                    </RainbowKitProvider>
                </RainbowKitAuthenticationProvider>
            </QueryClientProvider>
        </WagmiProvider>
    );
}

export default MyApp;
