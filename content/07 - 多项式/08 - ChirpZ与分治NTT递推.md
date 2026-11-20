# ChirpZ与分治NTT递推

模 998244353，输入系数和 a、q 规范到 [0,MOD)；m>=0；所需 NTT 长度<=2^23。 多项式第 i 项为 x^i 系数；chirpZ 空 f 返回 m 个 0；q=0 时首点为 a、之后为 0，a=0 时全部点为 0。

solve 只读取 g[1..h.size())，g[0] 忽略，缺失项当 0；空 h 返回空。

chirpZ O(M(n+m))；solve O(M(n) log n)。

```cpp
namespace poly {
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
}

namespace convolution_dp {
    using V = std::vector<int>;
    constexpr int mod = poly::MOD;
    // 返回 f(a*q^i)，i 在 [0, m)；f 为空返回全 0
    V chirpZ(V f, int a, int q, int m) {
        assert(m >= 0 && a >= 0 && a < mod && q >= 0 && q < mod);
        V ans(m);
        if (!m || f.empty())
            return ans;
        if (a == 0) {
            std::fill(ans.begin(), ans.end(), f[0]);
            return ans;
        }
        if (q == 0) {
            long long v = 0;
            for (int i = (int)f.size() - 1; i >= 0; --i)
                v = (v * a + f[i]) % mod;
            ans[0] = v;
            for (int i = 1; i < m; ++i)
                ans[i] = f[0];
            return ans;
        }
        int n = f.size(), len = n + m - 1;
        V tri(len, 1), invtri(len, 1);
        long long pw = 1, ipw = 1, iq = poly::powerMod(q, mod - 2);
        for (int i = 1; i < len; ++i) {
            tri[i] = tri[i - 1] * pw % mod;
            invtri[i] = invtri[i - 1] * ipw % mod;
            pw = pw * q % mod;
            ipw = ipw * iq % mod;
        }
        long long pa = 1;
        for (int i = 0; i < n; ++i) {
            f[i] = f[i] * pa % mod * invtri[i] % mod;
            pa = pa * a % mod;
        }
        std::reverse(f.begin(), f.end());
        auto c = poly::nttMul(f, tri);
        for (int i = 0; i < m; ++i)
            ans[i] = 1LL * c[n - 1 + i] * invtri[i] % mod;
        return ans;
    }
    // 返回 h 驱动的卷积递推序列；空 h 返回空，g 缺失系数视为 0
    V solve(const V &h, const V &g) {
        int n = h.size();
        V f = h;
        auto cdq = [&](auto &&self, int l, int r) -> void {
            if (r - l <= 1)
                return;
            int mid = (l + r) / 2;
            self(self, l, mid);
            V a(f.begin() + l, f.begin() + mid), b(std::min(r - l, (int)g.size()));
            for (int i = 1; i < (int)b.size(); ++i)
                b[i] = g[i];
            auto c = poly::nttMul(a, b);
            for (int i = mid; i < r; ++i)
                if (i - l < (int)c.size())
                    f[i] = (f[i] + c[i - l]) % mod;
            self(self, mid, r);
        };
        cdq(cdq, 0, n);
        return f;
    }
}
```
