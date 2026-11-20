# 集合幂级数（子集卷积 inv ln exp pow）

模 mod=998244353，系数规范；数组非空且长度为 2^k，k<=20；卷积两输入同长。 inverse、log 要求 f[0]!=0，exp 要求 f[0]=0，power 指数非负。 下标 S 为集合位掩码，0 为空集；所有输出与输入等长；log 计算 log(f/f[0])，结果系数在 [0,mod)。

multiply/inverse/log/exp O(k^2 2^k)；power O(k^2 2^k log e)。

```cpp
namespace set_fps {
    using V = std::vector<int>;
    constexpr int mod = 998244353;
    namespace detail {
        int scalarPower(int a, long long e) {
            int r = 1;
            for (; e; e >>= 1, a = 1LL * a * a % mod)
                if (e & 1)
                    r = 1LL * r * a % mod;
            return r;
        }
        int bits(const V &f) {
            assert(!f.empty() && (f.size() & (f.size() - 1)) == 0 && f.size() <= (1 << 20));
            return __builtin_ctz((unsigned)f.size());
        }
        void zeta(V &v, int sign) {
            for (int b = 1; b < (int)v.size(); b <<= 1)
                for (int s = 0; s < (int)v.size(); ++s)
                    if (s & b)
                        v[s] = (v[s] + 1LL * sign * v[s ^ b] + mod) % mod;
        }
    }
    // 返回不相交子集卷积；要求 f、g 等长
    V multiply(const V &f, const V &g) {
        int k = detail::bits(f), n = f.size();
        assert(g.size() == f.size());
        std::vector<V> a(k + 1, V(n)), b = a, c = a;
        for (int s = 0; s < n; ++s) {
            int j = __builtin_popcount((unsigned)s);
            a[j][s] = f[s];
            b[j][s] = g[s];
        }
        for (int j = 0; j <= k; ++j)
            detail::zeta(a[j], 1), detail::zeta(b[j], 1);
        for (int j = 0; j <= k; ++j)
            for (int i = 0; i <= j; ++i)
                for (int s = 0; s < n; ++s)
                    c[j][s] = (c[j][s] + 1LL * a[i][s] * b[j - i][s]) % mod;
        for (int j = 0; j <= k; ++j)
            detail::zeta(c[j], -1);
        V h(n);
        for (int s = 0; s < n; ++s)
            h[s] = c[__builtin_popcount((unsigned)s)][s];
        return h;
    }
    // 返回集合环乘法逆；要求 f[0] != 0
    V inverse(const V &f) {
        detail::bits(f);
        assert(f[0] != 0);
        if (f.size() == 1)
            return {detail::scalarPower(f[0], mod - 2)};
        int n = f.size() / 2;
        V low(f.begin(), f.begin() + n), high(f.begin() + n, f.end());
        auto g = inverse(low);
        auto h = multiply(multiply(high, g), g);
        for (auto &x : h)
            if (x)
                x = mod - x;
        g.insert(g.end(), h.begin(), h.end());
        return g;
    }
    // 返回集合环指数；要求 f[0] = 0
    V exp(const V &f) {
        detail::bits(f);
        assert(f[0] == 0);
        if (f.size() == 1)
            return {1};
        int n = f.size() / 2;
        V low(f.begin(), f.begin() + n), high(f.begin() + n, f.end());
        auto g = exp(low);
        auto h = multiply(g, high);
        g.insert(g.end(), h.begin(), h.end());
        return g;
    }
    // 返回集合环对数；要求 f[0] != 0
    V log(const V &f) {
        detail::bits(f);
        assert(f[0] != 0);
        if (f.size() == 1)
            return {0};
        int n = f.size() / 2;
        V low(f.begin(), f.begin() + n), high(f.begin() + n, f.end());
        auto g = log(low);
        auto h = multiply(high, inverse(low));
        g.insert(g.end(), h.begin(), h.end());
        return g;
    }
    // 返回集合环整数幂；e = 0 返回单位元
    V power(V f, long long e) {
        detail::bits(f);
        assert(e >= 0);
        V r(f.size());
        r[0] = 1;
        for (; e; e >>= 1, f = multiply(f, f))
            if (e & 1)
                r = multiply(r, f);
        return r;
    }
}
```
