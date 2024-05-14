import { Popover } from "@headlessui/react";
import { Link, useRouterState } from "@tanstack/react-router";
import AbstractPopover, { AbstractPopoverTrigger } from "./abstract/AbstractPopover";
import App from "../pages/linked/App/App";

const CHOICES = [
    { label: "App", value: "/" },
    { label: "Dashboard", value: "/dashboard" },
];

export default function RouteNavigator({ Trigger }: { Trigger: AbstractPopoverTrigger }) {
    const router = useRouterState();

    return (
        <AbstractPopover
            Trigger={Trigger}
            Panel={({ setPopperElement, popper: { styles, attributes } }) => (
                <Popover.Panel
                    className="flex flex-col mt-1 w-48 bg-gray-50 shadow divide-y divide-gray-900 border border-gray-900 z-50 max-w-96 ui-active:outline-none ui-open:outline-none"
                    ref={setPopperElement}
                    style={styles.popper}
                    {...attributes.popper}
                >
                    {({ close }) => (
                        <>
                            {CHOICES.map(({ label, value }) => (
                                <Link
                                    key={value}
                                    to={value}
                                    className={[
                                        "group ui-active:outline-none ui-open:outline-none",
                                        "justify-between text-gray-900",
                                        App.BaseButtonClassNames.replace("border", ""),
                                        ...[
                                            router.location.pathname === value
                                                ? "bg-gray-200"
                                                : "bg-gray-100 hover:bg-gray-200",
                                        ],
                                    ].join(" ")}
                                    onClick={() => {
                                        close()
                                    }}
                                >
                                    <div className="whitespace-nowrap">{label}</div>
                                </Link>
                            ))}
                        </>
                    )}
                </Popover.Panel>
            )}
            options={{
                placement: "bottom-start",
                strategy: "fixed",
                modifiers: [
                    {
                        name: "preventOverflow",
                        options: {
                            altAxis: true,
                        },
                    },
                ],
            }}
        />
    );
}
