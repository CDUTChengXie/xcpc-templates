# 有向加权矩阵树与BEST欧拉路计数

模域用现有 Z（默认 1e9+7）；点 [0,n)，root 合法；weights 为模权重；欧拉路重边作为多条边输入，边数 < P。 type=0 为无向树，1 为 root 能沿树边到所有点，2 为所有点能沿树边到 root；自环不计生成树。 Euler 边标签可区分，重边分别计数，首边未固定；空边且起终点相同计 1，无欧拉路计 0。

矩阵树 O(n³+m)，BEST O(n³+m)，空间 O(n²+m)。

```cpp
#ifndef XCPC_MODINT
#define XCPC_MODINT

// 作用于取模类的快速幂：power(Z(2), 10) 得到 2^10
template <class T> constexpr T power(T a, i64 b) {
    T res = 1;
    for (; b; b /= 2, a *= a) {
        if (b % 2) {
            res *= a;
        }
    }
    return res;
}

// 模数 > 2^30 时使用：乘法用 __int128 精确计算，不依赖浮点精度
constexpr i64 mul(i64 a, i64 b, i64 p) {
    return i64(i128(a) * b % p);
}

template <i64 P> struct MLong {
    i64 x;

    constexpr MLong() : x{} {}
    // 将有符号整数转为当前模数下的非负余数。
    constexpr MLong(i64 x) : x{norm(x % getMod())} {}

    static i64 Mod;
    // 返回模板指定的模数；P=0 时使用 setMod 设置的值。
    constexpr static i64 getMod() {
        return P > 0 ? P : Mod;
    }
    // 设置动态模数，仅 P=0 时生效；须在创建数值前设置，求逆要求素数。
    constexpr static void setMod(i64 Mod_) {
        Mod = Mod_;
    }
    // 将 (-mod,2*mod) 范围内的值修正到 [0,mod)。
    constexpr i64 norm(i64 x) const {
        if (x < 0) {
            x += getMod();
        }
        if (x >= getMod()) {
            x -= getMod();
        }
        return x;
    }
    // 返回 [0,mod) 的整数余数，用于输出或与普通整数计算。
    constexpr i64 val() const {
        return x;
    }
    explicit constexpr operator i64() const {
        return x;
    }
    constexpr MLong operator-() const {
        MLong res;
        res.x = norm(getMod() - x);
        return res;
    }
    // 返回非零数的乘法逆元，当前模数必须为素数。
    constexpr MLong inv() const {
        assert(x != 0);
        return power(*this, getMod() - 2);
    }
    constexpr MLong &operator*=(MLong rhs) & {
        x = mul(x, rhs.x, getMod());
        return *this;
    }
    constexpr MLong &operator+=(MLong rhs) & {
        x = i64((i128(x) + rhs.x) % getMod());
        return *this;
    }
    constexpr MLong &operator-=(MLong rhs) & {
        x = norm(x - rhs.x);
        return *this;
    }
    constexpr MLong &operator/=(MLong rhs) & {
        return *this *= rhs.inv();
    }
    friend constexpr MLong operator*(MLong lhs, MLong rhs) {
        MLong res = lhs;
        res *= rhs;
        return res;
    }
    friend constexpr MLong operator+(MLong lhs, MLong rhs) {
        MLong res = lhs;
        res += rhs;
        return res;
    }
    friend constexpr MLong operator-(MLong lhs, MLong rhs) {
        MLong res = lhs;
        res -= rhs;
        return res;
    }
    friend constexpr MLong operator/(MLong lhs, MLong rhs) {
        MLong res = lhs;
        res /= rhs;
        return res;
    }
    friend constexpr std::istream &operator>>(std::istream &is, MLong &a) {
        i64 v;
        if (is >> v)
            a = MLong(v);
        return is;
    }
    friend constexpr std::ostream &operator<<(std::ostream &os, const MLong &a) {
        return os << a.val();
    }
    friend constexpr bool operator==(MLong lhs, MLong rhs) {
        return lhs.val() == rhs.val();
    }
    friend constexpr bool operator!=(MLong lhs, MLong rhs) {
        return lhs.val() != rhs.val();
    }
};

template <> i64 MLong<0LL>::Mod = 1000000007LL;

template <int P> struct MInt {
    int x;

    constexpr MInt() : x{} {}
    // 将有符号整数转为当前模数下的非负余数。
    constexpr MInt(i64 x) : x{norm(int(x % getMod()))} {}

    static int Mod;
    // 返回模板指定的模数；P=0 时使用 setMod 设置的值。
    constexpr static int getMod() {
        return P > 0 ? P : Mod;
    }
    // 设置动态模数，仅 P=0 时生效；须在创建数值前设置，求逆要求素数。
    constexpr static void setMod(int Mod_) {
        Mod = Mod_;
    }
    // 将 (-mod,2*mod) 范围内的值修正到 [0,mod)，调用者保证 int 运算不溢出。
    constexpr int norm(int x) const {
        if (x < 0) {
            x += getMod();
        }
        if (x >= getMod()) {
            x -= getMod();
        }
        return x;
    }
    // 返回 [0,mod) 的整数余数，用于输出或与普通整数计算。
    constexpr int val() const {
        return x;
    }
    explicit constexpr operator int() const {
        return x;
    }
    constexpr MInt operator-() const {
        MInt res;
        res.x = norm(getMod() - x);
        return res;
    }
    // 返回非零数的乘法逆元，当前模数必须为素数。
    constexpr MInt inv() const {
        assert(x != 0);
        return power(*this, getMod() - 2);
    }
    constexpr MInt &operator*=(MInt rhs) & {
        x = int(1LL * x * rhs.x % getMod());
        return *this;
    }
    constexpr MInt &operator+=(MInt rhs) & {
        x = int((i64(x) + rhs.x) % getMod());
        return *this;
    }
    constexpr MInt &operator-=(MInt rhs) & {
        x = norm(x - rhs.x);
        return *this;
    }
    constexpr MInt &operator/=(MInt rhs) & {
        return *this *= rhs.inv();
    }
    friend constexpr MInt operator*(MInt lhs, MInt rhs) {
        MInt res = lhs;
        res *= rhs;
        return res;
    }
    friend constexpr MInt operator+(MInt lhs, MInt rhs) {
        MInt res = lhs;
        res += rhs;
        return res;
    }
    friend constexpr MInt operator-(MInt lhs, MInt rhs) {
        MInt res = lhs;
        res -= rhs;
        return res;
    }
    friend constexpr MInt operator/(MInt lhs, MInt rhs) {
        MInt res = lhs;
        res /= rhs;
        return res;
    }
    friend constexpr std::istream &operator>>(std::istream &is, MInt &a) {
        i64 v;
        if (is >> v)
            a = MInt(v);
        return is;
    }
    friend constexpr std::ostream &operator<<(std::ostream &os, const MInt &a) {
        return os << a.val();
    }
    friend constexpr bool operator==(MInt lhs, MInt rhs) {
        return lhs.val() == rhs.val();
    }
    friend constexpr bool operator!=(MInt lhs, MInt rhs) {
        return lhs.val() != rhs.val();
    }
};

template <> int MInt<0>::Mod = 1000000007;

template <int V, int P> constexpr MInt<P> CInv = MInt<P>(V).inv();

// 库级默认模数：素数 1000000007。07 - 多项式 的 NTT 使用 998244353，
// 已隔离在 namespace poly 内，不与这里的 P 冲突。
#ifndef XCPC_MODINT_P
#define XCPC_MODINT_P
constexpr int P = 1000000007;
#endif
using Z = MInt<P>;

#endif // XCPC_MODINT
namespace directed_tree {
    namespace detail {
        template <class T> T det(std::vector<std::vector<T>> a) {
            int n = a.size();
            T ans = 1;
            for (int i = 0; i < n; i++) {
                int p = i;
                for (int j = i + 1; j < n; j++) {
                    if (a[j][i] != 0) {
                        p = j;
                        break;
                    }
                }
                if (a[p][i] == 0) {
                    return 0;
                }
                if (p != i) {
                    std::swap(a[i], a[p]);
                    ans = -ans;
                }
                ans *= a[i][i];
                T inv = a[i][i].inv();
                for (int j = i + 1; j < n; j++) {
                    T t = a[j][i] * inv;
                    for (int k = i; k < n; k++) {
                        a[j][k] -= t * a[i][k];
                    }
                }
            }
            return ans;
        }

    }
    // 返回树的边权乘积之和；type=0无向/1外向/2内向，删除root对应行列。
    Z weighted(int n, const std::vector<std::tuple<int, int, Z>> &edges, int root, int type) {
        assert(n >= 1 && root >= 0 && root < n && type >= 0 && type <= 2);
        std::vector<std::vector<Z>> a(n - 1, std::vector<Z>(n - 1));
        auto index = [&](int u) { return u < root ? u : u - 1; };
        auto add = [&](int u, int v, Z w) {
            if (u != root && v != root)
                a[index(u)][index(v)] += w;
        };
        for (auto [u, v, w] : edges) {
            assert(u >= 0 && u < n && v >= 0 && v < n);
            if (u == v)
                continue;
            if (type == 0) {
                add(u, u, w);
                add(v, v, w);
                add(u, v, -w);
                add(v, u, -w);
            } else if (type == 1) {
                add(v, v, w);
                add(u, v, -w);
            } else {
                add(u, u, w);
                add(u, v, -w);
            }
        }
        return detail::det(a);
    }
    // 返回从start到end使用每条有向边恰一次的序列数（首边未固定）。
    Z eulerTrails(int n, const std::vector<std::pair<int, int>> &arcs, int start, int end) {
        assert(n >= 1 && start >= 0 && start < n && end >= 0 && end < n && arcs.size() < P);
        if (arcs.empty())
            return start == end ? Z(1) : Z(0);
        std::vector<int> in(n), out(n);
        for (auto [u, v] : arcs) {
            assert(u >= 0 && u < n && v >= 0 && v < n);
            ++out[u];
            ++in[v];
        }
        for (int u = 0; u < n; ++u)
            if (out[u] - in[u] != (u == start) - (u == end))
                return 0;
        if (!out[start])
            return 0;
        std::vector<int> id(n, -1);
        int k = 0;
        for (int u = 0; u < n; ++u)
            if (in[u] || out[u])
                id[u] = k++;
        std::vector<std::tuple<int, int, Z>> e;
        for (auto [u, v] : arcs)
            e.emplace_back(id[u], id[v], 1);
        Z ans = weighted(k, e, id[end], 2);
        std::vector<Z> fact(arcs.size() + 1, 1);
        for (int i = 1; i < (int)fact.size(); ++i)
            fact[i] = fact[i - 1] * i;
        for (int u = 0; u < n; ++u)
            if (id[u] >= 0) {
                int d = out[u] - 1 + (u == end);
                if (d < 0)
                    return 0;
                ans *= fact[d];
            }
        return ans;
    }
}
```
