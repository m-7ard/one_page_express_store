import { useQueryClient } from "@tanstack/react-query";
import App from "../Frontpage";
import { PaginatedQuery, ProductType } from "../../../../../../Types";
import { UncontrolledGenericListbox } from "../../../../../elements/widgets/GenericListbox/UncontrolledGenericListbox";
import { useQueryStringContext } from "../../../../../../Context";

export function PageNavigation() {
    const { page_index } = useQueryStringContext();
    const queryClient = useQueryClient();
    const productsQuery = queryClient.getQueryData<PaginatedQuery<ProductType>>(["products"])!;

    return (
        <div className="flex gap-2 justify-between items-center">
            <div
                className={`
                    mixin-button-like
                    mixin-button-base
                    theme-button-generic-white
                    ${productsQuery.previousPage == null && 'contrast-75 cursor-not-allowed'}
                `}
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
                className={`
                    mixin-button-like
                    mixin-button-base
                    theme-button-generic-white
                    ${productsQuery.nextPage == null && 'contrast-75 cursor-not-allowed'}
                `}
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
