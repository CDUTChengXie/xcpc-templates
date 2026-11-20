# 珂朵莉树（ODT）

i64 值、加法和结果不溢出；非随机恶意数据可能退化。 下标从 0 开始，区间 [l,r)（含左端，不含右端）；k 从 0 开始；空区间的和为 0。

影响 s 段时赋值/加/和 O(s+log n)，kth O(s log s)，幂和 O(s log e)；最坏 s=O(n)。

```cpp
class ChthollyTree {
    int n;
    map<int, i64> seg;
    auto split(int p) {
        if (p == n)
            return seg.end();
        auto it = prev(seg.upper_bound(p));
        return seg.emplace(p, it->second).first;
    }
    void check(int l, int r) const {
        assert(0 <= l && l <= r && r <= n);
    }
    template <class F> void visit(int l, int r, F f) {
        if (l == r)
            return;
        auto end = split(r), it = split(l);
        while (it != end) {
            auto next = std::next(it);
            f(it, min(r, next == seg.end() ? n : next->first) - it->first);
            it = next;
        }
    }

  public:
    // 建立等值段；空数组合法。
    explicit ChthollyTree(const vector<i64> &a) : n(a.size()) {
        for (int i = 0; i < n; i++)
            if (!i || a[i] != a[i - 1])
                seg.emplace(i, a[i]);
    }
    // 将 [l,r) 赋值为 x；无返回值。
    void assign(int l, int r, i64 x) {
        check(l, r);
        if (l == r)
            return;
        auto end = split(r), begin = split(l);
        seg.erase(begin, end);
        seg.emplace(l, x);
    }
    // 给 [l,r) 每个元素加 x；无返回值。
    void add(int l, int r, i64 x) {
        check(l, r);
        visit(l, r, [&](auto it, int) { it->second += x; });
    }
    // 返回 [l,r) 的和；结果须在 i64 范围内。
    i64 sum(int l, int r) {
        check(l, r);
        i64 ans = 0;
        visit(l, r, [&](auto it, int len) { ans += it->second * len; });
        return ans;
    }
    // 返回非空 [l,r) 的第 k 小值；k 从 0 开始。
    i64 kth(int l, int r, int k) {
        check(l, r);
        assert(0 <= k && k < r - l);
        vector<pair<i64, int>> values;
        visit(l, r, [&](auto it, int len) { values.emplace_back(it->second, len); });
        sort(values.begin(), values.end());
        for (auto [v, len] : values) {
            if (k < len)
                return v;
            k -= len;
        }
        assert(false);
        return 0;
    }
    // 返回 [l,r) 的 e 次幂和模 mod；e>=0，mod>0，负值先取非负余数。
    i64 powerSum(int l, int r, u64 e, i64 mod) {
        check(l, r);
        assert(mod > 0);
        i64 ans = 0;
        visit(l, r, [&](auto it, int len) {
            i64 x = it->second % mod;
            if (x < 0)
                x += mod;
            i64 v = 1 % mod;
            for (u64 k = e; k; k >>= 1, x = i128(x) * x % mod)
                if (k & 1)
                    v = i128(v) * x % mod;
            ans = (i128(ans) + i128(v) * len) % mod;
        });
        return ans;
    }
    // ponytail: 不自动合并相邻等值段，最多 n 段；恶意数据改用有复杂度保证的线段树。
};
```
