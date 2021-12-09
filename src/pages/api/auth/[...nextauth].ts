import { query as q } from "faunadb";
import NextAuth from "next-auth";
import Providers from "next-auth/providers";
import { fauna } from "../../../services/fauna";

export default NextAuth({
    providers: [
        Providers.GitHub({
            clientId: process.env.GITHUB_ID,
            clientSecret: process.env.GITHUB_SECRET,
            scope: "read:user",
        }),
    ],
    jwt: {
        signingKey: process.env.JWT_KEY,
    },
    callbacks: {
        async signIn(user, acount, profile) {
            try {
                const { email } = user;

                await fauna.query(
                    q.Create(q.Collection("users"), { data: { email } })
                );

                return true;
            } catch (err) {
                console.log(err);
                return false;
            }
        },
    },
});
