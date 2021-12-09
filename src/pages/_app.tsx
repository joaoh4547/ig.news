import "../styles/global.scss";
import { AppProps } from "next/app";
import { Header } from "../components/Header";
import { Provider as AuthProvider } from "next-auth/client";
function MyApp({ Component, pageProps }: AppProps) {
    return (
        <AuthProvider session={pageProps.session}>
            <Header />
            <Component {...pageProps} />
        </AuthProvider>
    );
}

export default MyApp;
