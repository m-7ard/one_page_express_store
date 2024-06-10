import FilterOrderDialog from "../../../unlinked/FilterOrdersDialog";
import { AdjustmentsHorizontalIcon } from "@heroicons/react/24/solid";
import { PageNavigation } from "../Frontpage/PageNavigation/PageNavigation";
import { useAppContext, useQueryStringContext } from "../../../../../Context";
import { OrderType, PaginatedQuery } from "../../../../../Types";
import { useQuery } from "@tanstack/react-query";
import { Navigate } from "@tanstack/react-router";

export default function Dashboard() {
    const { buildQueryString } = useQueryStringContext();

    const ordersQuery = useQuery<PaginatedQuery<OrderType>>({
        queryKey: ["orders"],
        throwOnError: true,
        queryFn: async () => {
            const response = await fetch(`/api/orders/list?${buildQueryString()}`, {
                method: "GET",
            });
            if (response.ok) {
                return response.json();
            }
        },
    });

    const { user } = useAppContext();

    if (user == null) {
        return <Navigate from={"/dashboard/"} to={"/"} />;
    }

    return (
        ordersQuery.isSuccess && (
            <div className="flex flex-row gap-4 p-4">
                <div className="flex flex-col grow gap-4 max-w-screen-lg w-full mx-auto">
                    <div className="flex flex-row items-center gap-4 text-gray-900">
                        <FilterOrderDialog
                            Trigger={({ onClick }) => (
                                <div
                                    className={`
                                        mixin-button-like
                                        mixin-button-base
                                        theme-button-generic-white
                                    `}
                                    onClick={onClick}
                                >
                                    <div>Filter</div>
                                    <AdjustmentsHorizontalIcon className="w-4 h-4" />
                                </div>
                            )}
                        />
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-8 border-b border-t border-gray-900 overflow-hidden">
                        <DummyOrder></DummyOrder>
                        <DummyOrder></DummyOrder>
                        <DummyOrder></DummyOrder>
                        <DummyOrder></DummyOrder>
                        <DummyOrder></DummyOrder>
                        <DummyOrder></DummyOrder>
                    </div>
                    <PageNavigation queryKey={["orders"]} />
                </div>
            </div>
        )
    );
}

function DummyOrder() {
    return (
        <div className="flex flex-col py-8 gap-4 col-span-1 relative mt-px">
            <div className="w-full relative border border-gray-900 border-dashed" style={{ aspectRatio: 0.711 }}></div>
            <div>
                <div className="text-sm text-gray-600 bg-yellow-200 my-1 w-fit text-transparent">1234567890</div>
                <div className="text-base text-gray-900 font-medium bg-yellow-200 my-1 w-fit text-transparent">
                    1234567890
                </div>
                <div className="text-sm text-gray-900 bg-yellow-200 my-1 w-fit text-transparent">1234567890</div>
            </div>
            <button
                className={`
                    mixin-button-like
                    mixin-button-base
                    border border-gray-900 border-dashed
                    justify-center
                `}
            >
                <div className="text-gray-900 bg-yellow-200 w-fit text-transparent">1234567890</div>
            </button>
            <div
                className="absolute h-0 border-b border-gray-900"
                style={{ bottom: "-1px", left: "-5000px", right: "0px" }}
            ></div>
        </div>
    );
}
