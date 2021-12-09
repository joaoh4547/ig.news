import { NextApiRequest, NextApiResponse } from "next";
import { getSession } from "next-auth/client";
import { stripe } from "../../services/stripe";

const Subscribe = async (req: NextApiRequest, res: NextApiResponse) => {
    if (req.method == "POST") {
        const session = await getSession({ req });

        const custumer = await stripe.customers.create({
            email: session.user.email,
        });

        const checkoutSession = await stripe.checkout.sessions.create({
            customer: custumer.id,
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
    } else {
        res.setHeader("Allow", "POST");
        res.status(405).end("method not allowed ");
    }
};

export default Subscribe;
