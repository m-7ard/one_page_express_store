import { CartProductType, ProductType } from "../../../../../../Types";
import EditProductDialog from "../../../../unlinked/EditProductDialog";
import { ProductContext, useAppContext } from "../../../../../../Context";
import DeleteProductDialog from "../../../../unlinked/DeleteProductDialog";
import InformationDisplayDialog from "../../../../unlinked/ProductInformationDisplayDialog";
import UserPopover from "../../../../unlinked/UserPopover";
import { Popover } from "@headlessui/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { UsersUserAPIQuery } from "../../App";

export default function Product(product: ProductType) {
    const queryClient = useQueryClient();
    const { user, cart } = useAppContext();
    const { name, price, images, kind } = product;

    const isInCart =
        cart != null &&
        cart.products.find((cartProduct) => {
            return cartProduct.product.id === product.id;
        }) != null;

    const addToCartMutation = useMutation({
        mutationFn: async () => {
            const response = await fetch(`/api/cart/add_product/${product.id}`, {
                method: "POST",
                body: JSON.stringify({
                    amount: 1
                }),
                headers: {
                    "Content-Type": "application/json",
                },
            });

            if (response.ok) {
                return await response.json();
            }

            const errors = await response.json();
            return Promise.reject(errors);
        },
        onSuccess: (data: CartProductType) => {
            queryClient.setQueryData<UsersUserAPIQuery>(["user_and_cart"], (previous) => {
                if (previous == null) {
                    return null;
                }

                return {
                    ...previous,
                    cart: {
                        ...previous.cart,
                        products: [...previous.cart.products, data],
                    },
                };
            });
        },
    });

    return (
        <ProductContext.Provider value={product}>
            <div className="flex flex-col py-8 gap-4 col-span-1 relative mt-px">
                <div className="bg-gray-600 w-full relative border border-gray-900" style={{ aspectRatio: 0.711 }}>
                    <img
                        src={`/media/${images[0]}`}
                        className="absolute w-full h-full"
                        style={{ objectFit: "cover" }}
                        alt="prop"
                    ></img>
                </div>
                <div>
                    <div className="text-sm text-gray-600">{kind}</div>
                    <div className="text-base text-gray-900 font-medium">{name}</div>
                    <div className="text-sm text-gray-900">{price}$</div>
                </div>
                {user == null ? (
                    <UserPopover
                        Trigger={({ setReferenceElement, open }) => (
                            <Popover.Button
                                ref={setReferenceElement}
                                className={`
                                    mixin-button-like
                                    mixin-button-base
                                    theme-button-generic-yellow
                                    ${open && "theme-button-generic-yellow--active"}
                                    justify-center
                                `}
                            >
                                Add to Cart
                            </Popover.Button>
                        )}
                    />
                ) : isInCart ? (
                    <button
                        className={`
                            mixin-button-like
                            mixin-button-base
                            theme-button-generic-green
                            justify-center
                        `}
                    >
                        In Cart
                    </button>
                ) : (
                    <button
                        className={`
                            mixin-button-like
                            mixin-button-base
                            theme-button-generic-yellow
                            justify-center
                        `}
                        onClick={() => addToCartMutation.mutate()}
                    >
                        Add to Cart
                    </button>
                )}
                <div>
                    <InformationDisplayDialog
                        Trigger={({ onClick }) => (
                            <div
                                className="text-xs text-gray-900 hover:underline cursor-pointer w-fit"
                                onClick={onClick}
                            >
                                Display Information
                            </div>
                        )}
                        product={product}
                    />
                </div>
                {user?.is_admin === true && (
                    <div>
                        <EditProductDialog
                            Trigger={({ onClick }) => (
                                <div
                                    className="text-xs text-gray-900 hover:underline cursor-pointer w-fit"
                                    onClick={onClick}
                                >
                                    Edit
                                </div>
                            )}
                        />
                        <DeleteProductDialog
                            Trigger={({ onClick }) => (
                                <div
                                    className="text-xs text-gray-900 hover:underline cursor-pointer w-fit"
                                    onClick={onClick}
                                >
                                    Delete
                                </div>
                            )}
                        />
                    </div>
                )}
                <div
                    className="absolute h-0 border-b border-gray-900"
                    style={{ bottom: "-1px", left: "-5000px", right: "0px" }}
                ></div>
            </div>
        </ProductContext.Provider>
    );
}
