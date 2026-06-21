import type { QueryKey, UseMutationOptions, UseMutationResult, UseQueryOptions, UseQueryResult } from '@tanstack/react-query';
import type { Alert, AuthResponse, Category, CategoryBreakdown, CategoryInput, CategoryUpdate, DashboardStats, EquipmentInput, EquipmentItem, ExpiryRow, GetExpiryReportParams, GetMonthlyConsumptionParams, GetRecentTransactionsParams, GetStockMovementReportParams, GetStockSummaryReportParams, GetTopConsumedProductsParams, HealthStatus, ListAlertsParams, ListEquipmentParams, ListProductsParams, ListTransactionsParams, Location, LocationInput, LocationUpdate, LoginInput, LowStockRow, MonthlyConsumption, Product, ProductInput, ProductList, ProductUpdate, StockMovementRow, StockSummaryRow, TopConsumedItem, Transaction, TransactionInput, TransactionList, User } from './api.schemas';
import { customFetch } from '../custom-fetch';
import type { ErrorType, BodyType } from '../custom-fetch';
type AwaitedInput<T> = PromiseLike<T> | T;
type Awaited<O> = O extends AwaitedInput<infer T> ? T : never;
type SecondParameter<T extends (...args: never) => unknown> = Parameters<T>[1];
export declare const getHealthCheckUrl: () => string;
/**
 * @summary Health check
 */
export declare const healthCheck: (options?: RequestInit) => Promise<HealthStatus>;
export declare const getHealthCheckQueryKey: () => readonly ["/api/healthz"];
export declare const getHealthCheckQueryOptions: <TData = Awaited<ReturnType<typeof healthCheck>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData> & {
    queryKey: QueryKey;
};
export type HealthCheckQueryResult = NonNullable<Awaited<ReturnType<typeof healthCheck>>>;
export type HealthCheckQueryError = ErrorType<unknown>;
/**
 * @summary Health check
 */
export declare function useHealthCheck<TData = Awaited<ReturnType<typeof healthCheck>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getLoginUrl: () => string;
/**
 * @summary Login
 */
export declare const login: (loginInput: LoginInput, options?: RequestInit) => Promise<AuthResponse>;
export declare const getLoginMutationOptions: <TError = ErrorType<void>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof login>>, TError, {
        data: BodyType<LoginInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof login>>, TError, {
    data: BodyType<LoginInput>;
}, TContext>;
export type LoginMutationResult = NonNullable<Awaited<ReturnType<typeof login>>>;
export type LoginMutationBody = BodyType<LoginInput>;
export type LoginMutationError = ErrorType<void>;
/**
* @summary Login
*/
export declare const useLogin: <TError = ErrorType<void>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof login>>, TError, {
        data: BodyType<LoginInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof login>>, TError, {
    data: BodyType<LoginInput>;
}, TContext>;
export declare const getLogoutUrl: () => string;
/**
 * @summary Logout
 */
export declare const logout: (options?: RequestInit) => Promise<void>;
export declare const getLogoutMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof logout>>, TError, void, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof logout>>, TError, void, TContext>;
export type LogoutMutationResult = NonNullable<Awaited<ReturnType<typeof logout>>>;
export type LogoutMutationError = ErrorType<unknown>;
/**
* @summary Logout
*/
export declare const useLogout: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof logout>>, TError, void, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof logout>>, TError, void, TContext>;
export declare const getGetMeUrl: () => string;
/**
 * @summary Get current user
 */
export declare const getMe: (options?: RequestInit) => Promise<User>;
export declare const getGetMeQueryKey: () => readonly ["/api/auth/me"];
export declare const getGetMeQueryOptions: <TData = Awaited<ReturnType<typeof getMe>>, TError = ErrorType<void>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getMe>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getMe>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetMeQueryResult = NonNullable<Awaited<ReturnType<typeof getMe>>>;
export type GetMeQueryError = ErrorType<void>;
/**
 * @summary Get current user
 */
export declare function useGetMe<TData = Awaited<ReturnType<typeof getMe>>, TError = ErrorType<void>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getMe>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getListCategoriesUrl: () => string;
/**
 * @summary List all categories
 */
export declare const listCategories: (options?: RequestInit) => Promise<Category[]>;
export declare const getListCategoriesQueryKey: () => readonly ["/api/categories"];
export declare const getListCategoriesQueryOptions: <TData = Awaited<ReturnType<typeof listCategories>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listCategories>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listCategories>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListCategoriesQueryResult = NonNullable<Awaited<ReturnType<typeof listCategories>>>;
export type ListCategoriesQueryError = ErrorType<unknown>;
/**
 * @summary List all categories
 */
export declare function useListCategories<TData = Awaited<ReturnType<typeof listCategories>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listCategories>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getCreateCategoryUrl: () => string;
/**
 * @summary Create a category
 */
export declare const createCategory: (categoryInput: CategoryInput, options?: RequestInit) => Promise<Category>;
export declare const getCreateCategoryMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createCategory>>, TError, {
        data: BodyType<CategoryInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof createCategory>>, TError, {
    data: BodyType<CategoryInput>;
}, TContext>;
export type CreateCategoryMutationResult = NonNullable<Awaited<ReturnType<typeof createCategory>>>;
export type CreateCategoryMutationBody = BodyType<CategoryInput>;
export type CreateCategoryMutationError = ErrorType<unknown>;
/**
* @summary Create a category
*/
export declare const useCreateCategory: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createCategory>>, TError, {
        data: BodyType<CategoryInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof createCategory>>, TError, {
    data: BodyType<CategoryInput>;
}, TContext>;
export declare const getUpdateCategoryUrl: (id: number) => string;
/**
 * @summary Update a category
 */
export declare const updateCategory: (id: number, categoryUpdate: CategoryUpdate, options?: RequestInit) => Promise<Category>;
export declare const getUpdateCategoryMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateCategory>>, TError, {
        id: number;
        data: BodyType<CategoryUpdate>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof updateCategory>>, TError, {
    id: number;
    data: BodyType<CategoryUpdate>;
}, TContext>;
export type UpdateCategoryMutationResult = NonNullable<Awaited<ReturnType<typeof updateCategory>>>;
export type UpdateCategoryMutationBody = BodyType<CategoryUpdate>;
export type UpdateCategoryMutationError = ErrorType<unknown>;
/**
* @summary Update a category
*/
export declare const useUpdateCategory: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateCategory>>, TError, {
        id: number;
        data: BodyType<CategoryUpdate>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof updateCategory>>, TError, {
    id: number;
    data: BodyType<CategoryUpdate>;
}, TContext>;
export declare const getDeleteCategoryUrl: (id: number) => string;
/**
 * @summary Delete a category
 */
export declare const deleteCategory: (id: number, options?: RequestInit) => Promise<void>;
export declare const getDeleteCategoryMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteCategory>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof deleteCategory>>, TError, {
    id: number;
}, TContext>;
export type DeleteCategoryMutationResult = NonNullable<Awaited<ReturnType<typeof deleteCategory>>>;
export type DeleteCategoryMutationError = ErrorType<unknown>;
/**
* @summary Delete a category
*/
export declare const useDeleteCategory: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteCategory>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof deleteCategory>>, TError, {
    id: number;
}, TContext>;
export declare const getListLocationsUrl: () => string;
/**
 * @summary List all locations
 */
export declare const listLocations: (options?: RequestInit) => Promise<Location[]>;
export declare const getListLocationsQueryKey: () => readonly ["/api/locations"];
export declare const getListLocationsQueryOptions: <TData = Awaited<ReturnType<typeof listLocations>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listLocations>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listLocations>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListLocationsQueryResult = NonNullable<Awaited<ReturnType<typeof listLocations>>>;
export type ListLocationsQueryError = ErrorType<unknown>;
/**
 * @summary List all locations
 */
export declare function useListLocations<TData = Awaited<ReturnType<typeof listLocations>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listLocations>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getCreateLocationUrl: () => string;
/**
 * @summary Create a location
 */
export declare const createLocation: (locationInput: LocationInput, options?: RequestInit) => Promise<Location>;
export declare const getCreateLocationMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createLocation>>, TError, {
        data: BodyType<LocationInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof createLocation>>, TError, {
    data: BodyType<LocationInput>;
}, TContext>;
export type CreateLocationMutationResult = NonNullable<Awaited<ReturnType<typeof createLocation>>>;
export type CreateLocationMutationBody = BodyType<LocationInput>;
export type CreateLocationMutationError = ErrorType<unknown>;
/**
* @summary Create a location
*/
export declare const useCreateLocation: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createLocation>>, TError, {
        data: BodyType<LocationInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof createLocation>>, TError, {
    data: BodyType<LocationInput>;
}, TContext>;
export declare const getUpdateLocationUrl: (id: number) => string;
/**
 * @summary Update a location
 */
export declare const updateLocation: (id: number, locationUpdate: LocationUpdate, options?: RequestInit) => Promise<Location>;
export declare const getUpdateLocationMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateLocation>>, TError, {
        id: number;
        data: BodyType<LocationUpdate>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof updateLocation>>, TError, {
    id: number;
    data: BodyType<LocationUpdate>;
}, TContext>;
export type UpdateLocationMutationResult = NonNullable<Awaited<ReturnType<typeof updateLocation>>>;
export type UpdateLocationMutationBody = BodyType<LocationUpdate>;
export type UpdateLocationMutationError = ErrorType<unknown>;
/**
* @summary Update a location
*/
export declare const useUpdateLocation: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateLocation>>, TError, {
        id: number;
        data: BodyType<LocationUpdate>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof updateLocation>>, TError, {
    id: number;
    data: BodyType<LocationUpdate>;
}, TContext>;
export declare const getDeleteLocationUrl: (id: number) => string;
/**
 * @summary Delete a location
 */
export declare const deleteLocation: (id: number, options?: RequestInit) => Promise<void>;
export declare const getDeleteLocationMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteLocation>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof deleteLocation>>, TError, {
    id: number;
}, TContext>;
export type DeleteLocationMutationResult = NonNullable<Awaited<ReturnType<typeof deleteLocation>>>;
export type DeleteLocationMutationError = ErrorType<unknown>;
/**
* @summary Delete a location
*/
export declare const useDeleteLocation: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteLocation>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof deleteLocation>>, TError, {
    id: number;
}, TContext>;
export declare const getListProductsUrl: (params?: ListProductsParams) => string;
/**
 * @summary List products with filters and pagination
 */
export declare const listProducts: (params?: ListProductsParams, options?: RequestInit) => Promise<ProductList>;
export declare const getListProductsQueryKey: (params?: ListProductsParams) => readonly ["/api/products", ...ListProductsParams[]];
export declare const getListProductsQueryOptions: <TData = Awaited<ReturnType<typeof listProducts>>, TError = ErrorType<unknown>>(params?: ListProductsParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listProducts>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listProducts>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListProductsQueryResult = NonNullable<Awaited<ReturnType<typeof listProducts>>>;
export type ListProductsQueryError = ErrorType<unknown>;
/**
 * @summary List products with filters and pagination
 */
export declare function useListProducts<TData = Awaited<ReturnType<typeof listProducts>>, TError = ErrorType<unknown>>(params?: ListProductsParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listProducts>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getCreateProductUrl: () => string;
/**
 * @summary Create a product
 */
export declare const createProduct: (productInput: ProductInput, options?: RequestInit) => Promise<Product>;
export declare const getCreateProductMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createProduct>>, TError, {
        data: BodyType<ProductInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof createProduct>>, TError, {
    data: BodyType<ProductInput>;
}, TContext>;
export type CreateProductMutationResult = NonNullable<Awaited<ReturnType<typeof createProduct>>>;
export type CreateProductMutationBody = BodyType<ProductInput>;
export type CreateProductMutationError = ErrorType<unknown>;
/**
* @summary Create a product
*/
export declare const useCreateProduct: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createProduct>>, TError, {
        data: BodyType<ProductInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof createProduct>>, TError, {
    data: BodyType<ProductInput>;
}, TContext>;
export declare const getGetProductByBarcodeUrl: (barcode: string) => string;
/**
 * @summary Lookup product by barcode (for scanning)
 */
export declare const getProductByBarcode: (barcode: string, options?: RequestInit) => Promise<Product>;
export declare const getGetProductByBarcodeQueryKey: (barcode: string) => readonly [`/api/products/barcode/${string}`];
export declare const getGetProductByBarcodeQueryOptions: <TData = Awaited<ReturnType<typeof getProductByBarcode>>, TError = ErrorType<void>>(barcode: string, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getProductByBarcode>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getProductByBarcode>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetProductByBarcodeQueryResult = NonNullable<Awaited<ReturnType<typeof getProductByBarcode>>>;
export type GetProductByBarcodeQueryError = ErrorType<void>;
/**
 * @summary Lookup product by barcode (for scanning)
 */
export declare function useGetProductByBarcode<TData = Awaited<ReturnType<typeof getProductByBarcode>>, TError = ErrorType<void>>(barcode: string, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getProductByBarcode>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getGetProductUrl: (id: number) => string;
/**
 * @summary Get a product by ID
 */
export declare const getProduct: (id: number, options?: RequestInit) => Promise<Product>;
export declare const getGetProductQueryKey: (id: number) => readonly [`/api/products/${number}`];
export declare const getGetProductQueryOptions: <TData = Awaited<ReturnType<typeof getProduct>>, TError = ErrorType<void>>(id: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getProduct>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getProduct>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetProductQueryResult = NonNullable<Awaited<ReturnType<typeof getProduct>>>;
export type GetProductQueryError = ErrorType<void>;
/**
 * @summary Get a product by ID
 */
export declare function useGetProduct<TData = Awaited<ReturnType<typeof getProduct>>, TError = ErrorType<void>>(id: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getProduct>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getUpdateProductUrl: (id: number) => string;
/**
 * @summary Update a product
 */
export declare const updateProduct: (id: number, productUpdate: ProductUpdate, options?: RequestInit) => Promise<Product>;
export declare const getUpdateProductMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateProduct>>, TError, {
        id: number;
        data: BodyType<ProductUpdate>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof updateProduct>>, TError, {
    id: number;
    data: BodyType<ProductUpdate>;
}, TContext>;
export type UpdateProductMutationResult = NonNullable<Awaited<ReturnType<typeof updateProduct>>>;
export type UpdateProductMutationBody = BodyType<ProductUpdate>;
export type UpdateProductMutationError = ErrorType<unknown>;
/**
* @summary Update a product
*/
export declare const useUpdateProduct: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateProduct>>, TError, {
        id: number;
        data: BodyType<ProductUpdate>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof updateProduct>>, TError, {
    id: number;
    data: BodyType<ProductUpdate>;
}, TContext>;
export declare const getDeleteProductUrl: (id: number) => string;
/**
 * @summary Delete a product
 */
export declare const deleteProduct: (id: number, options?: RequestInit) => Promise<void>;
export declare const getDeleteProductMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteProduct>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof deleteProduct>>, TError, {
    id: number;
}, TContext>;
export type DeleteProductMutationResult = NonNullable<Awaited<ReturnType<typeof deleteProduct>>>;
export type DeleteProductMutationError = ErrorType<unknown>;
/**
* @summary Delete a product
*/
export declare const useDeleteProduct: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteProduct>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof deleteProduct>>, TError, {
    id: number;
}, TContext>;
export declare const getListTransactionsUrl: (params?: ListTransactionsParams) => string;
/**
 * @summary List transactions with filters
 */
export declare const listTransactions: (params?: ListTransactionsParams, options?: RequestInit) => Promise<TransactionList>;
export declare const getListTransactionsQueryKey: (params?: ListTransactionsParams) => readonly ["/api/transactions", ...ListTransactionsParams[]];
export declare const getListTransactionsQueryOptions: <TData = Awaited<ReturnType<typeof listTransactions>>, TError = ErrorType<unknown>>(params?: ListTransactionsParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listTransactions>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listTransactions>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListTransactionsQueryResult = NonNullable<Awaited<ReturnType<typeof listTransactions>>>;
export type ListTransactionsQueryError = ErrorType<unknown>;
/**
 * @summary List transactions with filters
 */
export declare function useListTransactions<TData = Awaited<ReturnType<typeof listTransactions>>, TError = ErrorType<unknown>>(params?: ListTransactionsParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listTransactions>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getCreateTransactionUrl: () => string;
/**
 * @summary Create a stock transaction (in or out)
 */
export declare const createTransaction: (transactionInput: TransactionInput, options?: RequestInit) => Promise<Transaction>;
export declare const getCreateTransactionMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createTransaction>>, TError, {
        data: BodyType<TransactionInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof createTransaction>>, TError, {
    data: BodyType<TransactionInput>;
}, TContext>;
export type CreateTransactionMutationResult = NonNullable<Awaited<ReturnType<typeof createTransaction>>>;
export type CreateTransactionMutationBody = BodyType<TransactionInput>;
export type CreateTransactionMutationError = ErrorType<unknown>;
/**
* @summary Create a stock transaction (in or out)
*/
export declare const useCreateTransaction: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createTransaction>>, TError, {
        data: BodyType<TransactionInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof createTransaction>>, TError, {
    data: BodyType<TransactionInput>;
}, TContext>;
export declare const getGetTransactionUrl: (id: number) => string;
/**
 * @summary Get a transaction by ID
 */
export declare const getTransaction: (id: number, options?: RequestInit) => Promise<Transaction>;
export declare const getGetTransactionQueryKey: (id: number) => readonly [`/api/transactions/${number}`];
export declare const getGetTransactionQueryOptions: <TData = Awaited<ReturnType<typeof getTransaction>>, TError = ErrorType<unknown>>(id: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getTransaction>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getTransaction>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetTransactionQueryResult = NonNullable<Awaited<ReturnType<typeof getTransaction>>>;
export type GetTransactionQueryError = ErrorType<unknown>;
/**
 * @summary Get a transaction by ID
 */
export declare function useGetTransaction<TData = Awaited<ReturnType<typeof getTransaction>>, TError = ErrorType<unknown>>(id: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getTransaction>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getListEquipmentUrl: (params?: ListEquipmentParams) => string;
/**
 * @summary List all equipment
 */
export declare const listEquipment: (params?: ListEquipmentParams, options?: RequestInit) => Promise<EquipmentItem[]>;
export declare const getListEquipmentQueryKey: (params?: ListEquipmentParams) => readonly ["/api/equipment", ...ListEquipmentParams[]];
export declare const getListEquipmentQueryOptions: <TData = Awaited<ReturnType<typeof listEquipment>>, TError = ErrorType<unknown>>(params?: ListEquipmentParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listEquipment>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listEquipment>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListEquipmentQueryResult = NonNullable<Awaited<ReturnType<typeof listEquipment>>>;
export type ListEquipmentQueryError = ErrorType<unknown>;
/**
 * @summary List all equipment
 */
export declare function useListEquipment<TData = Awaited<ReturnType<typeof listEquipment>>, TError = ErrorType<unknown>>(params?: ListEquipmentParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listEquipment>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getCreateEquipmentUrl: () => string;
/**
 * @summary Create equipment record
 */
export declare const createEquipment: (equipmentInput: EquipmentInput, options?: RequestInit) => Promise<EquipmentItem>;
export declare const getCreateEquipmentMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createEquipment>>, TError, {
        data: BodyType<EquipmentInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof createEquipment>>, TError, {
    data: BodyType<EquipmentInput>;
}, TContext>;
export type CreateEquipmentMutationResult = NonNullable<Awaited<ReturnType<typeof createEquipment>>>;
export type CreateEquipmentMutationBody = BodyType<EquipmentInput>;
export type CreateEquipmentMutationError = ErrorType<unknown>;
/**
* @summary Create equipment record
*/
export declare const useCreateEquipment: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createEquipment>>, TError, {
        data: BodyType<EquipmentInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof createEquipment>>, TError, {
    data: BodyType<EquipmentInput>;
}, TContext>;
export declare const getGetEquipmentUrl: (id: number) => string;
/**
 * @summary Get equipment by ID
 */
export declare const getEquipment: (id: number, options?: RequestInit) => Promise<EquipmentItem>;
export declare const getGetEquipmentQueryKey: (id: number) => readonly [`/api/equipment/${number}`];
export declare const getGetEquipmentQueryOptions: <TData = Awaited<ReturnType<typeof getEquipment>>, TError = ErrorType<unknown>>(id: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getEquipment>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getEquipment>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetEquipmentQueryResult = NonNullable<Awaited<ReturnType<typeof getEquipment>>>;
export type GetEquipmentQueryError = ErrorType<unknown>;
/**
 * @summary Get equipment by ID
 */
export declare function useGetEquipment<TData = Awaited<ReturnType<typeof getEquipment>>, TError = ErrorType<unknown>>(id: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getEquipment>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getUpdateEquipmentUrl: (id: number) => string;
/**
 * @summary Update equipment record
 */
export declare const updateEquipment: (id: number, equipmentInput: EquipmentInput, options?: RequestInit) => Promise<EquipmentItem>;
export declare const getUpdateEquipmentMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateEquipment>>, TError, {
        id: number;
        data: BodyType<EquipmentInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof updateEquipment>>, TError, {
    id: number;
    data: BodyType<EquipmentInput>;
}, TContext>;
export type UpdateEquipmentMutationResult = NonNullable<Awaited<ReturnType<typeof updateEquipment>>>;
export type UpdateEquipmentMutationBody = BodyType<EquipmentInput>;
export type UpdateEquipmentMutationError = ErrorType<unknown>;
/**
* @summary Update equipment record
*/
export declare const useUpdateEquipment: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateEquipment>>, TError, {
        id: number;
        data: BodyType<EquipmentInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof updateEquipment>>, TError, {
    id: number;
    data: BodyType<EquipmentInput>;
}, TContext>;
export declare const getDeleteEquipmentUrl: (id: number) => string;
/**
 * @summary Delete equipment record
 */
export declare const deleteEquipment: (id: number, options?: RequestInit) => Promise<void>;
export declare const getDeleteEquipmentMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteEquipment>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof deleteEquipment>>, TError, {
    id: number;
}, TContext>;
export type DeleteEquipmentMutationResult = NonNullable<Awaited<ReturnType<typeof deleteEquipment>>>;
export type DeleteEquipmentMutationError = ErrorType<unknown>;
/**
* @summary Delete equipment record
*/
export declare const useDeleteEquipment: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteEquipment>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof deleteEquipment>>, TError, {
    id: number;
}, TContext>;
export declare const getGetEquipmentHistoryUrl: (id: number) => string;
/**
 * @summary Get maintenance / part-usage history for a machine
 */
export declare const getEquipmentHistory: (id: number, options?: RequestInit) => Promise<Transaction[]>;
export declare const getGetEquipmentHistoryQueryKey: (id: number) => readonly [`/api/equipment/${number}/history`];
export declare const getGetEquipmentHistoryQueryOptions: <TData = Awaited<ReturnType<typeof getEquipmentHistory>>, TError = ErrorType<unknown>>(id: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getEquipmentHistory>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getEquipmentHistory>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetEquipmentHistoryQueryResult = NonNullable<Awaited<ReturnType<typeof getEquipmentHistory>>>;
export type GetEquipmentHistoryQueryError = ErrorType<unknown>;
/**
 * @summary Get maintenance / part-usage history for a machine
 */
export declare function useGetEquipmentHistory<TData = Awaited<ReturnType<typeof getEquipmentHistory>>, TError = ErrorType<unknown>>(id: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getEquipmentHistory>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getGetDashboardStatsUrl: () => string;
/**
 * @summary Get dashboard summary statistics
 */
export declare const getDashboardStats: (options?: RequestInit) => Promise<DashboardStats>;
export declare const getGetDashboardStatsQueryKey: () => readonly ["/api/dashboard/stats"];
export declare const getGetDashboardStatsQueryOptions: <TData = Awaited<ReturnType<typeof getDashboardStats>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getDashboardStats>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getDashboardStats>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetDashboardStatsQueryResult = NonNullable<Awaited<ReturnType<typeof getDashboardStats>>>;
export type GetDashboardStatsQueryError = ErrorType<unknown>;
/**
 * @summary Get dashboard summary statistics
 */
export declare function useGetDashboardStats<TData = Awaited<ReturnType<typeof getDashboardStats>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getDashboardStats>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getGetRecentTransactionsUrl: (params?: GetRecentTransactionsParams) => string;
/**
 * @summary Get recent transactions for dashboard
 */
export declare const getRecentTransactions: (params?: GetRecentTransactionsParams, options?: RequestInit) => Promise<Transaction[]>;
export declare const getGetRecentTransactionsQueryKey: (params?: GetRecentTransactionsParams) => readonly ["/api/dashboard/recent-transactions", ...GetRecentTransactionsParams[]];
export declare const getGetRecentTransactionsQueryOptions: <TData = Awaited<ReturnType<typeof getRecentTransactions>>, TError = ErrorType<unknown>>(params?: GetRecentTransactionsParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getRecentTransactions>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getRecentTransactions>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetRecentTransactionsQueryResult = NonNullable<Awaited<ReturnType<typeof getRecentTransactions>>>;
export type GetRecentTransactionsQueryError = ErrorType<unknown>;
/**
 * @summary Get recent transactions for dashboard
 */
export declare function useGetRecentTransactions<TData = Awaited<ReturnType<typeof getRecentTransactions>>, TError = ErrorType<unknown>>(params?: GetRecentTransactionsParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getRecentTransactions>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getGetTopConsumedProductsUrl: (params?: GetTopConsumedProductsParams) => string;
/**
 * @summary Get top consumed products
 */
export declare const getTopConsumedProducts: (params?: GetTopConsumedProductsParams, options?: RequestInit) => Promise<TopConsumedItem[]>;
export declare const getGetTopConsumedProductsQueryKey: (params?: GetTopConsumedProductsParams) => readonly ["/api/dashboard/top-consumed", ...GetTopConsumedProductsParams[]];
export declare const getGetTopConsumedProductsQueryOptions: <TData = Awaited<ReturnType<typeof getTopConsumedProducts>>, TError = ErrorType<unknown>>(params?: GetTopConsumedProductsParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getTopConsumedProducts>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getTopConsumedProducts>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetTopConsumedProductsQueryResult = NonNullable<Awaited<ReturnType<typeof getTopConsumedProducts>>>;
export type GetTopConsumedProductsQueryError = ErrorType<unknown>;
/**
 * @summary Get top consumed products
 */
export declare function useGetTopConsumedProducts<TData = Awaited<ReturnType<typeof getTopConsumedProducts>>, TError = ErrorType<unknown>>(params?: GetTopConsumedProductsParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getTopConsumedProducts>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getGetMonthlyConsumptionUrl: (params?: GetMonthlyConsumptionParams) => string;
/**
 * @summary Get monthly consumption trend data
 */
export declare const getMonthlyConsumption: (params?: GetMonthlyConsumptionParams, options?: RequestInit) => Promise<MonthlyConsumption[]>;
export declare const getGetMonthlyConsumptionQueryKey: (params?: GetMonthlyConsumptionParams) => readonly ["/api/dashboard/monthly-consumption", ...GetMonthlyConsumptionParams[]];
export declare const getGetMonthlyConsumptionQueryOptions: <TData = Awaited<ReturnType<typeof getMonthlyConsumption>>, TError = ErrorType<unknown>>(params?: GetMonthlyConsumptionParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getMonthlyConsumption>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getMonthlyConsumption>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetMonthlyConsumptionQueryResult = NonNullable<Awaited<ReturnType<typeof getMonthlyConsumption>>>;
export type GetMonthlyConsumptionQueryError = ErrorType<unknown>;
/**
 * @summary Get monthly consumption trend data
 */
export declare function useGetMonthlyConsumption<TData = Awaited<ReturnType<typeof getMonthlyConsumption>>, TError = ErrorType<unknown>>(params?: GetMonthlyConsumptionParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getMonthlyConsumption>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getGetCategoryBreakdownUrl: () => string;
/**
 * @summary Get inventory value by category
 */
export declare const getCategoryBreakdown: (options?: RequestInit) => Promise<CategoryBreakdown[]>;
export declare const getGetCategoryBreakdownQueryKey: () => readonly ["/api/dashboard/category-breakdown"];
export declare const getGetCategoryBreakdownQueryOptions: <TData = Awaited<ReturnType<typeof getCategoryBreakdown>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getCategoryBreakdown>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getCategoryBreakdown>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetCategoryBreakdownQueryResult = NonNullable<Awaited<ReturnType<typeof getCategoryBreakdown>>>;
export type GetCategoryBreakdownQueryError = ErrorType<unknown>;
/**
 * @summary Get inventory value by category
 */
export declare function useGetCategoryBreakdown<TData = Awaited<ReturnType<typeof getCategoryBreakdown>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getCategoryBreakdown>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getListAlertsUrl: (params?: ListAlertsParams) => string;
/**
 * @summary List active alerts
 */
export declare const listAlerts: (params?: ListAlertsParams, options?: RequestInit) => Promise<Alert[]>;
export declare const getListAlertsQueryKey: (params?: ListAlertsParams) => readonly ["/api/alerts", ...ListAlertsParams[]];
export declare const getListAlertsQueryOptions: <TData = Awaited<ReturnType<typeof listAlerts>>, TError = ErrorType<unknown>>(params?: ListAlertsParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listAlerts>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listAlerts>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListAlertsQueryResult = NonNullable<Awaited<ReturnType<typeof listAlerts>>>;
export type ListAlertsQueryError = ErrorType<unknown>;
/**
 * @summary List active alerts
 */
export declare function useListAlerts<TData = Awaited<ReturnType<typeof listAlerts>>, TError = ErrorType<unknown>>(params?: ListAlertsParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listAlerts>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getGetStockSummaryReportUrl: (params?: GetStockSummaryReportParams) => string;
/**
 * @summary Get stock summary report
 */
export declare const getStockSummaryReport: (params?: GetStockSummaryReportParams, options?: RequestInit) => Promise<StockSummaryRow[]>;
export declare const getGetStockSummaryReportQueryKey: (params?: GetStockSummaryReportParams) => readonly ["/api/reports/stock-summary", ...GetStockSummaryReportParams[]];
export declare const getGetStockSummaryReportQueryOptions: <TData = Awaited<ReturnType<typeof getStockSummaryReport>>, TError = ErrorType<unknown>>(params?: GetStockSummaryReportParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getStockSummaryReport>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getStockSummaryReport>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetStockSummaryReportQueryResult = NonNullable<Awaited<ReturnType<typeof getStockSummaryReport>>>;
export type GetStockSummaryReportQueryError = ErrorType<unknown>;
/**
 * @summary Get stock summary report
 */
export declare function useGetStockSummaryReport<TData = Awaited<ReturnType<typeof getStockSummaryReport>>, TError = ErrorType<unknown>>(params?: GetStockSummaryReportParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getStockSummaryReport>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getGetStockMovementReportUrl: (params?: GetStockMovementReportParams) => string;
/**
 * @summary Get stock movement report
 */
export declare const getStockMovementReport: (params?: GetStockMovementReportParams, options?: RequestInit) => Promise<StockMovementRow[]>;
export declare const getGetStockMovementReportQueryKey: (params?: GetStockMovementReportParams) => readonly ["/api/reports/stock-movement", ...GetStockMovementReportParams[]];
export declare const getGetStockMovementReportQueryOptions: <TData = Awaited<ReturnType<typeof getStockMovementReport>>, TError = ErrorType<unknown>>(params?: GetStockMovementReportParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getStockMovementReport>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getStockMovementReport>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetStockMovementReportQueryResult = NonNullable<Awaited<ReturnType<typeof getStockMovementReport>>>;
export type GetStockMovementReportQueryError = ErrorType<unknown>;
/**
 * @summary Get stock movement report
 */
export declare function useGetStockMovementReport<TData = Awaited<ReturnType<typeof getStockMovementReport>>, TError = ErrorType<unknown>>(params?: GetStockMovementReportParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getStockMovementReport>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getGetLowStockReportUrl: () => string;
/**
 * @summary Get low stock report
 */
export declare const getLowStockReport: (options?: RequestInit) => Promise<LowStockRow[]>;
export declare const getGetLowStockReportQueryKey: () => readonly ["/api/reports/low-stock"];
export declare const getGetLowStockReportQueryOptions: <TData = Awaited<ReturnType<typeof getLowStockReport>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getLowStockReport>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getLowStockReport>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetLowStockReportQueryResult = NonNullable<Awaited<ReturnType<typeof getLowStockReport>>>;
export type GetLowStockReportQueryError = ErrorType<unknown>;
/**
 * @summary Get low stock report
 */
export declare function useGetLowStockReport<TData = Awaited<ReturnType<typeof getLowStockReport>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getLowStockReport>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getGetExpiryReportUrl: (params?: GetExpiryReportParams) => string;
/**
 * @summary Get expiry report
 */
export declare const getExpiryReport: (params?: GetExpiryReportParams, options?: RequestInit) => Promise<ExpiryRow[]>;
export declare const getGetExpiryReportQueryKey: (params?: GetExpiryReportParams) => readonly ["/api/reports/expiry", ...GetExpiryReportParams[]];
export declare const getGetExpiryReportQueryOptions: <TData = Awaited<ReturnType<typeof getExpiryReport>>, TError = ErrorType<unknown>>(params?: GetExpiryReportParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getExpiryReport>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getExpiryReport>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetExpiryReportQueryResult = NonNullable<Awaited<ReturnType<typeof getExpiryReport>>>;
export type GetExpiryReportQueryError = ErrorType<unknown>;
/**
 * @summary Get expiry report
 */
export declare function useGetExpiryReport<TData = Awaited<ReturnType<typeof getExpiryReport>>, TError = ErrorType<unknown>>(params?: GetExpiryReportParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getExpiryReport>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export {};
//# sourceMappingURL=api.d.ts.map