import { XMarkIcon } from "@heroicons/react/24/solid";
import { OrderContext, useOrderContext, useOrderShippingDialogContext } from "./_utils";
import AbstractDialog, {
    AbstractDialogPanel,
    AbstractDialogTrigger,
} from "../../../../../elements/abstract/AbstractDialog";
import { Dialog } from "@headlessui/react";
import { OrderShippingType, OrderType } from "../../../../../../Types";
import { generateLabel } from "../../../../../../utils";
import ConfirmOrderDialog from "./ConfirmOrderDialog/ConfirmOrderDialog";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import React from "react";

export default function Order({ order }: { order: OrderType }) {
    return (
        <OrderContext.Provider value={order}>
            <div className="flex flex-col py-8 gap-4 col-span-1 relative mt-px">
                <div className="w-full relative border border-gray-900" style={{ aspectRatio: 0.711 }}>
                    <img
                        src={`/media/${order.archive.product.images[0]}`}
                        className="absolute w-full h-full"
                        style={{ objectFit: "cover" }}
                        alt="prop"
                    ></img>
                </div>
                <div>
                    <div className="text-sm text-gray-600">{generateLabel(order.status)}</div>
                    <div className="text-base text-gray-900 font-medium">{order.archive.product.name}</div>
                </div>
                <div className="flex flex-col gap-1">
                    {order.status !== "pending" && order.status !== 'completed' && order.status !== 'presumed_completed' && (
                        <ViewOrderShippingDialog
                            Trigger={({ onClick }) => (
                                <button
                                    className={`
                                        mixin-button-like
                                        mixin-button-base
                                        theme-button-generic-yellow
                                        justify-center
                                    `}
                                    onClick={onClick}
                                >
                                    Mark Complete
                                </button>
                            )}
                        />
                    )}
                    {order.status !== "pending" && (
                        <ViewOrderShippingDialog
                            Trigger={({ onClick }) => (
                                <button
                                    className={`
                                        mixin-button-like
                                        mixin-button-base
                                        theme-button-generic-yellow
                                        justify-center
                                    `}
                                    onClick={onClick}
                                >
                                    View Shipping
                                </button>
                            )}
                        />
                    )}
                    {order.status !== "pending" && (
                        <OrderInformationDisplayDialog
                            Trigger={({ onClick }) => (
                                <button
                                    className={`
                                        mixin-button-like
                                        mixin-button-base
                                        theme-button-generic-yellow
                                        justify-center
                                    `}
                                    onClick={onClick}
                                >
                                    Edit Shipping
                                </button>
                            )}
                        />
                    )}
                    <OrderInformationDisplayDialog
                        Trigger={({ onClick }) => (
                            <button
                                className={`
                                    mixin-button-like
                                    mixin-button-base
                                    theme-button-generic-white
                                    justify-center
                                `}
                                onClick={onClick}
                            >
                                Order Data
                            </button>
                        )}
                    />
                    <ConfirmOrderDialog
                        Trigger={({ onClick }) => (
                            <button
                                className={`
                                        mixin-button-like
                                        mixin-button-base
                                        theme-button-generic-yellow
                                        justify-center
                                    `}
                                onClick={onClick}
                            >
                                Add Shipping
                            </button>
                        )}
                    />
                    {order.status === "pending" && (
                        <button
                            className={`
                                mixin-button-like
                                mixin-button-base
                                theme-button-generic-white
                                justify-center
                            `}
                        >
                            Cancel Order
                        </button>
                    )}
                </div>
                <div
                    className="absolute h-0 border-b border-gray-900"
                    style={{ bottom: "-1px", left: "-5000px", right: "0px" }}
                ></div>
            </div>
        </OrderContext.Provider>
    );
}

function OrderInformationDisplayDialog({ Trigger }: { Trigger: AbstractDialogTrigger }) {
    const order = useOrderContext();

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

function ViewOrderShippingDialog({ Trigger }: { Trigger: AbstractDialogTrigger }) {
    return <AbstractDialog Trigger={Trigger} Panel={ViewOrderShippingDialog.Panel} />;
}

ViewOrderShippingDialog.Panel = function Panel({ onClose }: React.ComponentProps<AbstractDialogPanel>) {
    const order = useOrderContext();
    const queryClient = useQueryClient();

    const shippingQuery = useQuery<OrderShippingType>({
        queryKey: ["order", order.id, "shipping"],
        queryFn: async () => {
            const cachedQuery = queryClient.getQueryData<OrderShippingType>(["order", order.id, "shipping"]);
            if (cachedQuery != null) {
                console.log("using cached");
                return Promise.resolve(cachedQuery);
            }
            const response = await fetch(`/api/orders/${order.id}/shipping`, {
                method: "GET",
            });
            if (response.ok) {
                return response.json();
            }
        },
    });

    return (
        <Dialog.Panel className="top-0 right-0 bottom-0 p-4 max-w-sm w-full max-h-full overflow-hidden bg-yellow-50 absolute text-gray-900 border-l border-gray-900 shadow">
            <div className="flex flex-col gap-4 h-full overflow-auto">
                <div className="flex flex-row items-center justify-between">
                    <div className="text-lg font-medium">Order Data</div>
                    <div className="absolute right-4 top-4 cursor-pointer" onClick={onClose}>
                        <XMarkIcon className="w-6 h-6" />
                    </div>
                </div>
                {shippingQuery.isSuccess ? (
                    <div className="flex flex-col bg-gray-100 border border-gray-900">
                        <div className="flex flex-row flex-wrap gap-1 px-2 py-1 leading-none justify-between">
                            <div className="">Tracking Number:</div>
                            <div className="">{shippingQuery.data.tracking_number}</div>
                        </div>
                        <hr className="app__x-divider"></hr>
                        <div className="flex flex-row flex-wrap gap-1 px-2 py-1 leading-none justify-between">
                            <div className="">Courier Name:</div>
                            <div className="">{shippingQuery.data.courier_name}</div>
                        </div>
                        <hr className="app__x-divider"></hr>
                        <div className="flex flex-row flex-wrap gap-1 px-2 py-1 leading-none justify-between">
                            <div className="">Shipped On:</div>
                            <div className="">
                                {new Date(shippingQuery.data.date_created).toLocaleString(undefined, { timeZone: "UTC" })}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="leading-none">Fetching Shipping Data</div>
                )}
            </div>
        </Dialog.Panel>
    );
};
