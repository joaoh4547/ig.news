import { NextApiRequest, NextApiResponse } from "next";
import { Readable } from "stream";
import Stripe from "stripe";
import { stripe } from "../../services/stripe";

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

const relevantsEvents = new Set(["checkout.session.completed"]);

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
            console.log(`Evento Recebido :`, event);
        }

        res.json({ recived: true });
    } else {
        res.setHeader("Allow", "POST");
        res.status(405).end("method not allowed ");
    }
};

export default WebHooks;
