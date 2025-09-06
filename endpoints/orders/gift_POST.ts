import { db } from '../../helpers/db';
import { getServerUserSession } from '../../helpers/getServerUserSession';
import { NotAuthenticatedError } from '../../helpers/getSetServerSession';
import { schema, OutputType } from "./gift_POST.schema";
import superjson from "superjson";
import { z } from "zod";
import { Kysely, Transaction, sql, Selectable } from "kysely";
import { DB, Orders, OrderItems } from '../../helpers/schema';
import { nanoid } from 'nanoid';

type DbOrderRow = Selectable<Orders>;

async function simulateSMSSending(recipientPhone: string, redemptionCode: string, regularPersonName: string, regularPersonPhone: string): Promise<void> {
  console.log(`[SMS Simulation] Sending SMS to ${recipientPhone} with redemption code: ${redemptionCode}`);
  console.log(`[SMS Simulation] Message content: "Your gift from ${regularPersonName} is ready! Use redemption code ${redemptionCode} to redeem your items."`);
  
  // Simulate SMS sending delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  console.log(`[SMS Simulation] SMS sent successfully to ${recipientPhone}`);
  
  // Also send SMS to regular person when gift is collected (this will be called later in the verification process)
  console.log(`[SMS Simulation] Regular person ${regularPersonName} (${regularPersonPhone}) will be notified when gift is collected`);
}

function mapDbOrderToOutput(
  dbOrder: DbOrderRow,
  redemptionCode: string,
  orderItems: Array<{
    id: number;
    quantity: number;
    unitPrice: string;
    totalPrice: string;
    productId: number;
    productName: string;
    productImageUrl: string | null;
  }>,
  smsStatus: 'sent' | 'failed' = 'sent'
): OutputType {
  return {
    id: dbOrder.id,
    status: dbOrder.status,
    businessId: dbOrder.businessId,
    buyerId: dbOrder.buyerId,
    totalAmount: Number(dbOrder.totalAmount),
    currency: dbOrder.currency,
    shippingAddress: dbOrder.shippingAddress,
    createdAt: dbOrder.createdAt || new Date(),
    updatedAt: dbOrder.updatedAt || new Date(),
    redemptionCode: redemptionCode,
    smsStatus: smsStatus,
    items: orderItems.map((item) => ({
      id: item.id,
      quantity: item.quantity,
      unitPrice: Number(item.unitPrice),
      totalPrice: Number(item.totalPrice),
      product: {
        id: item.productId,
        name: item.productName,
        imageUrl: item.productImageUrl
      }
    }))
  };
}

async function createGiftOrderInTransaction(
  trx: Transaction<DB>,
  userId: number,
  { businessId, items, recipientName, recipientPhone, recipientNationalId, regularPersonName, regularPersonPhone }: z.infer<typeof schema>
): Promise<OutputType> {
  // 1. Generate a unique redemption code
  const redemptionCode = nanoid(10).toUpperCase();

  // 2. Validate national ID format
  if (!recipientNationalId.trim()) {
    throw new Error("Recipient national ID cannot be empty.");
  }

  if (recipientNationalId.length > 50) {
    throw new Error("Recipient national ID is too long. Maximum 50 characters allowed.");
  }

  // 3. Fetch products and validate them
  const productIds = items.map((item) => item.productId);
  const products = await trx
    .selectFrom("products")
    .selectAll()
    .where("id", "in", productIds)
    .execute();

  const productMap = new Map(products.map((p) => [p.id, p]));

  for (const item of items) {
    const product = productMap.get(item.productId);
    if (!product) {
      throw new Error(`Product with ID ${item.productId} not found.`);
    }
    if (product.businessId !== businessId) {
      throw new Error(
        `Product with ID ${item.productId} does not belong to business ID ${businessId}.`
      );
    }
  }

  // 4. Calculate total amount
  const totalAmount = items.reduce((total, item) => {
    const product = productMap.get(item.productId)!;
    return total + Number(product.price) * item.quantity;
  }, 0);

  // 5. Create the order without shipping address since we use national ID for recipient identification
  const order = await trx
    .insertInto("orders")
    .values({
      businessId,
      buyerId: userId,
      totalAmount: totalAmount.toString(),
      currency: "USD",
      status: "pending", // Using 'pending' as a generic status for new orders.
      shippingAddress: null, // No shipping address needed - using national ID for recipient identification
      billingAddress: null, // No billing address collected for gift orders
      notes: null, // Gift metadata now stored in gift_order_metadata table
    })
    .returningAll()
    .executeTakeFirstOrThrow();

  // 6. Create gift order metadata record with national ID and regular person details
  await trx
    .insertInto("giftOrderMetadata")
    .values({
      orderId: order.id,
      redemptionCode,
      recipientName,
      recipientPhone,
      recipientNationalId,
      regularPersonName,
      regularPersonPhone,
      isRedeemed: false,
      redeemedAt: null,
    })
    .execute();

  // 7. Create order items
  const orderItemsData = items.map((item) => {
    const product = productMap.get(item.productId)!;
    return {
      orderId: order.id,
      productId: item.productId,
      quantity: item.quantity,
      unitPrice: product.price,
      totalPrice: (Number(product.price) * item.quantity).toString(),
    };
  });

  await trx.insertInto("orderItems").values(orderItemsData).execute();

  // 8. Fetch the full order details to return
  const createdOrderItems = await trx
    .selectFrom("orderItems")
    .innerJoin("products", "products.id", "orderItems.productId")
    .select([
      "orderItems.id",
      "orderItems.quantity",
      "orderItems.unitPrice",
      "orderItems.totalPrice",
      "products.id as productId",
      "products.name as productName",
      "products.imageUrl as productImageUrl",
    ])
    .where("orderId", "=", order.id)
    .execute();

  // 9. Simulate SMS sending after successful order creation
  let smsStatus: 'sent' | 'failed' = 'sent';
  try {
    await simulateSMSSending(recipientPhone, redemptionCode, regularPersonName, regularPersonPhone);
  } catch (error) {
    console.error("Failed to send SMS:", error);
    smsStatus = 'failed';
  }

  return mapDbOrderToOutput(order, redemptionCode, createdOrderItems, smsStatus);
}

export async function handle(request: Request) {
  try {
    const { user } = await getServerUserSession(request);
    if (user.role !== "user") {
      return new Response(
        superjson.stringify({ error: "Forbidden: Only users can create gift orders." }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }

    const json = superjson.parse(await request.text());
    const payload = schema.parse(json);

    if (payload.items.length === 0) {
      return new Response(
        superjson.stringify({ error: "Cannot create a gift order with no items." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const result = await db.transaction().execute((trx) =>
      createGiftOrderInTransaction(trx, user.id, payload)
    );

    return new Response(superjson.stringify(result), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error creating gift order:", error);
    if (error instanceof NotAuthenticatedError) {
      return new Response(
        superjson.stringify({ error: "Not authenticated" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }
    if (error instanceof z.ZodError) {
      return new Response(
        superjson.stringify({ error: "Invalid request body", details: error.issues }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    const errorMessage =
      error instanceof Error ? error.message : "Failed to create gift order.";
    return new Response(superjson.stringify({ error: errorMessage }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}