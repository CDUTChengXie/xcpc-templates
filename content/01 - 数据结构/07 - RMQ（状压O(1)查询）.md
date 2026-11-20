# RMQ（状压O(1)查询）

用数组构造 `RMQ<T>` 后，以 `对象(l,r)` 查询；换数组先 `init(a)` 重建。

比较器须给出严格弱序；建表后不能在线改单个元素，换数组须 init(a) 重建。 下标从 0 编号，区间 [l,r)（含左端，不含右端），0<=l<=r<=a.size()；空数组可建。 默认 less 取最小，greater 取最大；空区间返回 T{}（i64 为 0），不代表非空区间的最值。

预处理 O(n log n)；单次查询 O(1)；空间 O(n log n)。

```cpp
template <class T, class Cmp = std::less<T>> struct RMQ {
    const Cmp cmp = Cmp();
    static constexpr unsigned B = 64;
    using u64 = unsigned long long;
    int n;
    std::vector<std::vector<T>> a;
    std::vector<T> pre, suf, ini;
    std::vector<std::vector<std::vector<T>>> ina;

    // 创建空对象；使用前调用 init
    RMQ() {}
    // 用静态数组 v 建表
    RMQ(const std::vector<T> &v) {
        init(v);
    }

    // 替换数组并重建；数组不能在线修改
    void init(const std::vector<T> &v) {
        n = v.size();
        pre = suf = ini = v;
        if (!n) {
            return;
        }
        const int M = (n - 1) / B + 1;
        const int lg = std::__lg(M);
        a.assign(lg + 1, std::vector<T>(M));
        for (int i = 0; i < M; i++) {
            a[0][i] = v[i * B];
            for (int j = 1; j < B && i * B + j < n; j++) {
                a[0][i] = std::min(a[0][i], v[i * B + j], cmp);
            }
        }
        for (int i = 1; i < n; i++) {
            if (i % B) {
                pre[i] = std::min(pre[i], pre[i - 1], cmp);
            }
        }
        for (int i = n - 2; i >= 0; i--) {
            if (i % B != B - 1) {
                suf[i] = std::min(suf[i], suf[i + 1], cmp);
            }
        }
        for (int j = 0; j < lg; j++) {
            for (int i = 0; i + (2 << j) <= M; i++) {
                a[j + 1][i] = std::min(a[j][i], a[j][i + (1 << j)], cmp);
            }
        }
        // 块内建稀疏表，保证同块区间也能 O(1) 查询。
        // ponytail: 每64个元素存O(log64)层；需更省内存时改为经过对拍的块内位掩码查询。
        ina.assign(M, {});
        for (int i = 0; i < M; i++) {
            const int base = i * B;
            const int len = std::min<int>(n - base, B);
            std::vector<std::vector<T>> &tbl = ina[i];
            tbl.push_back(std::vector<T>(v.begin() + base, v.begin() + base + len));
            for (int j = 1; (1 << j) <= len; j++) {
                const int step = 1 << (j - 1);
                tbl.emplace_back(len - (1 << j) + 1);
                for (int k = 0; k + (1 << j) <= len; k++) {
                    tbl[j][k] = std::min(tbl[j - 1][k], tbl[j - 1][k + step], cmp);
                }
            }
        }
    }

    // 返回 [l,r) 的区间最值；空区间返回 T()
    T operator()(int l, int r) {
        // 空区间直接返回：n == 0 时 ina 为空，原实现会在下面访问 ina[0] 直接段错误。
        // 对 1 <= l <= r <= n 的正常调用这段判断只多一次比较，不影响复杂度。
        if (l >= r) {
            return T();
        }
        if (l / B != (r - 1) / B) {
            T ans = std::min(suf[l], pre[r - 1], cmp);
            l = l / B + 1;
            r = r / B;
            if (l < r) {
                int k = std::__lg(r - l);
                ans = std::min({ans, a[k][l], a[k][r - (1 << k)]}, cmp);
            }
            return ans;
        } else {
            // 同块：查该块的块内稀疏表。
            const auto &tbl = ina[l / B];
            const int base = B * (l / B);
            const int off = l - base;
            const int len = r - l;
            const int k = std::__lg(len);
            return std::min(tbl[k][off], tbl[k][off + len - (1 << k)], cmp);
        }
    }
};
```
