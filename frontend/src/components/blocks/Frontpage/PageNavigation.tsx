import { useQueryClient } from "@tanstack/react-query";
import App from "./Frontpage";
import { PaginatedQuery, ProductType } from "../../../Types";
import { UncontrolledGenericListbox } from "../../elements/widgets/GenericListbox/UncontrolledGenericListbox";
import { useQueryStringContext } from "../../../Context";

export function PageNavigation() {
    const { page_index } = useQueryStringContext();
    const queryClient = useQueryClient();
    const productsQuery = queryClient.getQueryData<PaginatedQuery<ProductType>>(["products"])!;

    return (
        <div className="flex gap-2 justify-between items-center">
            <div
                className={[
                    ...["text-base select-none", App.BaseButtonClassNames],
                    ...(productsQuery.previousPage == null
                        ? ["bg-gray-200 text-gray-600 border-gray-600"]
                        : ["hover:underline cursor-pointer"]),
                ].join(" ")}
                onClick={() => {
                    if (productsQuery.previousPage == null) {
                        return;
                    }
                    page_index.current = productsQuery.previousPage;
                    queryClient.invalidateQueries({ queryKey: ["products"] });
                }}
            >
                Back
            </div>
            <div className="flex flex-row gap-2 items-center">
                <div className="text-base">Page</div>
                <UncontrolledGenericListbox
                    name="page_index"
                    value={page_index.current.toString()}
                    choices={Array.from({
                        length: Math.floor(productsQuery.count / 24) + 1,
                    }).map((_, i) => {
                        return { value: `${i + 1}`, label: `${i + 1}` };
                    })}
                    onChange={(value) => {
                        if (parseInt(value) === page_index.current) {
                            return;
                        }

                        page_index.current = parseInt(value);
                        queryClient.invalidateQueries({ queryKey: ["products"] });
                    }}
                    nullable={false}
                />
            </div>
            <div
                className={[
                    ...["text-base select-none", App.BaseButtonClassNames],
                    ...(productsQuery.nextPage == null
                        ? ["bg-gray-200 text-gray-600 border-gray-600"]
                        : ["hover:underline cursor-pointer"]),
                ].join(" ")}
                onClick={() => {
                    if (productsQuery.nextPage == null) {
                        return;
                    }
                    page_index.current = productsQuery.nextPage;
                    queryClient.invalidateQueries({ queryKey: ["products"] });
                }}
            >
                Next
            </div>
        </div>
    );
}
