import { fauna } from "../../../services/fauna";
import { query as q } from "faunadb";
import { stripe } from "../../../services/stripe";

export async function saveSubscription(
    subscriprionId: string,
    custumerId: string,
    createAction = false
) {
    const userRef = await fauna.query(
        q.Select(
            "ref",
            q.Get(q.Match(q.Index("user_by_stripe_custumer_id"), custumerId))
        )
    );

    const subscription = await stripe.subscriptions.retrieve(subscriprionId);

    const subscriptionData = {
        id: subscription.id,
        userId: userRef,
        status: subscription.status,
        price_id: subscription.items.data[0].price.id,
    };

    if (createAction) {
        await fauna.query(
            q.Create(q.Collection("subscriptions"), {
                data: subscriptionData,
            })
        );
    } else {
        await fauna.query(
            q.Replace(
                q.Select(
                    "ref",
                    q.Get(
                        q.Match(q.Index("subscription_by_id"), subscription.id)
                    )
                ),
                { data: subscriptionData }
            )
        );
    }
}
