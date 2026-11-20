# 静态区间半群（DisjointSparseTable）

op 必须满足结合律（只改括号不改结果）；不要求交换律、幂等性或单位元（合并后不改变另一项的值）。 下标从 0 开始，查询非空区间 [l,r)（含左端，不含右端）；合并保留原数组顺序。

预处理时间、空间 O(n log n)；查询一次 op，O(1)（按 op 为常数时间计）。

```cpp
template <class T, class Op> class DisjointSparseTable {
    vector<T> a;
    vector<vector<T>> table;
    Op op;

  public:
    // 建立静态半群表；空数组可构造，不能查询。
    DisjointSparseTable(const vector<T> &v, Op operation) : a(v), op(operation) {
        size_t n = a.size();
        for (size_t half = 1; half < n; half *= 2) {
            table.push_back(a);
            auto &t = table.back();
            for (size_t l = 0; l < n; l += 2 * half) {
                size_t m = min(n, l + half), r = min(n, l + 2 * half);
                for (size_t i = m - 1; i > l; i--)
                    t[i - 1] = op(a[i - 1], t[i]);
                for (size_t i = m + 1; i < r; i++)
                    t[i] = op(t[i - 1], a[i]);
            }
        }
    }
    // 返回非空 [l,r) 的有序合并结果；无需单位元。
    T query(int l, int r) const {
        assert(0 <= l && l < r && r <= int(a.size()));
        if (r - l == 1)
            return a[l];
        int k = std::bit_width(unsigned(l ^ (r - 1))) - 1;
        return op(table[k][l], table[k][r - 1]);
    }
};
```
