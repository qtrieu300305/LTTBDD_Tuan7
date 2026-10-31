import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Header } from "../components/Header";
import { SearchBar } from "../components/SearchBar";
import { CategoryChips } from "../components/CategoryChips";
import { PriceFilter } from "../components/PriceFilter";
import { BookGrid } from "../components/BookGrid";
import { FloatingCartButton } from "../components/FloatingCartButton";
import { EmptyState } from "../components/EmptyState";
import { LoadingView } from "../components/LoadingView";
import { ErrorView } from "../components/ErrorView";
import { getBooks } from "../services/bookService";
import { getCategories } from "../services/categoryService";
import { getErrorMessage } from "../api/client";
import { useDebounce } from "../hooks/useDebounce";
import { useCart } from "../store/hooks";
import { filterBooks, PriceRange } from "../utils/filters";
import { TabScreenProps } from "../navigation/types";
import { Book, Category } from "../types";
import { colors, radius } from "../theme";

type SortOrder = "asc" | "desc" | null;

export function HomeScreen({ navigation, route }: TabScreenProps<"Home">) {
  const { totalQuantity } = useCart();

  const [books, setBooks] = useState<Book[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [b, c] = await Promise.all([getBooks(), getCategories()]);
      setBooks(b);
      setCategories(c);
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const [searchOpen, setSearchOpen] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [priceRange, setPriceRange] = useState<PriceRange>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>(null);

  const debouncedKeyword = useDebounce(keyword, 400);
  const visibleBooks = useMemo(() => {
    const filtered = filterBooks(books, { keyword: debouncedKeyword, categoryId, priceRange });
    if (sortOrder === null) return filtered;
    // sắp xếp trên bản sao để không làm thay đổi mảng gốc
    return [...filtered].sort((a, b) => (sortOrder === "asc" ? a.price - b.price : b.price - a.price));
  }, [books, debouncedKeyword, categoryId, priceRange, sortOrder]);

  // Nhận categoryId từ tab Danh mục rồi xoá params để không áp dụng lại
  useEffect(() => {
    const id = route.params?.categoryId;
    if (id !== undefined) {
      setCategoryId(id);
      navigation.setParams({ categoryId: undefined });
    }
  }, [route.params?.categoryId, navigation]);

  const hasFilter = keyword !== "" || categoryId !== null || priceRange !== null;
  const clearFilters = () => {
    setKeyword("");
    setCategoryId(null);
    setPriceRange(null);
  };

  let body: React.ReactElement;
  if (loading) {
    body = <LoadingView label="Đang tải sách…" />;
  } else if (error) {
    body = <ErrorView message={error} onRetry={load} />;
  } else {
    body = (
      <BookGrid
        data={visibleBooks}
        onPressBook={(b) => navigation.navigate("BookDetail", { bookId: b.id })}
        ListHeaderComponent={
          <View>
            <CategoryChips categories={categories} selectedId={categoryId} onSelect={setCategoryId} />
            <PriceFilter value={priceRange} onChange={setPriceRange} />
            <View style={styles.sortRow}>
              <Pressable
                style={[styles.sortBtn, sortOrder === "asc" && styles.sortBtnActive]}
                onPress={() => setSortOrder(sortOrder === "asc" ? null : "asc")}
              >
                <Text style={[styles.sortText, sortOrder === "asc" && styles.sortTextActive]}>Giá tăng dần ↑</Text>
              </Pressable>
              <Pressable
                style={[styles.sortBtn, sortOrder === "desc" && styles.sortBtnActive]}
                onPress={() => setSortOrder(sortOrder === "desc" ? null : "desc")}
              >
                <Text style={[styles.sortText, sortOrder === "desc" && styles.sortTextActive]}>Giá giảm dần ↓</Text>
              </Pressable>
            </View>
            {hasFilter && (
              <Pressable style={styles.clearBtn} onPress={clearFilters}>
                <Text style={styles.clearText}>✕ Xóa bộ lọc</Text>
              </Pressable>
            )}
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            emoji="🔎"
            title="Không tìm thấy sách phù hợp"
            message="Hãy thử từ khoá khác hoặc bỏ bớt bộ lọc."
            actionLabel="Xóa bộ lọc"
            onAction={clearFilters}
          />
        }
      />
    );
  }

  return (
    <View style={styles.container}>
      <Header title="📚 BookStore" onSearchPress={() => setSearchOpen((v) => !v)} />
      {searchOpen && (
        <SearchBar
          value={keyword}
          onChangeText={setKeyword}
          onClose={() => {
            setSearchOpen(false);
            setKeyword("");
          }}
        />
      )}
      {body}
      <FloatingCartButton count={totalQuantity} onPress={() => navigation.navigate("Cart")} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  clearBtn: {
    alignSelf: "flex-start",
    marginHorizontal: 12,
    marginBottom: 8,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: colors.danger,
  },
  clearText: { color: colors.danger, fontWeight: "700" },
  sortRow: { flexDirection: "row", gap: 8, paddingHorizontal: 12, paddingBottom: 8 },
  sortBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: colors.line,
  },
  sortBtnActive: { backgroundColor: colors.indigo, borderColor: colors.indigo },
  sortText: { color: colors.text, fontWeight: "600" },
  sortTextActive: { color: "#fff" },
});