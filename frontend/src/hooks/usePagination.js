// src/hooks/usePagination.js
import { useState } from "react";

export default function usePagination(items, perPage = 6) {
    const [page, setPage] = useState(0);

    const totalPages = Math.max(1, Math.ceil(items.length / perPage));
    const currentPage = Math.min(page, totalPages - 1);

    const visibleItems = items.slice(
        currentPage * perPage,
        currentPage * perPage + perPage
    );

    const next = () => setPage((p) => Math.min(totalPages - 1, p + 1));
    const prev = () => setPage((p) => Math.max(0, p - 1));
    const reset = () => setPage(0);

    return { visibleItems, totalPages, currentPage, next, prev, reset, setPage };
}
