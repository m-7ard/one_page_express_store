import { Listbox } from "@headlessui/react";
import { useEffect, useState } from "react";
import { asWidget } from "../../../../utils";
import { ChevronRightIcon } from "@heroicons/react/24/solid";
import App from "../../../blocks/App/App";

type Value = string | number;
type Choice = {
    value: Value;
    label: Value;
};

export function FormListBox({
    name,
    initial,
    choices,
    onChange,
    placeholder = "---",
}: {
    initial?: Value;
    choices: Choice[];
    name: string;
    onChange?: (value?: Value) => void;
    placeholder?: string;
}) {
    const [selectedValue, setSelectedValue] = useState(initial);
    const selectedChoice = choices.find((choice) => choice.value === selectedValue) ?? {
        value: "",
        label: placeholder,
    };

    useEffect(() => {
        if (onChange == null) {
            return;
        }

        onChange(selectedValue);
    }, [selectedValue, onChange]);

    return (
        <Listbox
            name={name}
            value={selectedChoice.value}
            onChange={setSelectedValue}
            className="flex flex-col gap-2 select-none"
            as="div"
        >
            {({ open }) => (
                <>
                    <Listbox.Button
                        className={`${App.BaseButtonClassNames} justify-between bg-gray-100 hover:bg-gray-200 cursor-pointer`}
                    >
                        {selectedChoice.label}
                        <ChevronRightIcon className={`w-4 h-4 ${open && 'rotate-90'}`} />
                    </Listbox.Button>
                    <Listbox.Options
                        className={"overflow-auto max-h-64 divide-y divide-gray-900 border border-gray-900"}
                    >
                        <Listbox.Option
                            className={`${App.BaseButtonClassNames.replace("border", "")} text-base hover:bg-gray-200 ${selectedValue == null ? "bg-gray-200" : "bg-gray-100"}`}
                            value={undefined}
                        >
                            {placeholder}
                        </Listbox.Option>
                        {choices.map(({ value, label }, i) => (
                            <Listbox.Option key={i} value={value}>
                                {({ active, selected }) => (
                                    <div className={`${App.BaseButtonClassNames.replace("border", "")} text-base hover:bg-gray-200 ${selected ? "bg-gray-200" : "bg-gray-100"}`}>
                                        {label}
                                    </div>
                                )}
                            </Listbox.Option>
                        ))}
                    </Listbox.Options>
                </>
            )}
        </Listbox>
    );
}

const FormListboxWidget = asWidget(FormListBox, {});
export default FormListboxWidget;
