import { ZodOptional, z } from "zod";
import { DatabaseCartProduct, DatabaseProduct, DatabaseUser } from "./database_types.js";
import { cartProductSchema, orderSchema, orderShippingSchema, productSchema, userSchema } from "./schemas.js";
import {
    dbOperation,
    dbOperationWithRollback,
    mysqlGetOrThrow,
    mysqlGetQuery,
    mysqlPrepareWithPlaceholders,
    mysqlQueryTableByID,
    sqlEqualIfNullShortcut,
} from "./utils.js";
import { ResultSetHeader } from "mysql2";
import { Argon2id } from "oslo/password";
import { generateId } from "lucia";
import { nanoid } from "nanoid";
import { BASE_DIR } from "./settings.js";
import { rm, writeFile } from "fs/promises";
import { productSerializer } from "./serializers.js";
import { getFromContext } from "./context.js";
import { connect } from "http2";
import sql, { raw } from "sql-template-tag";

interface UserCreate extends z.output<typeof userSchema> {}

interface UserUpdate extends Partial<z.output<typeof userSchema>> {
    id: NonNullable<z.output<typeof userSchema.shape.id>>;
}

interface UserDelete extends Partial<z.output<typeof userSchema>> {
    id: NonNullable<z.output<typeof userSchema.shape.id>>;
}

export const User = {
    create: async (data: UserCreate) => {
        const hashedPassword = await new Argon2id().hash(data.password);
        const userId = generateId(15);

        await dbOperation(async (connection) => {
            const userInsert = await connection.execute<ResultSetHeader>({
                sql: "INSERT INTO user (id, username, hashed_password, is_admin) VALUES (:id, :username, :hashed_password, :is_admin)",
                values: {
                    id: userId,
                    username: data.username,
                    hashed_password: hashedPassword,
                    is_admin: data.is_admin,
                },
                namedPlaceholders: true,
            });
            const cartInsert = await connection.execute<ResultSetHeader>("INSERT INTO cart (user_id) VALUES (?)", [
                userId,
            ]);
        });

        return userId;
    },
    update: async (data: UserUpdate) => {
        return await dbOperation(async (connection) => {
            const hashedPassword = data.password == null ? null : await new Argon2id().hash(data.password);
            const [result] = await connection.execute<ResultSetHeader>({
                sql: `
                    UPDATE user 
                        SET
                            username = IF(:username IS NULL, username, :username),
                            hashed_password = IF(:hashed_password IS NULL, hashed_password, :hashed_password),
                            is_admin = IF(:is_admin IS NULL, is_admin, :is_admin)
                        WHERE
                            id = :id
                `,
                values: {
                    id: data.id,
                    username: data.username ?? null,
                    hashed_password: hashedPassword ?? null,
                    is_admin: data.is_admin ?? null,
                },
                namedPlaceholders: true,
            });

            const { affectedRows } = result;
            return affectedRows;
        });
    },
    delete: async ({ id }: UserDelete) => {
        const pool = getFromContext("pool");
        await pool.execute(`DELETE FROM user WHERE id = ?`, [id]);
    },
};

type ProductCreate = z.output<typeof productSchema>;

interface ProductUpdate extends Partial<z.output<typeof productSchema>> {
    id: NonNullable<z.output<typeof productSchema.shape.id>>;
}

interface ProductDelete extends Partial<z.output<typeof productSchema>> {
    id: NonNullable<z.output<typeof productSchema.shape.id>>;
}

export const Product = {
    create: async (data: ProductCreate) => {
        let savedFileNames: {
            index: number;
            fileName: string;
        }[] = [];

        await Promise.all(
            data.newImages.map(async ({ index, file }) => {
                const id = nanoid();
                const fileName = `${id}-${file.originalname}`;
                try {
                    await writeFile(`${BASE_DIR}/backend/media/${fileName}`, file.buffer);
                    savedFileNames.push({ index, fileName });
                } catch (error) {
                    console.log(`Error trying to save ${fileName}`);
                }
            }),
        );

        const fileNames = savedFileNames.sort((a, b) => a.index - b.index).map(({ fileName }) => fileName);

        return await dbOperation(async (connection) => {
            const [result] = await connection.execute<ResultSetHeader>({
                sql: `
                    INSERT INTO product 
                        SET
                            name = :name,
                            description = :description,
                            price = :price,
                            kind = :kind,
                            specification = :specification,
                            images = :images,
                            user_id = :user_id,
                            available = :available
                `,
                values: {
                    name: data.name,
                    description: data.description,
                    price: data.price,
                    kind: data.kind,
                    specification: JSON.stringify(data.specification),
                    images: JSON.stringify(fileNames),
                    user_id: data.user_id,
                    available: data.available,
                },
                namedPlaceholders: true,
            });

            const { insertId } = result;
            return insertId;
        });
    },
    update: async (data: ProductUpdate) => {
        let fileNames: string[] | undefined;
        const pool = getFromContext("pool");
        if (data.existingImages != null) {
            const oldProduct = productSerializer.parse(
                await mysqlGetOrThrow<DatabaseUser>(pool.execute(`SELECT * FROM product WHERE id = ?`, [data.id])),
            );
            const newExistingImages =
                data.existingImages == null ? oldProduct.images : data.existingImages.map(({ fileName }) => fileName);
            const filesForDeletion = oldProduct.images.filter((fileName) => !newExistingImages.includes(fileName));

            await Promise.all(
                filesForDeletion.map(async (image) => {
                    try {
                        await rm(`media/${image}`);
                    } catch (error) {
                        console.log(`Error trying to delete ${image}.`);
                    }
                }),
            );

            const savedFileNames =
                data.newImages == null
                    ? []
                    : await Promise.all(
                          data.newImages.map(async ({ index, file }) => {
                              const id = nanoid();
                              const fileName = `${id}-${file.originalname}`;
                              await writeFile(`${BASE_DIR}/backend/media/${fileName}`, file.buffer);
                              return { index, fileName };
                          }),
                      );

            fileNames = [...savedFileNames, ...data.existingImages]
                .sort((a, b) => a.index - b.index)
                .map(({ fileName }) => fileName);
        }

        const [result] = await pool.execute<ResultSetHeader>({
            sql: `
                UPDATE product 
                    SET
                        name = IF (:name IS NULL, name, :name),
                        description = IF (:description IS NULL, description, :description),
                        price = IF (:price IS NULL, price, :price),
                        kind = IF (:kind IS NULL, kind, :kind),
                        specification = IF (:specification IS NULL, specification, :specification),
                        images = IF (:images IS NULL, images, :images),
                        user_id = IF (:user_id IS NULL, user_id, :user_id),
                        available = IF (:available IS NULL, available, :available)
                WHERE
                    id = :id
            `,
            values: {
                id: data.id,
                name: data.name ?? null,
                description: data.description ?? null,
                price: data.price ?? null,
                kind: data.kind ?? null,
                specification: data.specification == null ? null : JSON.stringify(data.specification),
                images: fileNames == null ? null : JSON.stringify(fileNames),
                user_id: data.user_id ?? null,
                available: data.available ?? null,
            },
            namedPlaceholders: true,
        });

        const { affectedRows } = result;
        return affectedRows;
    },
};

interface CartProductCreate extends z.output<typeof cartProductSchema> {}
interface CartProductUpdate extends Partial<z.output<typeof cartProductSchema>> {
    id: NonNullable<z.output<typeof cartProductSchema.shape.id>>;
}
interface CartProductDelete extends Partial<z.output<typeof cartProductSchema>> {
    id: NonNullable<z.output<typeof cartProductSchema.shape.id>>;
}

export const CartProduct = {
    create: async (data: CartProductCreate) => {
        return await dbOperation(async (connection) => {
            const [result] = await connection.execute<ResultSetHeader>({
                sql: "INSERT INTO cart_product (product_id, cart_id, amount) VALUES (:product_id, :cart_id, :amount)",
                values: {
                    cart_id: data.cart_id,
                    product_id: data.product_id,
                    amount: data.amount,
                },
                namedPlaceholders: true,
            });

            const { insertId } = result;
            return insertId;
        });
    },
    update: async (data: CartProductUpdate) => {
        return dbOperation(async (connection) => {
            const [result] = await connection.execute<ResultSetHeader>({
                sql: `
                UPDATE cart_product 
                    SET
                        amount = IF (:amount IS NULL, amount, :amount)
                WHERE
                    id = :id
            `,
                values: {
                    id: data.id,
                    amount: data.amount ?? null,
                },
                namedPlaceholders: true,
            });

            const { affectedRows } = result;
            return affectedRows;
        });
    },
    delete: async (data: CartProductDelete) => {
        const pool = getFromContext("pool");
        const [result] = await pool.execute<ResultSetHeader>(`DELETE FROM cart_product WHERE id = ?`, [data.id]);
        const { affectedRows } = result;
        return affectedRows;
    },
};

interface OrderCreate extends z.output<typeof orderSchema> {
    user_id: NonNullable<z.output<typeof orderSchema.shape.user_id>>;
    product_id: NonNullable<z.output<typeof orderSchema.shape.product_id>>;
}
interface OrderUpdate extends Partial<z.output<typeof orderSchema>> {
    id: NonNullable<z.output<typeof orderSchema.shape.id>>;
}
interface OrderDelete extends Partial<z.output<typeof orderSchema>> {
    id: NonNullable<z.output<typeof orderSchema.shape.id>>;
}

export const Order = {
    create: async (data: OrderCreate) => {
        const { insertId } = await dbOperationWithRollback(async (connection) => {
            const product = await mysqlGetOrThrow<DatabaseProduct>(
                connection.execute(`SELECT * FROM product WHERE id = ?`, [data.product_id]),
            );
            const cartProduct = await mysqlGetOrThrow<DatabaseCartProduct>(
                connection.execute(
                    `
                    SELECT cart_product.* 
                        FROM 
                            cart LEFT JOIN cart_product 
                        ON 
                            cart.id = cart_product.cart_id
                    WHERE 
                        cart.user_id = ? AND
                        cart_product.product_id = ?
                    `,
                    [data.user_id, data.product_id],
                ),
            );

            const [result] = await connection.execute<ResultSetHeader>({
                sql: `
                    INSERT INTO _order 
                        SET
                            user_id = :user_id,
                            product_id = :product_id,
                            amount = :amount,
                            date_created = NOW(),
                            archive = :archive,
                            shipping_name = :shipping_name,
                            shipping_address_primary = :shipping_address_primary,
                            shipping_address_secondary = :shipping_address_secondary,
                            shipping_city = :shipping_city,
                            shipping_state = :shipping_state,
                            shipping_zip = :shipping_zip,
                            shipping_country = :shipping_country,
                            status = :status
                `,
                values: {
                    user_id: data.user_id,
                    product_id: data.product_id,
                    amount: data.amount,
                    archive: JSON.stringify({
                        product: productSerializer.parse(product),
                    }),
                    shipping_name: data.shipping_name,
                    shipping_address_primary: data.shipping_address_primary,
                    shipping_address_secondary: data.shipping_address_secondary,
                    shipping_city: data.shipping_city,
                    shipping_state: data.shipping_state,
                    shipping_zip: data.shipping_zip,
                    shipping_country: data.shipping_country,
                    status: data.status,
                },
                namedPlaceholders: true,
            });
            await CartProduct.delete(cartProduct);
            return result;
        });

        return insertId;
    },
    update: async (data: OrderUpdate) => {
        const setArgs = {
            user_id: data.user_id ?? null,
            product_id: data.product_id ?? null,
            amount: data.amount ?? null,
            date_created: data.date_created ?? null,
            shipping_name: data.shipping_name ?? null,
            shipping_address_primary: data.shipping_address_primary ?? null,
            shipping_address_secondary: data.shipping_address_secondary ?? null,
            shipping_city: data.shipping_city ?? null,
            shipping_state: data.shipping_state ?? null,
            shipping_zip: data.shipping_zip ?? null,
            shipping_country: data.shipping_country ?? null,
            status: data.status ?? null,
        };

        return dbOperation(async (connection) => {
            const [result] = await connection.execute<ResultSetHeader>({
                sql: `
                    UPDATE _order 
                        SET
                            ${Object.keys(setArgs).map(sqlEqualIfNullShortcut).join(", ")}
                    WHERE
                        id = :id
                `,
                values: {
                    id: data.id,
                    ...setArgs,
                },
                namedPlaceholders: true,
            });

            const { affectedRows } = result;
            return affectedRows;
        });
    },
};

interface OrderShippingCreate extends z.output<typeof orderShippingSchema> {
    order_id: NonNullable<z.output<typeof orderShippingSchema.shape.order_id>>;
}
interface OrderShippingUpdate extends Partial<z.output<typeof orderShippingSchema>> {
    id: NonNullable<z.output<typeof orderShippingSchema.shape.id>>;
}
interface OrderShippingDelete extends Partial<z.output<typeof orderShippingSchema>> {
    id: NonNullable<z.output<typeof orderShippingSchema.shape.id>>;
}

function sqlNamedSet (field: string, setTo: unknown, isRaw: boolean = false) {
    const setToString = `${setTo}`;
    return sql`${raw(field)} = ${isRaw ? raw(setToString) : setTo}`
}

export const OrderShipping = {
    create: async (data: OrderShippingCreate) => {
        const { insertId } = await dbOperation(async (connection) => {
            const query = sql`
                INSERT INTO order_shipping
                    SET 
                        order_id = ${data.order_id},
                        tracking_number = ${data.tracking_number},
                        courier_name = ${data.courier_name},
                        additional_information = ${data.additional_information},
                        date_created = NOW()
            `

            const [result] = await connection.execute<ResultSetHeader>(query.sql, query.values);
            return result;
        });

        return insertId;
    }
}