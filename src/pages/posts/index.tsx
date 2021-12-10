import { GetStaticProps } from "next";
import Head from "next/head";
import { getPrismicClient } from "../../services/prismic";
import styles from "./styles.module.scss";
import Prismic from "@prismicio/client";

export default function Posts() {
    return (
        <>
            <Head>
                <title>Posts | IgNews</title>
            </Head>
            <main className={styles.container}>
                <div className={styles.posts}>
                    <a href="">
                        <time>12 de março de 2021</time>
                        <strong>Titulo do post</strong>
                        <p>Breve paragrafo</p>
                    </a>
                    <a href="">
                        <time>12 de março de 2021</time>
                        <strong>Titulo do post</strong>
                        <p>Breve paragrafo</p>
                    </a>
                    <a href="">
                        <time>12 de março de 2021</time>
                        <strong>Titulo do post</strong>
                        <p>Breve paragrafo</p>
                    </a>
                </div>
            </main>
        </>
    );
}

export const getStaticProps: GetStaticProps = async () => {
    const prismic = getPrismicClient();

    const response = await prismic.query(
        Prismic.predicates.at("document.type", "publication"),
        {
            fetch: ["publication.title", "publication.content"],
            pageSize: 100,
        }
    );

    console.log(JSON.stringify(response, null, 2));

    return {
        props: {},
    };
};
