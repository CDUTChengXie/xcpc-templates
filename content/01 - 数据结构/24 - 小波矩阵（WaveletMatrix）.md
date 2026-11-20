# 小波矩阵（WaveletMatrix）

数组不修改；元素为 i64，可有负数、重复值。 下标从 0 开始，区间 [l,r)（含左端，不含右端），0<=l<=r<=a.size()，k 从 0 开始；空区间只可计数，结果为 0。

建树 O(n log n)；查询 O(log sigma)；压位层 O(n log sigma / 64) 个字加 O(n) 个原值。

```cpp
class WaveletMatrix {
    struct Level {
        vector<u64> bits;
        vector<int> pref;
        int zeros = 0;
        int rank(int r) const {
            int block = r / 64, rem = r % 64;
            return pref[block] +
                   (rem ? __builtin_popcountll(bits[block] & ((1ULL << rem) - 1)) : 0);
        }
    };
    int n, height;
    vector<i64> values;
    vector<Level> levels;
    void check(int l, int r) const {
        assert(0 <= l && l <= r && r <= n);
    }

  public:
    // 从静态数组建立压位矩阵；空数组合法。
    explicit WaveletMatrix(const vector<i64> &a) : n(a.size()), values(a) {
        sort(values.begin(), values.end());
        values.erase(unique(values.begin(), values.end()), values.end());
        height = std::bit_width(unsigned(values.size() ? values.size() - 1 : 0));
        vector<int> cur(n), next(n);
        for (int i = 0; i < n; i++)
            cur[i] = lower_bound(values.begin(), values.end(), a[i]) - values.begin();
        for (int b = height - 1; b >= 0; b--) {
            Level z;
            z.bits.assign((n + 63) / 64, 0);
            for (int i = 0; i < n; i++)
                if ((cur[i] >> b) & 1)
                    z.bits[i / 64] |= 1ULL << (i % 64);
                else
                    z.zeros++;
            z.pref.assign(z.bits.size() + 1, 0);
            for (int i = 0; i < int(z.bits.size()); i++)
                z.pref[i + 1] = z.pref[i] + __builtin_popcountll(z.bits[i]);
            int l = 0, r = z.zeros;
            for (int x : cur)
                next[((x >> b) & 1) ? r++ : l++] = x;
            cur.swap(next);
            levels.push_back(std::move(z));
        }
    }
    // 返回 [l,r) 的第 k 小原值；k 从 0 开始，区间须非空。
    i64 kth(int l, int r, int k) const {
        check(l, r);
        assert(0 <= k && k < r - l);
        int value = 0;
        for (int d = 0; d < height; d++) {
            const auto &z = levels[d];
            int a = z.rank(l), b = z.rank(r), cnt = r - l - (b - a);
            if (k < cnt) {
                l -= a;
                r -= b;
            } else {
                k -= cnt;
                value |= 1U << (height - 1 - d);
                l = z.zeros + a;
                r = z.zeros + b;
            }
        }
        return values[value];
    }
    // 返回 [l,r) 中严格小于 x 的数量；空区间返回 0。
    int countLess(int l, int r, i64 x) const {
        check(l, r);
        int v = lower_bound(values.begin(), values.end(), x) - values.begin(), ans = 0;
        if (v == int(values.size()))
            return r - l;
        for (int d = 0; d < height; d++) {
            const auto &z = levels[d];
            int a = z.rank(l), b = z.rank(r);
            if ((v >> (height - 1 - d)) & 1) {
                ans += r - l - (b - a);
                l = z.zeros + a;
                r = z.zeros + b;
            } else {
                l -= a;
                r -= b;
            }
        }
        return ans;
    }
    // 返回 [l,r) 中落在值域 [lo,hi) 的数量；lo<=hi。
    int countRange(int l, int r, i64 lo, i64 hi) const {
        assert(lo <= hi);
        return countLess(l, r, hi) - countLess(l, r, lo);
    }
};
```
