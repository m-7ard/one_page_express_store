import { Link } from "@tanstack/react-router";
import { useAuthContext } from "../_utils";
import { ArrowUturnLeftIcon, XMarkIcon } from "@heroicons/react/24/solid";
import { OrderType } from "../../../../../Types";
import ProductInformationDisplayDialog from "../../ProductInformationDisplayDialog";
import AbstractDialog, { AbstractDialogTrigger } from "../../../../elements/abstract/AbstractDialog";
import { Dialog } from "@headlessui/react";
import { generateLabel } from "../../../../../utils";
import { OrderContext, useOrderContext } from "./_utils";
import ActionsPopver from "./ActionsPopver/ActionsPopover";
import AbstractPopover from "../../../../elements/abstract/AbstractPopover";

export default function Orders() {
    // const queryClient = useQueryClient();
    // const navigate = useNavigate({ from: "/orders" });
    const { user, orders } = useAuthContext();

    return (
        <div className="generic-panel__body">
            <div className="flex flex-row gap-2 items-center justify-between">
                <div className="generic-panel__title">Orders</div>
                <Link to={"/profile"} className="flex flex-row gap-2 items-center hover:underline mixin-button-like">
                    <ArrowUturnLeftIcon className="w-4 h-4" />
                    <div className="text-base font-medium">Back</div>
                </Link>
            </div>
            <hr className="app__x-divider"></hr>
            {orders.map((order) => (
                <Order order={order} />
            ))}
        </div>
    );
}

function Order({ order }: { order: OrderType }) {
    //
    const {
        archive: { product },
    } = order;

    return (
        <OrderContext.Provider value={{ order }}>
            <div className="flex flex-col gap-2">
                <div className="grid grid-cols-12 gap-2 w-full text-gray-900">
                    <div className="bg-gray-600 col-span-4 min-h-full border border-gray-900">
                        <div className="relative aspect-square max-w-full min-h-full ">
                            <img
                                src={`/media/${product.images[0]}`}
                                className="absolute w-full h-full"
                                style={{ objectFit: "cover" }}
                                alt="prop"
                            ></img>
                        </div>
                    </div>
                    <div className="flex flex-col col-span-8 gap-2">
                        <div className="flex flex-col gap-0.5">
                            <div className="text-base leading-none font-medium break-all truncate">
                                {product.name}aaaaaaaaaaaaaaaaaaaaaaaaaaaa
                            </div>
                            <div className="text-xs leading-none text-gray-600 break-all">
                                Status: {generateLabel(order.status)}
                            </div>
                        </div>
                        <div className="flex flex-col gap-0.5 mt-auto">
                            <ProductInformationDisplayDialog
                                Trigger={({ onClick }) => (
                                    <button
                                        className={`
                                            mixin-button-like 
                                            mixin-button-sm
                                            theme-button-generic-white
                                            justify-center 
                                        `}
                                        onClick={onClick}
                                    >
                                        Product Archive
                                    </button>
                                )}
                                product={product}
                            />
                            <OrderInformationDisplayDialog
                                Trigger={({ onClick }) => (
                                    <button
                                        className={`
                                        mixin-button-like 
                                        mixin-button-sm
                                        theme-button-generic-white
                                        justify-center 
                                    `}
                                        onClick={onClick}
                                    >
                                        Order Data
                                    </button>
                                )}
                            />
                        </div>
                    </div>
                </div>
                <ActionsPopver
                    Trigger={({ open }) => (
                        <AbstractPopover.Trigger
                            className={`
                                mixin-button-like 
                                mixin-button-sm
                                theme-button-generic-white
                                ${open && "theme-button-generic-white--active"}
                                justify-center 
                            `}
                        >
                            Actions
                        </AbstractPopover.Trigger>
                    )}
                    positioning={{ top: "100%", left: "0px", right: "0px" }}
                />
            </div>
        </OrderContext.Provider>
    );
}

function OrderInformationDisplayDialog({ Trigger }: { Trigger: AbstractDialogTrigger }) {
    const { order } = useOrderContext();

    const fields = [
        ["Order ID", `#${order.id}`],
        ["Amount", order.amount],
        ["Total", `$${order.amount * order.archive.product.price}`],
        ["Shipping Name", order.shipping_name],
        ["Shipping Address Primary", order.shipping_address_primary],
        ["Shipping Address Secondary", order.shipping_address_secondary],
        ["Shipping City", order.shipping_city],
        ["Shipping State", order.shipping_state],
        ["Shipping Zip", order.shipping_zip],
        ["Shipping Country", order.shipping_country],
    ];

    return (
        <AbstractDialog
            Trigger={Trigger}
            Panel={({ onClose }) => (
                <Dialog.Panel className="top-0 right-0 bottom-0 p-4 max-w-sm w-full max-h-full overflow-hidden bg-yellow-50 absolute text-gray-900 border-l border-gray-900 shadow">
                    <div className="flex flex-col gap-4 h-full overflow-auto">
                        <div className="flex flex-row items-center justify-between">
                            <div className="text-lg font-medium">Order Data</div>
                            <div className="absolute right-4 top-4 cursor-pointer" onClick={onClose}>
                                <XMarkIcon className="w-6 h-6" />
                            </div>
                        </div>
                        <div className="flex flex-col bg-gray-100 border border-gray-900">
                            {fields.map(([fieldName, fieldValue], i) => (
                                <>
                                    {i > 0 && <hr className="app__x-divider"></hr>}
                                    <div className="flex flex-row flex-wrap gap-1 px-2 py-1 leading-none justify-between">
                                        <div className="">{fieldName}:</div>
                                        <div className="">{fieldValue}</div>
                                    </div>
                                </>
                            ))}
                        </div>
                    </div>
                </Dialog.Panel>
            )}
        />
    );
}
