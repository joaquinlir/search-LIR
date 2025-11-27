// src/hooks/useSearchGroups.js
import { useState } from "react";
import axios from "axios";

export default function useSearchGroups() {
    const [searchGroups, setSearchGroups] = useState([]);

    const fetchSearchResults = async (term) => {
        try {
            const res = await axios.get("/api/search", { params: { q: term } });
            return res.data.results || [];
        } catch {
            return [];
        }
    };

    const fetchByTagExact = async (tagLabel) => {
        try {
            const res = await axios.get("/api/searchByTag", {
                params: { tag: tagLabel },
            });
            return res.data.results || [];
        } catch {
            return [];
        }
    };

    const handleSearchSubmit = async (value) => {
        const tag = value.toLowerCase().trim();
        const results = await fetchSearchResults(tag);

        setSearchGroups((prev) => {
            const i = prev.findIndex((g) => g.tag === tag);
            if (i >= 0) {
                const copy = [...prev];
                copy[i] = { tag, results, isQuickTag: false };
                return copy;
            }
            return [...prev, { tag, results, isQuickTag: false }];
        });
    };

    const handleQuickTagClick = async (label) => {
        const tag = label.toLowerCase().trim();
        const results = await fetchByTagExact(label);

        setSearchGroups((prev) => {
            const i = prev.findIndex((g) => g.tag === tag);
            if (i >= 0) {
                const copy = [...prev];
                copy[i] = { tag, results, isQuickTag: true };
                return copy;
            }
            return [...prev, { tag, results, isQuickTag: true }];
        });
    };

    const handleRemoveTag = (tag) =>
        setSearchGroups((prev) => prev.filter((g) => g.tag !== tag));

    const handleActiveTagClick = async (tag) => {
        const results = await fetchSearchResults(tag);
        setSearchGroups((prev) =>
            prev.map((g) => (g.tag === tag ? { ...g, results } : g))
        );
    };

    return {
        searchGroups,
        handleSearchSubmit,
        handleQuickTagClick,
        handleRemoveTag,
        handleActiveTagClick,
    };
}
