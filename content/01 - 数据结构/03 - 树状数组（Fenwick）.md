# 树状数组（Fenwick）

先 `Fenwick<i64>(n)` 建全零数组；`add(p,delta)` 单点加，`sum(r)`、`rangeSum(l,r)` 查询。

长度 n>=0；add 禁止负下标；select 要求所有频次非负，k>=0；和须在 T 范围内。 下标从 0 编号，区间 [l,r)（含左端，不含右端），0<=l<=r<=n；select 的 k 从 0 起。 sum(r) 把 r 夹到 [0,n]，空数组和为 0；逆序对允许负数、重复值和空数组。

区间加、区间和用本章 34；每组新数据用 init(n) 清空旧状态。

add / sum / rangeSum / select 均 O(log n)；逆序对 O(n log n)，空间 O(n)。

```cpp
template <class T> struct Fenwick {
    int n;
    std::vector<T> a;

    // 构造长度 n_ 的全零树状数组，要求 n_>=0
    Fenwick(int n_ = 0) {
        init(n_);
    }

    // 清空并重设长度，要求 n_>=0
    void init(int n_) {
        n = n_;
        a.assign(n, T{});
    }

    // 给 0-based 位置 x 加 v，要求 0<=x<n；x=n 时无操作
    void add(int x, const T &v) {
        for (int i = x + 1; i <= n; i += i & -i) {
            a[i - 1] = a[i - 1] + v;
        }
    }

    // 返回 [0,x) 前缀和，将 x 夹到 [0,n]
    T sum(int x) {
        // x 可能是 0（空前缀）或超过 n；n == 0 时 a 是空 vector，访问 a[i-1] 会段错误。
        if (x <= 0 || n == 0) {
            return T{};
        }
        if (x > n) {
            x = n; // 前缀超出长度时等价于取整个数组
        }
        T ans{};
        for (int i = x; i > 0; i -= i & -i) {
            ans = ans + a[i - 1];
        }
        return ans;
    }

    // 返回半开区间 [l,r) 的和，通常要求 0<=l<=r<=n
    T rangeSum(int l, int r) {
        return sum(r) - sum(l);
    }

    // 求最小 x 使得前缀和 (x+1) > k，返回 x；无解返回 n
    int select(const T &k) {
        if (n <= 0) {
            return 0; // 空树状数组没有「第 k 小」可言
        }
        int x = 0;
        T cur{};
        for (int i = 1 << std::__lg(n); i; i /= 2) {
            if (x + i <= n && cur + a[x + i - 1] <= k) {
                x += i;
                cur = cur + a[x - 1];
            }
        }
        return x;
    }
};

// 返回严格逆序对数：i<j 且 values[i]>values[j]；相等不计，空数组返回 0，不改原数组。
// 排序去重压缩与基础 Compress 的规则一致；直接复用本文件 Fenwick，保持单文件可粘贴。
template <class T> i64 countInversions(const std::vector<T> &values) {
    if (values.size() > size_t(INT_MAX / 2))
        throw std::length_error("inversion array too large");
    std::vector<T> sorted = values;
    std::sort(sorted.begin(), sorted.end());
    sorted.erase(std::unique(sorted.begin(), sorted.end()), sorted.end());
    Fenwick<i64> fw((int)sorted.size());
    i64 result = 0;
    for (auto it = values.rbegin(); it != values.rend(); ++it) {
        int p = (int)(std::lower_bound(sorted.begin(), sorted.end(), *it) - sorted.begin());
        result += fw.sum(p); // [0,p) 只含严格小于当前值的后缀元素
        fw.add(p, 1);
    }
    return result;
}
```
