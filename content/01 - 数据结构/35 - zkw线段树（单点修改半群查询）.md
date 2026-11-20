# zkw线段树（单点修改半群查询）

op 满足结合律（只改括号不改结果）；查询区间非空；T 可默认构造且 op 接受任意 T（填充叶也会参与建树）；默认值无需为单位元（合并后不改变另一项的值）。 下标从 0 开始，区间为半开 [l,r)（含左端，不含右端）。

建树 O(n)；单点赋值、区间查询 O(log n)；空间 O(n)。

```cpp
template <class T, class Op> class ZKWSegmentTree {
    int n = 0, base = 1;
    vector<T> t;
    Op op;

  public:
    // 从数组建立 zkw 树；数组不可为空。
    ZKWSegmentTree(const vector<T> &a, Op operation) : n(a.size()), op(operation) {
        assert(n > 0);
        while (base < n)
            base <<= 1;
        t.resize(base << 1);
        for (int i = 0; i < n; i++)
            t[base + i] = a[i];
        for (int i = base - 1; i; i--)
            t[i] = op(t[i << 1], t[i << 1 | 1]);
    }
    // 把位置 p 赋为 x；0<=p<n。
    void set(int p, const T &x) {
        assert(0 <= p && p < n);
        t[base + p] = x;
        for (int i = (base + p) >> 1; i; i >>= 1)
            t[i] = op(t[i << 1], t[i << 1 | 1]);
    }
    // 返回非空 [l,r) 的有序合并结果。
    T query(int l, int r) const {
        assert(0 <= l && l < r && r <= n);
        l += base;
        r += base;
        bool hasL = false, hasR = false;
        T L{}, R{};
        while (l < r) {
            if (l & 1) {
                L = hasL ? op(L, t[l]) : t[l];
                hasL = true;
                l++;
            }
            if (r & 1) {
                --r;
                R = hasR ? op(t[r], R) : t[r];
                hasR = true;
            }
            l >>= 1;
            r >>= 1;
        }
        return hasL ? (hasR ? op(L, R) : L) : R;
    }
};
```
