import { NextApiRequest, NextApiResponse } from "next";
import { getSession } from "next-auth/client";
import { fauna } from "../../services/fauna";
import { stripe } from "../../services/stripe";
import { query as q } from "faunadb";

type User = {
    ref: {
        id: string;
    };
    data: {
        stripe_custumer_id: string;
    };
};

const Subscribe = async (req: NextApiRequest, res: NextApiResponse) => {
    if (req.method == "POST") {
        const session = await getSession({ req });

        try {
            const user = await fauna.query<User>(
                q.Get(
                    q.Match(
                        q.Index("user_by_email"),
                        q.Casefold(session.user.email)
                    )
                )
            );

            let custumerId = user.data.stripe_custumer_id;

            if (!custumerId) {
                const custumer = await stripe.customers.create({
                    email: session.user.email,
                });

                await fauna.query(
                    q.Update(q.Ref(q.Collection("users"), user.ref.id), {
                        data: {
                            stripe_custumer_id: custumer.id,
                        },
                    })
                );
                custumerId = custumer.id;
            }

            const checkoutSession = await stripe.checkout.sessions.create({
                customer: custumerId,
                payment_method_types: ["card"],
                billing_address_collection: "required",
                line_items: [
                    {
                        price: "price_1K3MaQDrYljZFgQKifzRgj5C",
                        quantity: 1,
                    },
                ],
                mode: "subscription",
                allow_promotion_codes: true,
                success_url: process.env.STRIPE_SUCCESS_URL,
                cancel_url: process.env.STRIPE_CANCEL_URL,
            });

            return res.status(200).json({ sessionId: checkoutSession.id });
        } catch (e) {
            console.log(e);
        }

        return res.status(500).json({});
    } else {
        res.setHeader("Allow", "POST");
        res.status(405).end("method not allowed ");
    }
};

export default Subscribe;
