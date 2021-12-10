import { NextApiRequest, NextApiResponse } from "next";
import { Readable } from "stream";
import Stripe from "stripe";
import { stripe } from "../../services/stripe";
import { saveSubscription } from "./_lib/manageSubscripition";

async function buffer(readable: Readable) {
    const chunks = [];

    for await (const chunck of readable) {
        chunks.push(typeof chunck == "string" ? Buffer.from(chunck) : chunck);
    }

    return Buffer.concat(chunks);
}

export const config = {
    api: {
        bodyParser: false,
    },
};

const relevantsEvents = new Set([
    "checkout.session.completed",
    "customer.subscription.created",
    "customer.subscription.updated",
    "customer.subscription.deleted",
]);

const WebHooks = async (req: NextApiRequest, res: NextApiResponse) => {
    if (req.method == "POST") {
        const buf = await buffer(req);

        const secret = req.headers["stripe-signature"];

        let event: Stripe.Event;

        try {
            event = stripe.webhooks.constructEvent(
                buf,
                secret,
                process.env.STRIPE_WEBHOOK_SECRET
            );
        } catch (error) {
            return res.status(400).send(`Webhook error : ${error.message}`);
        }

        const type = event.type;

        if (relevantsEvents.has(type)) {
            try {
                switch (event.type) {
                    case "customer.subscription.created":
                    case "customer.subscription.updated":
                    case "customer.subscription.deleted":
                        const subscription = event.data
                            .object as Stripe.Subscription;

                        await saveSubscription(
                            subscription.id,
                            subscription.customer.toString(),
                            event.type === "customer.subscription.created"
                        );
                        break;
                    case "checkout.session.completed":
                        const checkoutSession = event.data
                            .object as Stripe.Checkout.Session;
                        await saveSubscription(
                            checkoutSession.subscription.toString(),
                            checkoutSession.customer.toString(),
                            true
                        );
                        break;
                    default:
                        throw new Error("Unhandled event.");
                }
            } catch (error) {
                return res.json({ error: "Webhook handled filed." });
            }
        }

        res.json({ recived: true });
    } else {
        res.setHeader("Allow", "POST");
        res.status(405).end("method not allowed ");
    }
};

export default WebHooks;
