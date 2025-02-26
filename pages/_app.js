// pages/_app.js
import { SessionProvider } from "next-auth/react";
import Head from "next/head";

import "../styles/globals.css";

function MyApp({ Component, pageProps: { session, ...pageProps } }) {
  return (
    <SessionProvider session={session}>
      <Head>
        <title>Tuya Dashboard</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content="Панель управления устройствами Tuya" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Component {...pageProps} />
    </SessionProvider>
  );
}

export default MyApp;
