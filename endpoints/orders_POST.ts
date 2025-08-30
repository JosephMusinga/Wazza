import { db } from '../helpers/db';
import { getServerUserSession } from '../helpers/getServerUserSession';
import { NotAuthenticatedError } from '../helpers/getSetServerSession';
import { schema, OutputType } from "./orders_POST.schema";
import superjson from "superjson";
import { z } from "zod";
import { Kysely, Transaction, sql, Selectable } from "kysely";
import { DB, Orders, OrderItems } from '../helpers/schema';
import { createNotification } from '../helpers/notificationService';
import { nanoid } from 'nanoid';

type DbOrderRow = Selectable<Orders>;

function mapDbOrderToOutput(
  dbOrder: DbOrderRow,
  orderItems: Array<{
    id: number;
    quantity: number;
    unitPrice: string;
    totalPrice: string;
    productId: number;
    productName: string;
    productImageUrl: string | null;
  }>
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
    redemptionCode: dbOrder.redemptionCode,
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

async function createOrderInTransaction(
trx: Transaction<DB>,
userId: number,
businessId: number,
items: {productId: number;quantity: number;}[],
shippingAddress: string)
: Promise<OutputType> {
  // 1. Fetch products and lock rows for update to prevent race conditions on stock.
  // NOTE: The current schema for `products` does not include a `stock` column.
  // For this implementation, we will assume infinite stock and proceed.
  // In a real-world scenario with stock management, a `stock` column would be essential.
  // The query would look something like this:
  // const productIds = items.map((item) => item.productId);
  // const products = await trx.selectFrom('products').selectAll().where('id', 'in', productIds).forUpdate().execute();
  // And then we would check if product.stock >= item.quantity.

  const productIds = items.map((item) => item.productId);
  const products = await trx.
  selectFrom("products").
  selectAll().
  where("id", "in", productIds).
  execute();

  const productMap = new Map(products.map((p) => [p.id, p]));

  // 2. Validate that all products exist and belong to the correct business
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

  // 3. Calculate total amount
  const totalAmount = items.reduce((total, item) => {
    const product = productMap.get(item.productId)!;
    return total + Number(product.price) * item.quantity;
  }, 0);

  // 4. Generate redemption code
  const redemptionCode = nanoid(10).toUpperCase();

  // 5. Create the order
  const order = await trx.
  insertInto("orders").
  values({
    businessId,
    buyerId: userId,
    totalAmount: totalAmount.toString(),
    currency: "USD", // Assuming USD for now
    status: "pending",
    shippingAddress,
    redemptionCode
  }).
  returningAll().
  executeTakeFirstOrThrow();

  // 6. Create order items
  const orderItemsData = items.map((item) => {
    const product = productMap.get(item.productId)!;
    return {
      orderId: order.id,
      productId: item.productId,
      quantity: item.quantity,
      unitPrice: product.price,
      totalPrice: (Number(product.price) * item.quantity).toString()
    };
  });

  await trx.insertInto("orderItems").values(orderItemsData).execute();

  // 7. In a real scenario with stock management, we would decrement stock here.
  // For example:
  // for (const item of items) {
  //   await trx.updateTable('products').set((eb) => ({ stock: eb('stock', '-', item.quantity) })).where('id', '=', item.productId).execute();
  // }

  // 8. Fetch the full order details to return
  const createdOrder = await trx.
  selectFrom("orders").
  selectAll().
  where("id", "=", order.id).
  executeTakeFirstOrThrow();

  const createdOrderItems = await trx.
  selectFrom("orderItems").
  innerJoin("products", "products.id", "orderItems.productId").
  select([
  "orderItems.id",
  "orderItems.quantity",
  "orderItems.unitPrice",
  "orderItems.totalPrice",
  "products.id as productId",
  "products.name as productName",
  "products.imageUrl as productImageUrl"]
  ).
  where("orderId", "=", order.id).
  execute();

  return mapDbOrderToOutput(createdOrder, createdOrderItems);
}

async function createOrderWithNotification(
  trx: Transaction<DB>,
  userId: number,
  businessId: number,
  items: {productId: number;quantity: number;}[],
  shippingAddress: string
): Promise<OutputType> {
  const orderResult = await createOrderInTransaction(trx, userId, businessId, items, shippingAddress);
  
  // Create notification for business owner about new order
  await createNotification(trx, {
    recipientId: businessId,
    recipientType: 'business',
    type: 'new_order',
    title: 'New Order Received!',
    message: `You have received a new order #${orderResult.id} with ${items.length} item(s).`,
    data: { orderId: orderResult.id, totalAmount: orderResult.totalAmount }
  });

  return orderResult;
}

export async function handle(request: Request) {
  try {
    const { user } = await getServerUserSession(request);
    if (user.role !== "user") {
      return new Response(
        superjson.stringify({ error: "Forbidden: Only users can create orders." }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }

    const json = superjson.parse(await request.text());
    const { businessId, items, shippingAddress } = schema.parse(json);

    if (items.length === 0) {
      return new Response(
        superjson.stringify({ error: "Cannot create an order with no items." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const result = await db.transaction().execute((trx) =>
    createOrderWithNotification(trx, user.id, businessId, items, shippingAddress)
    );

    return new Response(superjson.stringify(result), {
      status: 201,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error creating order:", error);
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
    error instanceof Error ? error.message : "Failed to create order.";
    return new Response(superjson.stringify({ error: errorMessage }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}