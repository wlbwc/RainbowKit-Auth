import { ConnectButton } from "@rainbow-me/rainbowkit";
import type { NextPage } from "next";
import Head from "next/head";

const Home: NextPage = () => {
    return (
        <>
            <Head>
                <title>RainbowKit-Auth</title>
            </Head>
            <main>
                <ConnectButton label="Connect wallet" accountStatus="address" chainStatus="icon" showBalance={false} />
            </main>
        </>
    );
};

export default Home;
