import { memo, useState, useEffect } from "react";
import { asWidget, useGetIncrementalID } from "../../../../utils";
import { XCircleIcon } from "@heroicons/react/24/solid";

type Entry = [string, string];
type SpecificationValue = Record<string, Entry>;

function SpecificationInput({
    initial,
    name,
    onChange,
}: {
    name: string;
    initial?: Array<Entry>;
    onChange?: (value: SpecificationValue) => void;
}) {
    const getIncrementalID = useGetIncrementalID();
    const [value, setValue] = useState<SpecificationValue>(
        initial?.reduce<SpecificationValue>((acc, tuple) => {
            acc[getIncrementalID()] = tuple;
            return acc;
        }, {}) ?? {},
    );

    useEffect(() => {
        if (onChange == null) {
            return;
        }

        onChange(value);
    }, [value, onChange])

    return (
        <div className="flex flex-col gap-2">
            <input name={name} type="hidden" value={JSON.stringify(Object.values(value))} />
            {Object.entries(value).map(([ID, tuple]) => (
                <SpecificationInputField initial={tuple} setValue={setValue} ID={ID} key={ID} />
            ))}
            <div
                className="text-center text-sm transition-colors p-1 cursor-pointer
                bg-yellow-300 hover:bg-yellow-400"
                onClick={() => {
                    setValue((previous) => ({ ...previous, [getIncrementalID()]: ["", ""] }));
                }}
            >
                Add Field
            </div>
        </div>
    );
}

const SpecificationInputField = memo(function SpecificationInputField({
    initial,
    setValue,
    ID,
}: {
    initial?: Entry;
    setValue: React.Dispatch<React.SetStateAction<SpecificationValue>>;
    ID: string;
}) {
    const [field, setField] = useState<Entry>(initial ?? ["", ""]);
    
    useEffect(() => {
        setValue((previous) => {
            const newState = { ...previous };
            newState[ID] = field;
            return newState;
        });
    }, [field, setValue, ID]);

    return (
        <div className="flex flex-row gap-2 items-center">
            <div className="flex flex-col basis-1/2 group">
                <input
                    className="w-full text-sm transition-colors p-1 border border-gray-900 text-gray-900
                    bg-gray-100 focus:bg-gray-200"
                    value={field[0]}
                    onChange={({ target: { value } }) => {
                        setField((previous) => [value, previous[1]]);
                    }}
                    placeholder="Name"
                ></input>
            </div>
            <div className="flex flex-col basis-1/2">
                <input
                    className="w-full text-sm transition-colors p-1 border border-gray-900
                    bg-gray-100 focus:bg-gray-200"
                    value={field[1]}
                    onChange={({ target: { value } }) => {
                        setField((previous) => [previous[0], value]);
                    }}
                    placeholder="Value"
                ></input>
            </div>
            <XCircleIcon
                className="h-6 w-6 text-gray-900 cursor-pointer"
                onClick={() => {
                    setValue((previous) => {
                        const newState = { ...previous };
                        delete newState[ID];
                        return newState;
                    });
                }}
            />
        </div>
    );
});

export const SpecificationInputWidget = asWidget(SpecificationInput, {});