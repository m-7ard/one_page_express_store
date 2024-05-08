import { Popover } from "@headlessui/react";
import AbstractPopover, { AbstractPopoverTrigger } from "../../elements/abstract/AbstractPopover";
import { getWhiteSurfaceButtonClassName } from "../App/App";

const CHOICES = [
    { label: "All Orders", value: "all" },
    { label: "Pending Orders", value: "pending" },
    { label: "Ongoing Orders", value: "ongoing" },
    { label: "Completed Orders", value: "completed" },
];

export default function Dashboard() {
    return (
        <div className="flex flex-col p-4 grow bg-yellow-50 text-gray-900  max-w-screen-lg w-full mx-auto">
            <DashboardPopover
                Trigger={({ setReferenceElement, open }) => (
                    <Popover.Button
                        className={[getWhiteSurfaceButtonClassName({ active: open }), "w-full"].join(" ")}
                        ref={setReferenceElement}
                    >
                        Orders By
                    </Popover.Button>
                )}
            />
        </div>
    );
}

function DashboardPopover({ Trigger }: { Trigger: AbstractPopoverTrigger }) {
    return (
        <AbstractPopover
            Trigger={Trigger}
            Panel={({ setPopperElement, popper: { styles, attributes } }) => (
                <Popover.Panel
                    className="flex flex-col mt-1 bg-gray-50 shadow divide-y divide-gray-900 border border-gray-900 z-50 ui-active:outline-none ui-open:outline-none"
                    ref={setPopperElement}
                    style={styles.popper}
                    {...attributes.popper}
                >
                    {CHOICES.map(({ label, value }) => (
                        <Popover.Button key={value}>
                            <div className={getWhiteSurfaceButtonClassName({ active: false }).replace("border", "")}>
                                <div className="whitespace-nowrap">{label}</div>
                            </div>
                        </Popover.Button>
                    ))}
                </Popover.Panel>
            )}
            options={{
                placement: "bottom-end",
                strategy: "fixed",
                modifiers: [
                    {
                        name: "preventOverflow",
                        options: {
                            altAxis: true,
                        },
                    },
                    {
                        name: "sameWidth",
                        enabled: true,
                        fn: ({ state }) => {
                            state.styles.popper.width = `${state.rects.reference.width}px`;
                        },
                        phase: "beforeWrite",
                        requires: ["computeStyles"],
                    },
                ],
            }}
        />
    );
}
