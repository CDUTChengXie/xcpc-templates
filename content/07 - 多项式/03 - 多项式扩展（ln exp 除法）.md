# 多项式扩展（ln exp 除法）

模 MOD=998244353，系数规范到 [0,MOD)；输入项数、积分后的次数和截断长度均须小于 MOD，所需 NTT 长度<=2^23。 ln 要求 f 非空且 f[0]=1，exp 要求 f 非空且 f[0]=0，inv 要求常数非零；这些条件在 count<=0 时仍需满足。

各数组的第 i 项为 x^i 系数；截断运算返回 count 项，count<=0 返回空；整数指数须非负。 幂允许空、全零和低次零系数；k=0 返回单位元（合并后不改变另一项的值）；字符串指数允许前导零，非法串（包括空串、符号）抛 invalid_argument。

除法自动去掉高次零，零多项式用 {0}；g=0 时保留旧退化结果 {商{0},余f}，有效多项式除法须用非零 g。

derivative O(n)；integral O(n log MOD)；ln/exp/pow/divMod O(m log m)。

```cpp
namespace poly {

// NTT 副本（自带 XCPC_TEMPLATE_NTT 保护，与 07 - 多项式/01 同时复制时不重复定义）
#ifndef XCPC_TEMPLATE_NTT
#define XCPC_TEMPLATE_NTT

    constexpr int MOD = 998244353;
    constexpr int ROOT = 3;

    // 返回 a^b mod MOD，要求 b >= 0
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

    // 原地正变换；要求 a.size() 是大于 1 的 2 的幂
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
                // 必须用 (MOD - 1) >> (k + 1)；998244353 - 1 含因子 119
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

    // 原地逆变换；要求 a.size() 是大于 1 的 2 的幂
    void idft(std::vector<int> &a) {
        int n = a.size();
        std::reverse(a.begin() + 1, a.end());
        dft(a);
        // 必须取正代表元，避免后续乘法产生负余数
        int inv = MOD - (MOD - 1) / n;
        for (int i = 0; i < n; i++) {
            a[i] = int(1LL * a[i] * inv % MOD);
        }
    }

    // 返回乘积系数，result[i] 对应 x^i；任一输入为空返回空
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

    // 返回 1/f 的前 m 项系数，result[i] 对应 x^i；要求 f 非空且 f[0]!=0
    std::vector<int> polyInv(std::vector<int> f, int m) {
        assert(!f.empty() && f[0] != 0 && "polyInv 要求 f[0] != 0");
        if (m <= 0) {
            return {};
        }
        std::vector<int> g(1, powerMod(f[0], MOD - 2));
        for (int len = 1; len < m; len *= 2) {
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

    // 返回导函数系数，result[i]=(i+1)*f[i+1]；常数或空输入返回空
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

    // 返回积分系数，result[0]=0，result[i+1]=f[i]/(i+1)
    std::vector<int> polyIntegral(const std::vector<int> &f) {
        std::vector<int> res(f.size() + 1, 0);
        for (int i = 0; i < int(f.size()); i++) {
            res[i + 1] = int(1LL * f[i] * powerMod(i + 1, MOD - 2) % MOD);
        }
        return res;
    }

    // 返回 ln(f) 的前 m 项，result[i] 是 x^i 系数；要求 f 非空且 f[0]=1
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

    // 返回 exp(f) 的前 m 项，result[i] 是 x^i 系数；要求 f 非空且 f[0]=0
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

    // 返回乘积系数，result[i] 是 x^i 系数；任一输入为空返回空
    std::vector<int> polyMul(const std::vector<int> &a, const std::vector<int> &b) {
        return nttMul(a, b);
    }

    // 返回 {q, r} 使 f = qg + r 且 deg r < deg g；deg f < deg g 时 q = {0}
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

    // 返回余式系数，result[i] 是 x^i 系数；有效除法要求 g 非零
    std::vector<int> polyMod(std::vector<int> f, std::vector<int> g) {
        return polyDivMod(std::move(f), std::move(g)).second;
    }

    // 返回 f^k 的前 m 项，result[i] 是 x^i 系数；k 必须非负
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

#ifndef XCPC_POLY_STRING_POWER
#define XCPC_POLY_STRING_POWER
    // 返回 f^k 的前 m 项，k 是十进制字符串；非法输入抛 invalid_argument
    std::vector<int> polyPow(const std::vector<int> &f, std::string_view k, int m) {
        if (k.empty())
            throw std::invalid_argument("polyPow: empty decimal exponent");
        int modP = 0, modPhi = 0;
        i64 bounded = 0;
        for (char c : k) {
            if (c < '0' || c > '9')
                throw std::invalid_argument("polyPow: invalid decimal exponent");
            int digit = c - '0';
            modP = int((10LL * modP + digit) % MOD);
            modPhi = int((10LL * modPhi + digit) % (MOD - 1));
            bounded = std::min<i64>(std::max(m, 1), bounded * 10 + digit);
        }
        if (m <= 0)
            return {};
        if (bounded == 0)
            return polyPow(f, i64(0), m);
        int shift = 0;
        while (shift < int(f.size()) && f[shift] == 0)
            ++shift;
        if (shift == int(f.size()) || (shift && bounded > (m - 1) / shift))
            return std::vector<int>(m, 0);
        if (shift)
            return polyPow(f, bounded, m); // 能留下非零项时，bounded就是未缩减的真指数。
        i64 reduced = modP + i64(MOD) * ((modPhi - modP + MOD - 1) % (MOD - 1));
        return polyPow(f, reduced, m); // P与P-1互素；m<P时相同两种余数给出相同截断幂。
    }
#endif // XCPC_POLY_STRING_POWER
} // namespace poly
```
