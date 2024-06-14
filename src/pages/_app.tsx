import type { AppProps, AppType } from "next/app";
import { ReactElement, ReactNode } from "react";
import { NextPage } from "next";
import { api } from "#/utils/api";
import { Josefin_Sans } from "next/font/google";
import { Toaster } from "react-hot-toast";
import "#/styles/globals.css";

// set up font
export const josefinSans = Josefin_Sans({
  subsets: ["latin"],
  variable: "--font-josefin",
  weight: ["300", "400", "500", "600", "700"],
});

export type NextPageWithLayout<P = {}, IP = P> = NextPage<P, IP> & {
  getLayout?: (page: ReactElement) => ReactNode;
};

type AppPropsWithLayout = AppProps & {
  Component: NextPageWithLayout;
};

// Initialize eruda (mobile debugger) in development mode when running in browser
if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
  const initEruda = async () => {
    const { default: eruda } = await import("eruda");
    eruda.init();
  };
  initEruda();
}

const MyApp: AppType = ({ Component, pageProps }: AppPropsWithLayout) => {
  const getLayout = Component.getLayout ?? ((page) => page);

  return (
    <div className={`${josefinSans.variable} font-josefin`}>
      {getLayout(<Component {...pageProps} />)}
      <Toaster />
    </div>
  );
};

export default api.withTRPC(MyApp);
