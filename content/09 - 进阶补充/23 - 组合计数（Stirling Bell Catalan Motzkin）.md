# 组合计数（Stirling Bell Catalan Motzkin）

模 998244353；n>=0，Classic(limit) 需 0<=limit<MOD-2；卷积补齐后的 NTT 长度 ≤ 2^23。 第一类 Stirling 不带符号；secondRow(n)[k]=S(n,k)，firstRow(n)[k]=[n,k]，下标 [0,n]。

第二类 O(n log n)，第一类 O(n log² n)，Bell O(n log n + n log MOD)，Classic O(n + log MOD)。

```cpp
namespace poly {

// NTT 副本（自带 XCPC_TEMPLATE_NTT 保护，与 07 - 多项式/01 同时复制时不重复定义）
#ifndef XCPC_TEMPLATE_NTT
#define XCPC_TEMPLATE_NTT

    constexpr int MOD = 998244353;
    constexpr int ROOT = 3;

    // 返回 a 的 b 次幂模 MOD，b>=0。
    int powerMod(int a, i64 b) {
        i64 res = 1, x = a;
        for (; b; b >>= 1, x = x * x % MOD) {
            if (b & 1) {
                res = res * x % MOD;
            }
        }
        return int(res);
    }

    std::vector<int> rev, roots{0, 1};

    // 原地正变换；长度为至少 2 的二次幂且不超过 2^23，系数在 [0,MOD)。
    void dft(std::vector<int> &a) {
        int n = a.size();
        if (int(rev.size()) != n) {
            int k = __builtin_ctz(unsigned(n)) - 1;
            rev.resize(n);
            for (int i = 0; i < n; i++) {
                rev[i] = rev[i >> 1] >> 1 | (i & 1) << k;
            }
        }
        for (int i = 0; i < n; i++) {
            if (rev[i] < i) {
                std::swap(a[i], a[rev[i]]);
            }
        }
        if (int(roots.size()) < n) {
            int k = __builtin_ctz(unsigned(roots.size()));
            roots.resize(n);
            while ((1 << k) < n) {
                // ω_{2^{k+1}} = ROOT^{(MOD-1) / 2^{k+1}}
                // 必须写成 (MOD - 1) >> (k + 1)：998244353 - 1 = 119 * 2^23，
                // 直接用 2^{23-k-1} 会漏掉因子 119，得到错误的单位根。
                int e = powerMod(ROOT, (MOD - 1) >> (k + 1));
                for (int i = 1 << (k - 1); i < (1 << k); i++) {
                    roots[2 * i] = roots[i];
                    roots[2 * i + 1] = int(1LL * roots[i] * e % MOD);
                }
                k++;
            }
        }

        for (int k = 1; k < n; k *= 2) {
            for (int i = 0; i < n; i += 2 * k) {
                for (int j = 0; j < k; j++) {
                    int u = a[i + j];
                    int v = int(1LL * a[i + j + k] * roots[k + j] % MOD);
                    a[i + j] = (u + v) % MOD;
                    a[i + j + k] = (u - v + MOD) % MOD;
                }
            }
        }
    }

    // 原地逆变换，还原系数；长度要求同 dft。
    void idft(std::vector<int> &a) {
        int n = a.size();
        std::reverse(a.begin() + 1, a.end());
        dft(a);
        // n | (MOD - 1)，故 n^{-1} ≡ -(MOD-1)/n ≡ MOD - (MOD-1)/n (mod MOD)。
        // 这里必须用正数代表元：写成 (1 - MOD) / n 会得到负数，
        // 随后的 a[i] * inv % MOD 会产出负余数（依赖后续再次规范化才能得到正确结果）。
        int inv = MOD - (MOD - 1) / n;
        for (int i = 0; i < n; i++) {
            a[i] = int(1LL * a[i] * inv % MOD);
        }
    }

    // 返回多项式乘积，第 i 项为 x^i 系数；输入空数组则返回空。
    std::vector<int> nttMul(std::vector<int> a, std::vector<int> b) {
        if (a.empty() || b.empty()) {
            return {};
        }
        int n = 1, tot = int(a.size() + b.size() - 1);
        while (n < tot && n <= (1 << 23)) {
            n *= 2;
        }
        assert(n >= tot && "NTT 长度超出 998244353 支持的 2^23，请改用 469762049 或拆分卷积");
        if (tot < 128) {
            std::vector<int> c(tot, 0);
            int na = a.size(), nb = b.size();
            for (int i = 0; i < na; i++) {
                for (int j = 0; j < nb; j++) {
                    c[i + j] = int((c[i + j] + 1LL * a[i] * b[j]) % MOD);
                }
            }
            return c;
        }
        a.resize(n);
        b.resize(n);
        dft(a);
        dft(b);
        for (int i = 0; i < n; i++) {
            a[i] = int(1LL * a[i] * b[i] % MOD);
        }
        idft(a);
        a.resize(tot);
        return a;
    }

    // f 的乘法逆元的前 m 项：f * g ≡ 1 (mod x^m)，要求 f[0] != 0
    std::vector<int> polyInv(std::vector<int> f, int m) {
        assert(!f.empty() && f[0] != 0 && "polyInv 要求 f[0] != 0");
        if (m <= 0) {
            return {};
        }
        std::vector<int> g(1, powerMod(f[0], MOD - 2));
        for (int len = 1; len < m; len *= 2) {
            // g <- g * (2 - f * g) mod x^(2*len)
            std::vector<int> t(f.begin(), f.begin() + std::min(2 * len, int(f.size())));
            auto h = nttMul(t, g);
            h.resize(2 * len, 0);
            for (int i = 0; i < 2 * len; i++) {
                h[i] = (MOD - h[i]) % MOD;
            }
            h[0] = (h[0] + 2) % MOD;
            g = nttMul(g, h);
            g.resize(2 * len);
        }
        g.resize(m);
        return g;
    }

#endif // XCPC_TEMPLATE_NTT

#ifndef XCPC_POLY_EXTENSIONS
#define XCPC_POLY_EXTENSIONS

    // 多项式求导：f' 的长度是 deg f
    std::vector<int> polyDerivative(const std::vector<int> &f) {
        if (f.size() <= 1) {
            return {};
        }
        std::vector<int> res(f.size() - 1);
        for (int i = 1; i < int(f.size()); i++) {
            res[i - 1] = int(1LL * f[i] * i % MOD);
        }
        return res;
    }

    // 多项式积分：常数项取 0，长度是 deg f + 1
    std::vector<int> polyIntegral(const std::vector<int> &f) {
        std::vector<int> res(f.size() + 1, 0);
        // f[i] 是 x^i 的系数，积分后成为 x^(i+1) 的系数，故循环要覆盖全部 f 的下标
        for (int i = 0; i < int(f.size()); i++) {
            res[i + 1] = int(1LL * f[i] * powerMod(i + 1, MOD - 2) % MOD);
        }
        return res;
    }

    // 多项式 ln：ln f = ∫ f' / f，要求 f[0] = 1，取前 m 项
    std::vector<int> polyLn(const std::vector<int> &f, int m) {
        assert(!f.empty() && f[0] == 1 && "polyLn 要求 f[0] == 1");
        if (m <= 0) {
            return {};
        }
        if (m == 1) {
            return {0};
        }
        auto g = polyDerivative(f);
        auto inv = polyInv(f, m);
        auto h = nttMul(g, inv);
        h.resize(m - 1, 0);
        auto res = polyIntegral(h);
        res.resize(m, 0);
        return res;
    }

    // 多项式 exp：exp f，要求 f[0] = 0，取前 m 项；牛顿迭代 g <- g(1 + f - ln g)
    std::vector<int> polyExp(const std::vector<int> &f, int m) {
        assert(!f.empty() && f[0] == 0 && "polyExp 要求 f[0] == 0");
        if (m <= 0) {
            return {};
        }
        std::vector<int> g(1, 1);
        for (int cur = 1; cur < m; cur <<= 1) {
            int nxt = min(2 * cur, m);
            auto lg = polyLn(g, nxt);
            std::vector<int> t(nxt, 0);
            for (int i = 0; i < nxt && i < int(f.size()); i++) {
                t[i] = f[i];
            }
            t[0] = (t[0] + 1) % MOD;
            for (int i = 0; i < nxt; i++) {
                t[i] = (t[i] - lg[i] + MOD) % MOD;
            }
            auto ng = nttMul(g, t);
            ng.resize(nxt, 0);
            g = ng;
        }
        g.resize(m, 0);
        return g;
    }

    // 多项式乘法（与 nttMul 同，导出别名以便统一命名）
    std::vector<int> polyMul(const std::vector<int> &a, const std::vector<int> &b) {
        return nttMul(a, b);
    }

    // 多项式除法取模：f = q * g + r，deg r < deg g。返回 {q, r}。
    // deg f < deg g 时约定 q = {0}；f 视为零多项式时返回 {{0}, {0}}。
    std::pair<std::vector<int>, std::vector<int>> polyDivMod(std::vector<int> f,
                                                             std::vector<int> g) {
        auto trim = [](std::vector<int> &a) {
            while (!a.empty() && a.back() == 0) {
                a.pop_back();
            }
            if (a.empty()) {
                a = {0};
            }
        };
        trim(f);
        trim(g);
        int df = int(f.size()) - 1, dg = int(g.size()) - 1;
        if (g == std::vector<int>{0}) {
            return {{0}, f}; // 除数为零多项式，退化为返回 f
        }
        if (df < dg) {
            return {{0}, f};
        }
        auto rev = [](const std::vector<int> &a) {
            std::vector<int> r = a;
            std::reverse(r.begin(), r.end());
            return r;
        };
        int k = df - dg + 1;
        auto invg = polyInv(rev(g), k);
        auto q = nttMul(rev(f), invg);
        q.resize(k, 0);
        std::reverse(q.begin(), q.end());
        trim(q);
        auto p = nttMul(q, g);
        std::vector<int> r(f.size(), 0);
        for (int i = 0; i < int(r.size()); i++) {
            r[i] = ((f[i] - (i < int(p.size()) ? p[i] : 0)) % MOD + MOD) % MOD;
        }
        trim(r);
        return {q, r};
    }

    // 多项式取余：只返回余式 r
    std::vector<int> polyMod(std::vector<int> f, std::vector<int> g) {
        return polyDivMod(std::move(f), std::move(g)).second;
    }

    // 多项式乘方：f^k 的前 m 项
    std::vector<int> polyPow(const std::vector<int> &f, i64 k, int m) {
        assert(k >= 0 && "polyPow 要求 k >= 0");
        if (m <= 0)
            return {};
        if (k == 0) {
            std::vector<int> r(m, 0);
            if (m > 0) {
                r[0] = 1;
            }
            return r;
        }
        int shift = 0;
        while (shift < int(f.size()) && f[shift] == 0)
            ++shift;
        if (shift == int(f.size()) || (shift && k > (m - 1) / shift))
            return std::vector<int>(m, 0);
        if (shift) {
            auto tail =
                polyPow(std::vector<int>(f.begin() + shift, f.end()), k, m - int(shift * k));
            tail.insert(tail.begin(), int(shift * k), 0);
            return tail;
        }
        auto normalized = f;
        int inverse = powerMod(f[0], MOD - 2);
        for (auto &value : normalized)
            value = int(1LL * value * inverse % MOD);
        auto g = polyLn(normalized, m);
        std::vector<int> kg(m, 0);
        for (int i = 0; i < m; i++) {
            kg[i] = int(1LL * g[i] * (k % MOD) % MOD);
        }
        auto result = polyExp(kg, m);
        int factor = powerMod(f[0], k);
        for (auto &value : result)
            value = int(1LL * value * factor % MOD);
        return result;
    }

#endif // XCPC_POLY_EXTENSIONS
} // namespace poly

#ifndef XCPC_COUNTING_MODELS
#define XCPC_COUNTING_MODELS
namespace counting {
    using V = std::vector<int>;
    constexpr int mod = poly::MOD;
    struct Classic {
        V fact, invfact, derangement,
            motzkin; // 第 i 项分别为 i!、1/i!、i 元错排数、长度 i 的 Motzkin 路径数
        // 建立 [0,n] 的序列表，n>=0且n+2<mod。
        explicit Classic(int n)
            : fact(n + 1, 1), invfact(n + 1, 1), derangement(n + 1), motzkin(n + 1, 1) {
            assert(n >= 0 && n < mod - 2);
            V inv(n + 3);
            inv[1] = 1;
            for (int i = 2; i <= n + 2; ++i)
                inv[i] = 1LL * (mod - mod / i) * inv[mod % i] % mod;
            for (int i = 1; i <= n; ++i)
                fact[i] = 1LL * fact[i - 1] * i % mod;
            invfact[n] = poly::powerMod(fact[n], mod - 2);
            for (int i = n; i > 0; --i)
                invfact[i - 1] = 1LL * invfact[i] * i % mod;
            derangement[0] = 1;
            if (n)
                derangement[1] = 0;
            for (int i = 2; i <= n; ++i) {
                derangement[i] = 1LL * (i - 1) * (derangement[i - 1] + derangement[i - 2]) % mod;
                motzkin[i] = (1LL * (2 * i + 1) * motzkin[i - 1] + 3LL * (i - 1) * motzkin[i - 2]) %
                             mod * inv[i + 2] % mod;
            }
        }
        // 返回 C(n,k)，越界k返回0，n须已预处理。
        int choose(int n, int k) const {
            assert(n >= 0 && n < (int)fact.size());
            if (k < 0 || k > n)
                return 0;
            return 1LL * fact[n] * invfact[k] % mod * invfact[n - k] % mod;
        }
        // 返回 Catalan(n)，n>=0且表覆盖2n。
        int catalan(int n) const {
            assert(n >= 0 && 2LL * n < (int)fact.size());
            return (choose(2 * n, n) - choose(2 * n, n + 1) + mod) % mod;
        }
        // 返回 k叉有序树 Fuss-Catalan(n)，k=1时恒1，n=0时1。
        int fussCatalan(int n, int k) const {
            assert(n >= 0 && k >= 1 && 1LL * k * n < (int)fact.size());
            int total = k * n, den = (k - 1) * n + 1;
            return 1LL * choose(total, n) * poly::powerMod(den, mod - 2) % mod;
        }
    };
    // 第二类 Stirling 第n行，返回 k∈[0,n] 的集合划分数。
    V secondRow(int n) {
        assert(n >= 0 && n < mod);
        Classic t(n);
        V a(n + 1), b(n + 1);
        for (int i = 0; i <= n; ++i) {
            a[i] = 1LL * poly::powerMod(i, n) * t.invfact[i] % mod;
            b[i] = (i & 1) ? (mod - t.invfact[i]) % mod : t.invfact[i];
        }
        auto s = poly::nttMul(a, b);
        s.resize(n + 1);
        return s;
    }
    // 第一类 Stirling 第n行，返回 k∈[0,n] 的排列循环分解数。
    V firstRow(int n) {
        assert(n >= 0 && n < mod);
        auto rec = [&](auto &&self, int l, int r) -> V {
            if (l == r)
                return {1};
            if (r - l == 1)
                return {l, 1};
            int m = (l + r) / 2;
            return poly::nttMul(self(self, l, m), self(self, m, r));
        };
        return rec(rec, 0, n);
    }
    // Bell 前缀，返回 n个标号元素任意集合划分数 B[0..n]。
    V bell(int n) {
        assert(n >= 0 && n < mod);
        Classic t(n);
        V f = t.invfact;
        f[0] = 0;
        auto b = poly::polyExp(f, n + 1);
        for (int i = 0; i <= n; ++i)
            b[i] = 1LL * b[i] * t.fact[i] % mod;
        return b;
    }
}

#endif // XCPC_COUNTING_MODELS
```
